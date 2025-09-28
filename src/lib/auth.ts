import { SignJWT, jwtVerify } from 'jose'
import bcrypt from 'bcryptjs'

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback-secret')

export interface TokenPayload {
  userId: string
  email: string
}

export async function generateToken(payload: TokenPayload): Promise<string> {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('7d')
    .sign(JWT_SECRET)
}

export async function verifyToken(token: string): Promise<TokenPayload | null> {
  try {
    console.log('Verifying token:', token.substring(0, 20) + '...')
    const { payload } = await jwtVerify(token, JWT_SECRET)
    console.log('Token verified successfully for user:', payload.userId)
    return payload as TokenPayload
  } catch (error) {
    console.log('Token verification failed:', error)
    console.log('Token was:', token.substring(0, 50) + '...')
    return null
  }
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

export async function comparePasswords(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword)
}