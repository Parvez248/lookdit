import { z } from "zod";

import { MAX_PASSWORD_LENGTH } from "./password";

// Sign-in input. Untrusted: only email and password are read from the form.
// Sign-in deliberately checks only shape, not password rules, so a failure
// message can never hint at which rule an existing password breaks.

export const signInSchema = z.object({
  email: z.string().trim().toLowerCase().min(1).max(254).pipe(z.email()),
  password: z.string().min(1).max(MAX_PASSWORD_LENGTH),
});

export type SignInInput = z.infer<typeof signInSchema>;

export function parseSignInForm(formData: FormData): SignInInput | null {
  const parsed = signInSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  return parsed.success ? parsed.data : null;
}
