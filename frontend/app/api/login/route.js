import { NextResponse } from 'next/server'

export async function POST(request) {
  try {
    const { email, password } = await request.json()

    // Basic validation
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Please provide a valid email address' },
        { status: 400 }
      )
    }

    // Call your FastAPI backend
    const response = await fetch('https://shxz7-backend.hf.space/api/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        password
      }),
    })

    const data = await response.json()

    if (response.ok) {
      return NextResponse.json(
        { 
          message: 'Login successful',
          user: data.user,  // Pass through the complete user data from backend
          token: data.token
        },
        { status: 200 }
      )
    } else {
      return NextResponse.json(
        { error: data.detail || 'Invalid email or password' },
        { status: response.status }
      )
    }

  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}