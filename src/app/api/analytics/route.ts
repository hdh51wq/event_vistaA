import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongoose';
import Project from '@/models/Project';
import { getUserIdFromRequest } from '@/lib/auth';
import mongoose from 'mongoose';

export const runtime = 'nodejs';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function getDateRange(startDate?: string | null, endDate?: string | null, range?: string | null) {
  const now = new Date();
  let start: Date;
  let end: Date = new Date(now);
  end.setHours(23, 59, 59, 999);

  switch (range) {
    case 'this_month':
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
    case 'this_quarter': {
      const q = Math.floor(now.getMonth() / 3);
      start = new Date(now.getFullYear(), q * 3, 1);
      break;
    }
    case 'last_30':
      start = new Date(now);
      start.setDate(start.getDate() - 30);
      break;
    case 'last_90':
      start = new Date(now);
      start.setDate(start.getDate() - 90);
      break;
    case 'last_year':
      start = new Date(now.getFullYear() - 1, 0, 1);
      end = new Date(now.getFullYear() - 1, 11, 31, 23, 59, 59, 999);
      break;
    case 'custom':
      start = startDate ? new Date(startDate) : new Date(now.getFullYear(), 0, 1);
      end = endDate ? new Date(endDate + 'T23:59:59') : end;
      break;
    case 'this_year':
    default:
      start = new Date(now.getFullYear(), 0, 1);
  }
  return { start, end };
}

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const userId = getUserIdFromRequest(req);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const dateRange = searchParams.get('dateRange') || 'this_year';
    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');
    const eventTypeParam = searchParams.get('eventType') || '';
    const clientParam = searchParams.get('client') || '';

    const { start, end } = getDateRange(startDateParam, endDateParam, dateRange);

    const userObjectId = new mongoose.Types.ObjectId(userId);

    // Build match filter
    const baseMatch: Record<string, any> = {
      userId: userObjectId,
      createdAt: { $gte: start, $lte: end },
    };
    if (eventTypeParam && eventTypeParam !== 'all') {
      baseMatch.eventType = eventTypeParam;
    }
    if (clientParam && clientParam !== 'all') {
      baseMatch.client = { $regex: clientParam, $options: 'i' };
    }

    // Previous period match
    const periodMs = end.getTime() - start.getTime();
    const prevEnd = new Date(start.getTime() - 1);
    const prevStart = new Date(prevEnd.getTime() - periodMs);
    const prevMatch: Record<string, any> = {
      userId: userObjectId,
      createdAt: { $gte: prevStart, $lte: prevEnd },
    };
    if (eventTypeParam && eventTypeParam !== 'all') prevMatch.eventType = eventTypeParam;
    if (clientParam && clientParam !== 'all') prevMatch.client = { $regex: clientParam, $options: 'i' };

    // All projects for this user (for full-year seasonal data)
    const allMatch = { userId: userObjectId };

    // Run aggregations in parallel
    const [
      currentProjects,
      prevProjects,
      allProjects,
    ] = await Promise.all([
      Project.find(baseMatch).lean(),
      Project.find(prevMatch).lean(),
      Project.find(allMatch).lean(),
    ]);

    // ── REVENUE ──
    const currentRevenue = (currentProjects as any[]).reduce((s: number, p: any) => s + (p.budget || 0), 0);
    const prevRevenue = (prevProjects as any[]).reduce((s: number, p: any) => s + (p.budget || 0), 0);
    const revenueChange = prevRevenue === 0
      ? (currentRevenue > 0 ? 100 : 0)
      : Math.round(((currentRevenue - prevRevenue) / prevRevenue) * 100);

    // Monthly revenue (current year)
    const currentYear = start.getFullYear();
    const monthlyRevenue: Record<number, number> = {};
    const prevYearMonthly: Record<number, number> = {};
    MONTHS.forEach((_, i) => { monthlyRevenue[i] = 0; prevYearMonthly[i] = 0; });

    (allProjects as any[]).forEach((p: any) => {
      const d = new Date(p.createdAt);
      const yr = d.getFullYear();
      const mo = d.getMonth();
      if (yr === currentYear) monthlyRevenue[mo] = (monthlyRevenue[mo] || 0) + (p.budget || 0);
      if (yr === currentYear - 1) prevYearMonthly[mo] = (prevYearMonthly[mo] || 0) + (p.budget || 0);
    });

    const byMonth: any[] = MONTHS.map((m, i) => ({
      month: m,
      current: monthlyRevenue[i],
      previous: prevYearMonthly[i],
    }));

    // Revenue by event type
    const revenueByType: Record<string, number> = {};
    (currentProjects as any[]).forEach((p: any) => {
      const t = p.eventType || 'Other';
      revenueByType[t] = (revenueByType[t] || 0) + (p.budget || 0);
    });
    const byEventType = Object.entries(revenueByType).map(([type, amount]) => ({
      type,
      amount,
      percentage: currentRevenue > 0 ? Math.round((amount / currentRevenue) * 100) : 0,
    })).sort((a, b) => b.amount - a.amount);

    // ── PROJECTS ──
    const byStatus: Record<string, number> = {};
    const byType: Record<string, number> = {};
    (currentProjects as any[]).forEach((p: any) => {
      const s = p.status || 'Draft';
      byStatus[s] = (byStatus[s] || 0) + 1;
      const t = p.eventType || 'Other';
      byType[t] = (byType[t] || 0) + 1;
    });

    const completedCount = byStatus['Final'] || 0;
    const inProgressCount = byStatus['In Progress'] || 0;
    const conversionRate = currentProjects.length > 0
      ? Math.round((completedCount / currentProjects.length) * 100)
      : 0;

    // ── CLIENTS ──
    const clientMap: Record<string, { projects: number; revenue: number; lastProject: Date }> = {};
    (currentProjects as any[]).forEach((p: any) => {
      const c = p.client || 'Unknown';
      if (!clientMap[c]) clientMap[c] = { projects: 0, revenue: 0, lastProject: new Date(p.createdAt) };
      clientMap[c].projects++;
      clientMap[c].revenue += p.budget || 0;
      if (new Date(p.createdAt) > clientMap[c].lastProject) {
        clientMap[c].lastProject = new Date(p.createdAt);
      }
    });

    // Previous period clients
    const prevClientSet = new Set((prevProjects as any[]).map((p: any) => p.client).filter(Boolean));
    const currentClientSet = new Set(Object.keys(clientMap));
    const newClients = [...currentClientSet].filter(c => !prevClientSet.has(c) && c !== 'Unknown').length;
    const returningClients = [...currentClientSet].filter(c => prevClientSet.has(c)).length;

    const topClients = Object.entries(clientMap)
      .map(([name, data]) => ({
        name,
        projects: data.projects,
        revenue: data.revenue,
        averageProjectValue: data.projects > 0 ? Math.round(data.revenue / data.projects) : 0,
        lastProject: data.lastProject.toISOString().split('T')[0],
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    // Industry breakdown by event type (used as proxy for industry)
    const industryMap: Record<string, number> = {};
    (currentProjects as any[]).forEach((p: any) => {
      const t = p.eventType || 'Other';
      industryMap[t] = (industryMap[t] || 0) + 1;
    });
    const totalIndustry = Object.values(industryMap).reduce((s, v) => s + v, 0);
    const byIndustry = Object.entries(industryMap).map(([industry, count]) => ({
      industry,
      percentage: totalIndustry > 0 ? Math.round((count / totalIndustry) * 100) : 0,
    }));

    // ── BUDGET ──
    const totalBudget = currentRevenue;
    const avgBudget = currentProjects.length > 0 ? Math.round(totalBudget / currentProjects.length) : 0;

    // Budget categories (estimated breakdown based on typical event budgets)
    const categories = [
      { category: 'Venue & Setup', pct: 35 },
      { category: 'Furniture',     pct: 15 },
      { category: 'Lighting',      pct: 12 },
      { category: 'Decor',         pct: 18 },
      { category: 'Staffing',      pct: 10 },
      { category: 'Marketing',     pct: 6  },
      { category: 'Misc',          pct: 4  },
    ];
    const byCategory = categories.map(c => ({
      category: c.category,
      amount: Math.round((totalBudget * c.pct) / 100),
      percentage: c.pct,
    }));

    // ── SEASONAL TRENDS ──
    const seasonalMap: Record<number, { projects: number; revenue: number }> = {};
    MONTHS.forEach((_, i) => { seasonalMap[i] = { projects: 0, revenue: 0 }; });
    (allProjects as any[]).forEach((p: any) => {
      const mo = new Date(p.createdAt).getMonth();
      seasonalMap[mo].projects++;
      seasonalMap[mo].revenue += p.budget || 0;
    });

    const seasonalData = MONTHS.map((month, i) => ({
      month,
      projects: seasonalMap[i].projects,
      revenue: seasonalMap[i].revenue,
    }));

    const peakEntry = seasonalData.reduce((best, cur) => cur.projects > best.projects ? cur : best, seasonalData[0]);
    const lowEntry = seasonalData.reduce((low, cur) => cur.projects < low.projects ? cur : low, seasonalData[0]);

    // Growth rate
    const allRevenue = (allProjects as any[]).reduce((s: number, p: any) => s + (p.budget || 0), 0);
    const prevYearRevenue = (allProjects as any[])
      .filter((p: any) => new Date(p.createdAt).getFullYear() === currentYear - 1)
      .reduce((s: number, p: any) => s + (p.budget || 0), 0);
    const thisYearRevenue = (allProjects as any[])
      .filter((p: any) => new Date(p.createdAt).getFullYear() === currentYear)
      .reduce((s: number, p: any) => s + (p.budget || 0), 0);
    const growthRate = prevYearRevenue > 0
      ? Math.round(((thisYearRevenue - prevYearRevenue) / prevYearRevenue) * 100)
      : 0;

    const response = {
      revenue: {
        total: currentRevenue,
        monthly: MONTHS.map((m, i) => ({ month: m, amount: monthlyRevenue[i] })),
        byEventType,
        byMonth,
        comparison: { value: currentRevenue - prevRevenue, percentage: revenueChange },
      },
      projects: {
        total: currentProjects.length,
        byStatus: Object.entries(byStatus).map(([status, count]) => ({ status, count })),
        byType: Object.entries(byType).map(([type, count]) => ({ type, count })),
        completed: completedCount,
        inProgress: inProgressCount,
        averageDuration: 14, // Placeholder: days between creation and final
        conversionRate,
      },
      clients: {
        total: currentClientSet.size,
        new: newClients,
        returning: returningClients,
        topClients,
        byIndustry,
      },
      budget: {
        average: avgBudget,
        byCategory,
        actualVsBudget: 5, // placeholder %
      },
      trends: {
        peakMonth: peakEntry.month,
        lowMonth: lowEntry.month,
        growthRate,
        seasonalData,
      },
    };

    return NextResponse.json(response);
  } catch (error: any) {
    console.error('Analytics error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
