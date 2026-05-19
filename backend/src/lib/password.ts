import crypto from "node:crypto";

const KEYLEN = 64;

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.randomBytes(16).toString("hex");
  const digest = await scrypt(password, salt);
  return `${salt}:${digest}`;
}

export async function verifyPassword(password: string, digest: string): Promise<boolean> {
  const [salt, stored] = digest.split(":");
  if (!salt || !stored) return false;
  const incoming = await scrypt(password, salt);
  return crypto.timingSafeEqual(Buffer.from(stored, "hex"), Buffer.from(incoming, "hex"));
}

function scrypt(password: string, salt: string): Promise<string> {
  return new Promise((resolve, reject) => {
    crypto.scrypt(password, salt, KEYLEN, (err, result) => {
      if (err) return reject(err);
      resolve(result.toString("hex"));
    });
  });
}
