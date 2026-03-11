import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongoose';
import User from '@/models/User';
import { getUserIdFromRequest, hashPassword, comparePassword } from '@/lib/auth';

export const runtime = 'nodejs';

// PATCH /api/auth/me — update profile and/or password
export async function PATCH(req: NextRequest) {
  try {
    const userId = getUserIdFromRequest(req);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await connectDB();
    const body = await req.json();
    const { name, email, agencyName, phone, address, currentPassword, newPassword } = body;

    const user = await User.findById(userId);
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    // Update profile fields
    if (name !== undefined) user.name = name;
    if (email !== undefined) user.email = email;
    if (agencyName !== undefined) user.agencyName = agencyName;
    if (phone !== undefined) user.phone = phone;
    if (address !== undefined) user.address = address;

    // Handle password change
    if (newPassword) {
      if (!currentPassword) {
        return NextResponse.json({ error: 'Current password is required' }, { status: 400 });
      }
      if (!user.password) {
        return NextResponse.json({ error: 'No password set for this account' }, { status: 400 });
      }
      const isMatch = await comparePassword(currentPassword, user.password);
      if (!isMatch) {
        return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 });
      }
      if (newPassword.length < 6) {
        return NextResponse.json({ error: 'New password must be at least 6 characters' }, { status: 400 });
      }
      user.password = await hashPassword(newPassword);
    }

    await user.save();

    return NextResponse.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        agencyName: user.agencyName,
        phone: user.phone || '',
        address: user.address || '',
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/auth/me — delete account
export async function DELETE(req: NextRequest) {
  try {
    const userId = getUserIdFromRequest(req);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await connectDB();
    const body = await req.json().catch(() => ({}));
    const { password } = body;

    const user = await User.findById(userId);
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    if (user.password) {
      if (!password) {
        return NextResponse.json({ error: 'Password confirmation required' }, { status: 400 });
      }
      const isMatch = await comparePassword(password, user.password);
      if (!isMatch) {
        return NextResponse.json({ error: 'Incorrect password' }, { status: 400 });
      }
    }

    await User.findByIdAndDelete(userId);
    return NextResponse.json({ message: 'Account deleted' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
