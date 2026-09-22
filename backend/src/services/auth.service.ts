import { createHmac, randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import { getPrisma } from '../lib/prisma';
import { AppError } from '../utils/app-error';
import { env } from '../config/env';

const scrypt = promisify(scryptCallback);
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7;
const SESSION_COOKIE = 'devflow_session';

type SessionPayload = { userId: string; exp: number };

function sessionSecret(): string {
  return env.sessionSecret;
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString('hex');
  const derivedKey = (await scrypt(password, salt, 64)) as Buffer;
  return `scrypt$${salt}$${derivedKey.toString('hex')}`;
}

export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  const [algorithm, salt, key] = storedHash.split('$');
  if (algorithm !== 'scrypt' || !salt || !key) return false;
  const derivedKey = (await scrypt(password, salt, 64)) as Buffer;
  const expected = Buffer.from(key, 'hex');
  return expected.length === derivedKey.length && timingSafeEqual(expected, derivedKey);
}

function encode(payload: SessionPayload): string {
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = createHmac('sha256', sessionSecret()).update(body).digest('base64url');
  return `${body}.${signature}`;
}

export function decodeSession(value: string | undefined): SessionPayload | null {
  if (!value) return null;
  const [body, signature] = value.split('.');
  if (!body || !signature) return null;
  const expected = createHmac('sha256', sessionSecret()).update(body).digest('base64url');
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8')) as SessionPayload;
    if (!payload.userId || !Number.isFinite(payload.exp) || payload.exp <= Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

export function createSession(userId: string): string {
  return encode({ userId, exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS });
}

export function sessionCookieOptions(): string {
  const secure = env.isProduction ? '; Secure' : '';
  return `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=None; Max-Age=0${secure}`;
}

export function setSessionCookie(value: string): string {
  const secure = env.isProduction ? '; Secure' : '';
  return `${SESSION_COOKIE}=${value}; Path=/; HttpOnly; SameSite=None; Max-Age=${SESSION_TTL_SECONDS}${secure}`;
}

export function getSessionCookieName(): string {
  return SESSION_COOKIE;
}

export async function registerUser(name: string, email: string, password: string) {
  const prisma = getPrisma();
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw new AppError(409, 'An account with that email already exists', 'EMAIL_EXISTS');
  const user = await prisma.user.create({
    data: { name, email, passwordHash: await hashPassword(password) },
  });
  return toPublicUser(user);
}

export async function authenticateUser(email: string, password: string) {
  const user = await getPrisma().user.findUnique({ where: { email } });
  if (!user || !user.passwordHash || !(await verifyPassword(password, user.passwordHash))) {
    throw new AppError(401, 'Invalid email or password', 'INVALID_CREDENTIALS');
  }
  return toPublicUser(user);
}

export async function getAuthenticatedUser(userId: string) {
  const user = await getPrisma().user.findUnique({ where: { id: userId } });
  return user ? toPublicUser(user) : null;
}

export function toPublicUser(user: { id: string; name: string; email: string; createdAt: Date; updatedAt: Date }) {
  return { id: user.id, name: user.name, email: user.email, createdAt: user.createdAt, updatedAt: user.updatedAt };
}

export { SESSION_COOKIE };
