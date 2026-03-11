import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error(
    'Missing JWT_SECRET. Add it to .env.local (see env.example) before running the app.'
  );
}

export const hashPassword = async (password: string) => bcrypt.hash(password, 12);
export const comparePassword = (password: string, hash: string) => bcrypt.compare(password, hash);

export const signToken = (payload: any) =>
  jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });

export const verifyToken = (token: string) =>
  jwt.verify(token, JWT_SECRET);

export const getUserIdFromRequest = (req: Request) => {
  const authHeader = req.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.split(' ')[1];
  try {
    const decoded = verifyToken(token) as { id: string };
    return decoded.id;
  } catch (error) {
    return null;
  }
};
