import crypto from 'crypto';

const fallbackKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;
let fallbackIsSecret = fallbackKey?.startsWith('sb_secret_') || false;
if (fallbackKey && !fallbackIsSecret) {
  try {
    fallbackIsSecret = JSON.parse(Buffer.from(fallbackKey.split('.')[1], 'base64url').toString('utf8')).role === 'service_role';
  } catch { fallbackIsSecret = false; }
}
const secret = process.env.AUTH_SECRET || (fallbackIsSecret ? fallbackKey : null);
if (!secret || Buffer.byteLength(secret) < 32) {
  throw new Error('AUTH_SECRET must be set to a random value of at least 32 bytes');
}

const lifetimeSeconds = 60 * 60 * 24 * 30;

function signature(value) {
  return crypto.createHmac('sha256', secret).update(value).digest('base64url');
}

function credentialVersion(user) {
  return crypto.createHash('sha256').update(`${user.passwordHash || ''}:${user.syncCode || ''}`).digest('base64url');
}

export function issueToken(user) {
  const body = Buffer.from(JSON.stringify({
    id: user.resolvedId || user.canonicalId || user.id,
    exp: Math.floor(Date.now() / 1000) + lifetimeSeconds,
    credentialVersion: credentialVersion(user)
  })).toString('base64url');
  return `${body}.${signature(body)}`;
}

export function decodeToken(token) {
  if (typeof token !== 'string' || token.length > 4096) return false;
  const [body, mac, extra] = token.split('.');
  if (!body || !mac || extra) return false;
  const expected = signature(body);
  if (mac.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(mac), Buffer.from(expected))) return false;
  try {
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
    if (typeof payload.id !== 'string' || payload.id.length > 100 || payload.exp <= Math.floor(Date.now() / 1000)) return false;
    return payload;
  } catch {
    return false;
  }
}

export function verifyToken(token, user) {
  const payload = decodeToken(token);
  return !!payload && payload.id === user.id && payload.credentialVersion === credentialVersion(user);
}
