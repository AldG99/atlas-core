import { adminAuth } from './firebaseAdmin.js';

export async function getUidFromRequest(request: Request): Promise<string> {
  const authHeader = request.headers.get('authorization') ?? '';
  const match = authHeader.match(/^Bearer (.+)$/);
  if (!match) throw new Error('unauthenticated');

  const decoded = await adminAuth.verifyIdToken(match[1]);
  return decoded.uid;
}
