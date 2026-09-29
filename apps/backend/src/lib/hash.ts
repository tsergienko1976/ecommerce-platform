import bcrypt from "bcryptjs";

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

export async function comparePassword(raw: string, hash: string) {
  return bcrypt.compare(raw, hash);
}
