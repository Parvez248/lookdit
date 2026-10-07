import type { FieldErrors } from "./validation";

// State for the workspace's add and edit forms. Pure.

export type WorkspaceFormState =
  | { status: "idle" }
  | { status: "saved" }
  | { status: "invalid"; errors: FieldErrors; values: Record<string, string> }
  | { status: "error"; message: string; values: Record<string, string> };

export const initialWorkspaceFormState: WorkspaceFormState = { status: "idle" };
