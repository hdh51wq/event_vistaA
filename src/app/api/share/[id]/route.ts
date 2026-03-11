import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongoose';
import Project from '@/models/Project';

export const runtime = 'nodejs';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;

    // Fetch the project with only public fields
    const project = await Project.findById(id).select('name client eventType location data createdAt');
    if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 });

    return NextResponse.json(project);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
