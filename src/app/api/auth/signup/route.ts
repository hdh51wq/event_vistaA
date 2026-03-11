import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongoose';
import User from '@/models/User';
import { hashPassword, signToken } from '@/lib/auth';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const { name, email, password } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json({ error: 'User already exists' }, { status: 400 });
    }

    const hashedPassword = await hashPassword(password);
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
    });

    const token = signToken({ id: user._id });

    return NextResponse.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        agencyName: user.agencyName,
      },
      token,
    }, { status: 201 });
  } catch (error: any) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { error: error?.message || 'Signup failed' },
      { status: 500 }
    );
  }
}
