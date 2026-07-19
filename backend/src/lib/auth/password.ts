/**
 * Password hashing.
 *
 * The live database stores bcrypt hashes (`$2b$10$…`), so verification MUST be
 * bcrypt or every existing user is locked out on cutover. We use `bcryptjs`
 * (pure JS) rather than the native `bcrypt` binding: it verifies the same `$2b$`
 * hashes and needs no compile step on the KVM2 VPS, which is one less thing that
 * can break a deploy.
 */
import bcrypt from 'bcryptjs';

/** Matches the cost factor the production hashes were created with. */
const COST = 10;

export function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, COST);
}

/**
 * Constant-time compare via bcrypt. Returns false rather than throwing on a
 * malformed stored hash, so a corrupt row is a failed login, not a 500.
 */
export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  try {
    return await bcrypt.compare(plain, hash);
  } catch {
    return false;
  }
}
