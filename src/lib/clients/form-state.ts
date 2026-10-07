import type { ClientFieldErrors } from "./validation";

// Client form state, shared by the Server Action and the client form. Pure.

export type ClientFormState =
  | { status: "idle" }
  | { status: "invalid"; errors: ClientFieldErrors; values: Record<string, string> }
  | { status: "error"; message: string; values: Record<string, string> };

export const initialClientFormState: ClientFormState = { status: "idle" };
