import { NextResponse } from 'next/server'

// Placeholder auth endpoint
// TODO: Implement actual auth with Google Sheets users lookup + session management
export async function POST(request: Request) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: 'Email dan password wajib diisi.' },
        { status: 400 }
      )
    }

    // TODO: validate against USERS sheet in Google Sheets
    // For now return placeholder success
    return NextResponse.json({
      success: true,
      message: 'Login berhasil.',
      data: {
        user: {
          id: '1',
          name: 'Admin',
          email,
          role: 'ADMIN',
          status: 'ACTIVE',
        },
      },
    })
  } catch {
    return NextResponse.json(
      { success: false, message: 'Terjadi kesalahan pada server.' },
      { status: 500 }
    )
  }
}
