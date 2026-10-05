import { Router } from 'express';
import jwt from 'jsonwebtoken';

const router = Router();
const SECRET = 'devtwin-demo-secret';

export function generateToken(userId: string): string {
  return jwt.sign({ sub: userId }, SECRET, { expiresIn: '1h' });
}

router.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  if (username === 'admin' && password === 'secret') {
    const token = generateToken('user_1');
    return res.json({ token });
  }
  return res.status(401).json({ error: 'Invalid credentials' });
});

router.get('/api/auth/me', (req, res) => {
  res.json({ id: 'user_1', username: 'admin', role: 'developer' });
});

export default router;
