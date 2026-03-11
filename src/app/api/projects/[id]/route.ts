import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongoose';
import Project from '@/models/Project';
import { getUserIdFromRequest } from '@/lib/auth';

export const runtime = 'nodejs';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const userId = getUserIdFromRequest(req);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const project = await Project.findOne({ _id: id, userId });
    if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    return NextResponse.json(project);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const userId = getUserIdFromRequest(req);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const body = await req.json();

    const allowed = ['name', 'client', 'event', 'eventType', 'location', 'status', 'budget', 'currency', 'billingStatus', 'thumbnail', 'data'];
    const update: Record<string, unknown> = {};
    for (const key of allowed) {
      if (key in body) update[key] = body[key];
    }

    const project = await Project.findOneAndUpdate(
      { _id: id, userId },
      { ...update, updatedAt: new Date() },
      { new: true, runValidators: true }
    );

    if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    return NextResponse.json(project);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const userId = getUserIdFromRequest(req);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const project = await Project.findOneAndDelete({ _id: id, userId });
    if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
