import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

const SECRET = new TextEncoder().encode(
  process.env.SESSION_SECRET || 'fallback-secret'
);
const COOKIE = 'si_session';

export type Session = {
  userId: string;
  workspaceId: string;
  // Alias para compatibilidad — apunta al mismo valor que workspaceId
  clientId: string;
  // Rol de sistema: 'superadmin' | 'user'
  // El rol dentro del workspace (owner/editor/creator/analyst/viewer) está en workspaceRole
  role: string;
  workspaceRole: string;
  impersonating?: boolean;
};

export async function createSession(session: Session) {
  const token = await new SignJWT({ ...session })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('8h')
    .sign(SECRET);

  const cookieStore = await cookies();
  cookieStore.set(COOKIE, token, {
    httpOnly: true,
    secure: false,
    sameSite: 'lax',
    maxAge: 60 * 60 * 8,
    path: '/',
  });
}

export async function getSession(): Promise<Session | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE)?.value;
    if (!token) return null;
    const { payload } = await jwtVerify(token, SECRET);
    if (!payload.userId) return null;

    // workspaceId es la fuente de verdad; clientId es alias para compatibilidad
    const workspaceId = (payload.workspaceId || payload.clientId) as string;
    if (!workspaceId && payload.role !== 'superadmin') return null;

    return {
      userId:        payload.userId as string,
      workspaceId:   workspaceId || '',
      clientId:      workspaceId || '',   // alias
      role:          (payload.role as string) || 'user',
      workspaceRole: (payload.workspaceRole as string) || 'editor',
      impersonating: (payload.impersonating as boolean) || false,
    };
  } catch {
    return null;
  }
}

export async function destroySession() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE);
}
