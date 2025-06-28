import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import Joi from 'joi';
import { db } from '../database/init';
import { SignupRequest, LoginRequest, User, JWTPayload } from '../types';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-here';

// Validation schemas
const signupSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  name: Joi.string().required(),
  role: Joi.string().valid('mentor', 'mentee').required(),
  bio: Joi.string().optional(),
  skills: Joi.string().optional()
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
});

// Helper function to generate JWT token
function generateToken(user: User): string {
  const now = Math.floor(Date.now() / 1000);
  const payload: JWTPayload = {
    iss: 'mento-menti-app',
    sub: user.id.toString(),
    aud: 'mento-menti-users',
    exp: now + 3600, // 1 hour
    nbf: now,
    iat: now,
    jti: `${user.id}-${now}`,
    name: user.name,
    email: user.email,
    role: user.role,
    userId: user.id
  };

  return jwt.sign(payload, JWT_SECRET);
}

// POST /signup - User registration
router.post('/signup', async (req: Request, res: Response) => {
  try {
    const { error, value } = signupSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: 'Invalid request payload', details: error.details[0]?.message });
    }

    const { email, password, name, role, bio, skills }: SignupRequest & { bio?: string, skills?: string } = value;

    // Check if user already exists
    const existingUser = await new Promise<User | undefined>((resolve, reject) => {
      db.get('SELECT * FROM users WHERE email = ?', [email], (err, row) => {
        if (err) reject(err);
        else resolve(row as User);
      });
    });

    if (existingUser) {
      return res.status(400).json({ error: 'User already exists with this email' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert new user
    const userId = await new Promise<number>((resolve, reject) => {
      db.run(
        'INSERT INTO users (email, password, name, role, bio, skills) VALUES (?, ?, ?, ?, ?, ?)',
        [email, hashedPassword, name, role, bio || '', skills || ''],
        function(err) {
          if (err) reject(err);
          else resolve(this.lastID);
        }
      );
    });

    return res.status(201).json({ message: 'User created successfully', userId });
  } catch (error) {
    console.error('Signup error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /login - User login
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { error, value } = loginSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: 'Invalid request payload', details: error.details[0]?.message });
    }

    const { email, password }: LoginRequest = value;

    // Find user by email
    const user = await new Promise<User | undefined>((resolve, reject) => {
      db.get('SELECT * FROM users WHERE email = ?', [email], (err, row) => {
        if (err) reject(err);
        else resolve(row as User);
      });
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Generate JWT token
    const token = generateToken(user);

    return res.json({ token });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
