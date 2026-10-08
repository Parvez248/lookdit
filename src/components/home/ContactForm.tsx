"use client";

import { useActionState, useEffect, useRef, useState } from "react";

import { submitInquiry } from "@/app/actions/inquiry";
import { contact } from "@/content/site";
import {
  INQUIRY_HONEYPOT_FIELD,
  INITIAL_SUBMIT_INQUIRY_STATE,
} from "@/lib/inquiries/submission";
import { INQUIRY_LIMITS } from "@/lib/inquiries/validation";

import styles from "./ContactForm.module.css";

const { fields, submit, success } = contact;

/**
 * Public contact form. Client only for the pending state, inline field errors
 * and the success swap. Without JavaScript it still posts to the same Server
 * Action and the page re-renders the result.
 *
 * Inputs are controlled so a validation error keeps what the visitor typed:
 * `submitInquiry` never echoes submitted values back (by design), so the field
 * values must live on the client.
 */
export function ContactForm() {
  const [state, formAction, pending] = useActionState(
    submitInquiry,
    INITIAL_SUBMIT_INQUIRY_STATE,
  );

  const [values, setValues] = useState({ name: "", email: "", company: "", message: "" });
  const set = (key: keyof typeof values) => (event: { target: { value: string } }) =>
    setValues((previous) => ({ ...previous, [key]: event.target.value }));

  const fieldErrors = state.status === "invalid" ? state.fieldErrors : undefined;
  const formError =
    state.status === "error" || state.status === "rate_limited" ? state.message : null;

  // On success the form is replaced by the confirmation panel below; move focus
  // to it so keyboard and screen-reader users are taken to the result.
  const successRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (state.status === "success") successRef.current?.focus();
  }, [state.status]);

  if (state.status === "success") {
    return (
      <div ref={successRef} tabIndex={-1} role="status" className={styles.success}>
        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" className={styles.successIcon}>
          <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="1.5" />
          <path d="M7.5 12.5l3 3 6-6.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
        </svg>
        <div>
          <p className={styles.successHeading}>{success.heading}</p>
          <p className={styles.successBody}>{success.body}</p>
        </div>
      </div>
    );
  }

  return (
    <form action={formAction} className={styles.form} noValidate>
      <div className={styles.field}>
        <label htmlFor="contact-name" className={styles.label}>
          {fields.name.label}
        </label>
        <input
          id="contact-name"
          name="name"
          type="text"
          autoComplete="name"
          required
          maxLength={INQUIRY_LIMITS.name}
          placeholder={fields.name.placeholder}
          value={values.name}
          onChange={set("name")}
          aria-invalid={fieldErrors?.name ? true : undefined}
          aria-describedby={fieldErrors?.name ? "contact-name-error" : undefined}
          className={styles.input}
        />
        {fieldErrors?.name ? (
          <p id="contact-name-error" className={styles.fieldError}>
            {fieldErrors.name}
          </p>
        ) : null}
      </div>

      <div className={styles.field}>
        <label htmlFor="contact-email" className={styles.label}>
          {fields.email.label}
        </label>
        <input
          id="contact-email"
          name="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          spellCheck={false}
          required
          maxLength={INQUIRY_LIMITS.email}
          placeholder={fields.email.placeholder}
          value={values.email}
          onChange={set("email")}
          aria-invalid={fieldErrors?.email ? true : undefined}
          aria-describedby={fieldErrors?.email ? "contact-email-error" : undefined}
          className={styles.input}
        />
        {fieldErrors?.email ? (
          <p id="contact-email-error" className={styles.fieldError}>
            {fieldErrors.email}
          </p>
        ) : null}
      </div>

      <div className={styles.field}>
        <label htmlFor="contact-company" className={styles.label}>
          {fields.company.label}
          <span className={styles.optional}> ({fields.company.optional})</span>
        </label>
        <input
          id="contact-company"
          name="company"
          type="text"
          autoComplete="organization"
          maxLength={INQUIRY_LIMITS.company}
          placeholder={fields.company.placeholder}
          value={values.company}
          onChange={set("company")}
          aria-invalid={fieldErrors?.company ? true : undefined}
          aria-describedby={fieldErrors?.company ? "contact-company-error" : undefined}
          className={styles.input}
        />
        {fieldErrors?.company ? (
          <p id="contact-company-error" className={styles.fieldError}>
            {fieldErrors.company}
          </p>
        ) : null}
      </div>

      <div className={styles.field}>
        <label htmlFor="contact-message" className={styles.label}>
          {fields.message.label}
        </label>
        <textarea
          id="contact-message"
          name="message"
          rows={5}
          required
          maxLength={INQUIRY_LIMITS.message}
          placeholder={fields.message.placeholder}
          value={values.message}
          onChange={set("message")}
          aria-invalid={fieldErrors?.message ? true : undefined}
          aria-describedby={fieldErrors?.message ? "contact-message-error" : undefined}
          className={`${styles.input} ${styles.textarea}`}
        />
        {fieldErrors?.message ? (
          <p id="contact-message-error" className={styles.fieldError}>
            {fieldErrors.message}
          </p>
        ) : null}
      </div>

      {/* Honeypot: hidden from real visitors, ignored by assistive tech. A bot
          that fills every field trips it and the submission is silently dropped. */}
      <div className={styles.honeypot} aria-hidden="true">
        <label htmlFor="contact-company-website">Company website</label>
        <input
          id="contact-company-website"
          name={INQUIRY_HONEYPOT_FIELD}
          type="text"
          tabIndex={-1}
          autoComplete="off"
        />
      </div>

      {/* Always in the DOM so screen readers announce the message on appearance. */}
      <div role="alert" className={styles.alertRegion}>
        {formError ? (
          <p className={styles.alert}>
            <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false" className={styles.alertIcon}>
              <circle cx="8" cy="8" r="6.75" fill="none" stroke="currentColor" strokeWidth="1.5" />
              <path d="M8 4.5v4.25M8 10.75v.75" stroke="currentColor" strokeWidth="1.5" />
            </svg>
            <span>{formError}</span>
          </p>
        ) : null}
      </div>

      <button type="submit" className={styles.submit} disabled={pending}>
        {pending ? submit.pending : submit.idle}
      </button>
    </form>
  );
}
