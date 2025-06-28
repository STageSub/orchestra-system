import { NextRequest, NextResponse } from 'next/server'
import { validateToken } from '@/lib/request-tokens'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const token = searchParams.get('token')

    if (!token) {
      return NextResponse.json(
        { valid: false, error: 'Token saknas' },
        { status: 400 }
      )
    }

    const result = await validateToken(token)
    
    return NextResponse.json(result)
  } catch (error) {
    console.error('Error validating token:', error)
    return NextResponse.json(
      { valid: false, error: 'Ett fel uppstod vid validering' },
      { status: 500 }
    )
  }
}