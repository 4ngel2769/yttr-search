import { z } from 'zod';

// Auth schemas
export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Password must contain at least one uppercase letter, one lowercase letter, and one number'
    ),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export const resetPasswordSchema = z.object({
  token: z.string(),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Password must contain at least one uppercase letter, one lowercase letter, and one number'
    ),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

// Search schemas
export const searchSchema = z.object({
  mode: z.enum(['channel', 'video', 'batch', 'playlist']),
  keywords: z.string().min(1, 'At least one keyword is required'),
  target: z.string().min(1, 'Target is required'),
  sort: z.enum(['newest', 'oldest', 'popular']).optional().default('newest'),
  maxVideos: z.string().optional(),
  durationFilters: z.array(z.string()).optional(),
  contextWindow: z.number().min(0).max(5).optional().default(1),
});

export const batchSearchSchema = z.object({
  keywords: z.string().min(1, 'At least one keyword is required'),
  urls: z.array(z.string().url()).min(1, 'At least one URL is required'),
  contextWindow: z.number().min(0).max(5).optional().default(1),
});

// User schemas
export const updateProfileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').optional(),
  image: z.string().url().optional().nullable(),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Password must contain at least one uppercase letter, one lowercase letter, and one number'
    ),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

// Saved item schemas
export const saveItemSchema = z.object({
  itemType: z.enum(['VIDEO', 'CHANNEL', 'PLAYLIST']),
  itemId: z.string().min(1),
  itemTitle: z.string().min(1),
  itemUrl: z.string().url(),
  thumbnailUrl: z.string().url().optional(),
  notes: z.string().max(1000).optional(),
});

// Admin schemas
export const updateUserSchema = z.object({
  name: z.string().min(2).optional(),
  tier: z.enum(['FREE', 'TIER1', 'TIER2', 'TIER3']).optional(),
  isSuspended: z.boolean().optional(),
  isAdmin: z.boolean().optional(),
});

export const systemConfigSchema = z.object({
  key: z.string(),
  value: z.any(),
});

// Duration filter validation
export const durationFilterSchema = z.string().regex(
  /^[+-]\d+(\.\d+)?[smh]?$/,
  'Invalid duration filter format. Use +5m, -2h, +30s, etc.'
);

// File upload validation
export const fileUploadSchema = z.object({
  filename: z.string(),
  size: z.number().max(5 * 1024 * 1024, 'File size must be less than 5MB'),
  type: z.string().refine(
    (type) => type === 'text/plain',
    'Only .txt files are allowed'
  ),
});

// Types
export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type SearchInput = z.infer<typeof searchSchema>;
export type BatchSearchInput = z.infer<typeof batchSearchSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type SaveItemInput = z.infer<typeof saveItemSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
