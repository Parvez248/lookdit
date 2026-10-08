"use server";

// Admin-only project actions. Every export of a "use server" file is a
// POST-reachable endpoint, so each one checks the session itself first.

import { refresh } from "next/cache";
import { redirect } from "next/navigation";

import { createProject, setProjectPublished, updateProject } from "@/db/mutations/admin-projects";
import { requireUser } from "@/lib/auth/session";
import { describeErrorForLog } from "@/lib/inquiries/submission";
import type { ProjectFormState } from "@/lib/projects/form-state";
import { isProjectId } from "@/lib/projects/status";
import { parseProjectForm, PROJECT_FIELDS } from "@/lib/projects/validation";

/** SQLSTATE for a foreign key violation: the chosen client no longer exists. */
const FOREIGN_KEY_VIOLATION = "23503";

/** What the admin typed, so the form can be re-filled after an error. */
function submittedValues(formData: FormData): Record<string, string> {
  return Object.fromEntries(
    PROJECT_FIELDS.map((field) => {
      const value = formData.get(field);
      return [field, typeof value === "string" ? value.slice(0, 2048) : ""];
    }),
  );
}

/**
 * Create a project, or update one when the form carries an `id`. Signature
 * matches `useActionState`. Success redirects to the project's page; invalid
 * input returns per-field messages; an unknown id is treated as not found.
 */
export async function saveProject(_previous: ProjectFormState, formData: FormData): Promise<ProjectFormState> {
  await requireUser();
  if (!(formData instanceof FormData)) {
    return { status: "error", message: "The form couldn't be read. Try again.", values: {} };
  }

  const values = submittedValues(formData);
  const parsed = parseProjectForm(formData);
  if (!parsed.ok) return { status: "invalid", errors: parsed.errors, values };

  // No id: create. A valid id: update. Anything else: not a project we know.
  const rawId = formData.get("id");
  const id = rawId === null || rawId === "" ? null : isProjectId(rawId) ? rawId : undefined;
  if (id === undefined) redirect("/admin/projects");

  let savedId: string | null;
  try {
    savedId = id === null ? await createProject(parsed.value) : (await updateProject(id, parsed.value)) ? id : null;
  } catch (error) {
    const details = describeErrorForLog(error);
    if (details.code === FOREIGN_KEY_VIOLATION) {
      // The client was deleted after the form loaded, or the id was made up.
      return { status: "invalid", errors: { clientId: "That client no longer exists. Choose another." }, values };
    }
    console.error("[admin] project save failed", { event: "error", ...details });
    return { status: "error", message: "The project couldn't be saved. Try again.", values };
  }

  // Outside the try: redirect() works by throwing. A null id means the project
  // was deleted or never existed.
  if (savedId === null) redirect("/admin/projects");
  redirect(`/admin/projects/${savedId}`);
}

/**
 * Publish or unpublish a project from a form with `id` and `intent`
 * ("publish" | "unpublish"). Signed-out callers are redirected to sign-in;
 * malformed input or an unknown id changes nothing. The page re-renders with the
 * stored state either way.
 */
export async function setProjectPublication(formData: FormData): Promise<void> {
  await requireUser();
  if (!(formData instanceof FormData)) return;

  const id = formData.get("id");
  const intent = formData.get("intent");
  if (!isProjectId(id) || (intent !== "publish" && intent !== "unpublish")) return;

  try {
    await setProjectPublished(id, intent === "publish");
  } catch (error) {
    console.error("[admin] project publication change failed", { event: "error", ...describeErrorForLog(error) });
    throw new Error("The publishing status couldn't be saved. Try again.");
  }
  refresh();
}
