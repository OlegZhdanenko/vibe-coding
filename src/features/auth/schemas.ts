import { z } from 'zod'

const email = z.email('Enter a valid email address').trim().min(1, 'Email is required')

export const signInSchema = z.object({
  email,
  password: z.string().min(1, 'Password is required'),
})

export const signUpSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, 'Please enter your name')
    .max(80, 'That name is too long'),
  email,
  password: z
    .string()
    .min(8, 'Use at least 8 characters')
    .max(72, 'Passwords are limited to 72 characters')
    .regex(/[a-zA-Z]/, 'Include at least one letter')
    .regex(/[0-9]/, 'Include at least one number'),
})

export type SignInValues = z.infer<typeof signInSchema>
export type SignUpValues = z.infer<typeof signUpSchema>
