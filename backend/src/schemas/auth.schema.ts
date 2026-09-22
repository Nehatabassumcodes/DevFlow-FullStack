import { z } from 'zod';

const email = z.string().trim().toLowerCase().email('Invalid email address').max(254);
const password = z.string().min(8, 'Password must be at least 8 characters').max(128);

export const registerSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(100),
  email,
  password,
}).strict();

export const loginSchema = z.object({ email, password }).strict();
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
