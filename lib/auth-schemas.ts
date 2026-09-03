/**
 * MENTOR: Zod schemas mirror backend validation for better UX.
 * Server remains source of truth — always show API error messages too.
 */

import { z } from 'zod';

/** Same rule as Backend user.validation passwordRegex */
const passwordRegex =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-={}\[\]|;:'",.<>/?]).{8,}$/;

const strongPassword = z
  .string()
  .regex(
    passwordRegex,
    'Password must include upper, lower, number, special and be 8+ chars',
  );

function ageFromDobString(dob: string) {
  const birthDate = new Date(dob);
  if (Number.isNaN(birthDate.getTime())) return 0;
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age -= 1;
  return age;
}

export const loginSchema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});

export const registerSchema = z
  .object({
    name: z.string().min(1, 'Name is required'),
    email: z.string().email('Enter a valid email'),
    dateOfBirth: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD')
      .refine((dob) => ageFromDobString(dob) >= 16, 'Minimum age is 16 years'),
    password: strongPassword,
    confirmPassword: z.string().min(1, 'Confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export const verifyOtpSchema = z.object({
  email: z.string().email('Enter a valid email'),
  otp: z
    .string()
    .length(6, 'Enter the 6-digit code')
    .regex(/^\d+$/, 'OTP must be numeric'),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('Enter a valid email'),
});

export const resetPasswordSchema = z
  .object({
    email: z.string().email('Enter a valid email'),
    code: z.string().min(4, 'Enter the reset code'),
    password: strongPassword,
    confirmPassword: z.string().min(1, 'Confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export type LoginFormValues = z.infer<typeof loginSchema>;
export type RegisterFormValues = z.infer<typeof registerSchema>;
export type VerifyOtpFormValues = z.infer<typeof verifyOtpSchema>;
export type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

/** Convert form YYYY-MM-DD → ISO datetime expected by backend .datetime() */
export function toApiDateOfBirth(dateOnly: string) {
  const d = new Date(`${dateOnly}T00:00:00.000Z`);
  return d.toISOString();
}
