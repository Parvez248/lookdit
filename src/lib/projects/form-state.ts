import type { ProjectFieldErrors } from "./validation";

// Project form state, shared by the Server Action and the project form. Pure.

export type ProjectFormState =
  | { status: "idle" }
  | { status: "invalid"; errors: ProjectFieldErrors; values: Record<string, string> }
  | { status: "error"; message: string; values: Record<string, string> };

export const initialProjectFormState: ProjectFormState = { status: "idle" };
