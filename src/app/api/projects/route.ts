import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongoose';
import Project from '@/models/Project';
import { getUserIdFromRequest } from '@/lib/auth';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const userId = getUserIdFromRequest(req);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const projects = await Project.find({ userId }).sort({ updatedAt: -1 });
    return NextResponse.json(projects);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

const EVENT_THUMBNAILS: Record<string, string> = {
  'Wedding':      'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?q=80&w=2400&auto=format&fit=crop',
  'Conference':   'https://images.unsplash.com/photo-1587825140708-dfaf72ae4b04?q=80&w=2400&auto=format&fit=crop',
  'Gala Dinner':  'https://images.unsplash.com/photo-1566417713940-fe7c737a9ef2?q=80&w=2400&auto=format&fit=crop',
};

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const userId = getUserIdFromRequest(req);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name, client, event, eventType, location, budget, currency, billingStatus, status } = await req.json();
    if (!name) {
      return NextResponse.json({ error: 'Project name is required' }, { status: 400 });
    }

    const resolvedType = eventType ?? 'Wedding';
    const thumbnail = EVENT_THUMBNAILS[resolvedType] ?? EVENT_THUMBNAILS['Wedding'];

    const project = await Project.create({
      name,
      client,
      event,
      eventType:     resolvedType,
      location,
      status:        status        ?? 'Draft',
      thumbnail,
      budget:        budget        ?? 0,
      currency:      currency      ?? 'USD',
      billingStatus: billingStatus ?? 'pending',
      userId,
    });

    return NextResponse.json(project, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
