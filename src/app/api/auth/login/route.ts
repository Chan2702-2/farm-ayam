import { NextRequest, NextResponse } from 'next/server';
import { initialUsers } from '@/lib/data/auth-users';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: 'Username/Email dan kata sandi wajib diisi.' },
        { status: 400 }
      );
    }

    const cleanInput = String(email).trim().toLowerCase();
    const cleanPass = String(password).trim();

    // Look for matching user by username or email
    const user = initialUsers.find(
      (u) =>
        u.username.toLowerCase() === cleanInput ||
        u.email.toLowerCase() === cleanInput
    );

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Akun pengawas tidak ditemukan. Periksa username atau ID Anda.' },
        { status: 401 }
      );
    }

    if (user.passwordHash !== cleanPass) {
      return NextResponse.json(
        { success: false, message: 'Kata sandi tidak sesuai. Silakan coba lagi.' },
        { status: 401 }
      );
    }

    // Return authenticated user data
    return NextResponse.json({
      success: true,
      message: `Selamat datang, ${user.name}!`,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        name: user.name,
        role: user.role,
        title: user.title,
        branchId: user.branchId,
        branchName: user.branchName,
        avatarInitial: user.avatarInitial,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: 'Terjadi kesalahan sistem: ' + err.message },
      { status: 500 }
    );
  }
}
