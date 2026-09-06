import { createHmac, randomInt } from 'node:crypto';
import { Otp } from '../models/otp.model';
import { AppError } from '../middleware/error-handler';

export function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) throw new AppError('Authentication is not configured', 503);
  return secret;
}

const digest = (email: string, code: string) => createHmac('sha256', getJwtSecret()).update(`${email}:${code}`).digest('hex');

export async function issueOtp(email: string) {
  const code = String(randomInt(100000, 1000000));
  try {
    await Otp.findOneAndUpdate(
      { email, type: 'login', $or: [{ updatedAt: { $lte: new Date(Date.now() - 60_000) } }, { updatedAt: { $exists: false } }] },
      { $set: { otp: digest(email, code), expiresAt: new Date(Date.now() + 600_000), attempts: 0 } },
      { upsert: true, new: true }
    );
  } catch (error: any) {
    if (error.code === 11000) throw new AppError('Wait one minute before requesting another code.', 429);
    throw error;
  }
  return code;
}

export async function consumeOtp(email: string, code: string) {
  const attempt = await Otp.findOneAndUpdate(
    { email, type: 'login', expiresAt: { $gt: new Date() }, attempts: { $lt: 5 } },
    { $inc: { attempts: 1 } },
    { new: true, timestamps: false }
  );
  if (!attempt) throw new AppError('Invalid or expired code. Request a new code.', 400);
  // Atomic deletion prevents concurrent requests from consuming the same code twice.
  const consumed = await Otp.findOneAndDelete({ _id: attempt._id, otp: digest(email, code), expiresAt: { $gt: new Date() } });
  if (!consumed) throw new AppError('Invalid or expired code.', 400);
}
