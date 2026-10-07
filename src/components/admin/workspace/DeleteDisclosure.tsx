import styles from "./DeleteDisclosure.module.css";

type DeleteDisclosureProps = {
  action: (formData: FormData) => Promise<void>;
  fields: Record<string, string>;
  summary: string;
  body: string;
  confirm: string;
};

/**
 * Delete behind a native disclosure: one click opens it, a second confirms. No
 * JavaScript and no modal, and a stray click on the edit page can't delete.
 */
export function DeleteDisclosure({ action, fields, summary, body, confirm }: DeleteDisclosureProps) {
  return (
    <details className={styles.disclosure}>
      <summary className={styles.summary}>{summary}</summary>
      <form action={action} className={styles.body}>
        {Object.entries(fields).map(([name, value]) => (
          <input key={name} type="hidden" name={name} value={value} />
        ))}
        <p className={styles.text}>{body}</p>
        <button type="submit" className={styles.confirm}>
          {confirm}
        </button>
      </form>
    </details>
  );
}
