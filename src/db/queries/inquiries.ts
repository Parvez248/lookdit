import "server-only";

import { count, desc, eq, sql } from "drizzle-orm";

import { getDb } from "@/db";
import { inquiries } from "@/db/schema";
import { INQUIRIES_PAGE_SIZE, type InquiryStatus } from "@/lib/inquiries/status";

// Admin reads of private inquiry data. Call only after requireUser(). The IP
// fingerprint is never selected: it exists for rate limiting, not for people.

export type InquirySummary = {
  id: string;
  name: string;
  email: string;
  company: string | null;
  status: InquiryStatus;
  createdAt: Date;
  /** The first 180 characters of the message, for the list. */
  preview: string;
};

export type InquiryDetail = Omit<InquirySummary, "preview"> & {
  message: string;
  updatedAt: Date;
};

const PREVIEW_LENGTH = 180;

/**
 * One page of inquiries, newest first, optionally filtered by status. Filtering,
 * ordering and paging all happen in SQL; `id` breaks ties between equal
 * timestamps so pages never overlap. Served by `inquiries_status_created_at_idx`
 * (filtered) or `inquiries_created_at_idx` (all).
 */
export async function listInquiries(status: InquiryStatus | null, page: number): Promise<InquirySummary[]> {
  const rows = await getDb()
    .select({
      id: inquiries.id,
      name: inquiries.name,
      email: inquiries.email,
      company: inquiries.company,
      status: inquiries.status,
      createdAt: inquiries.createdAt,
      preview: sql<string>`left(${inquiries.message}, ${PREVIEW_LENGTH})`,
    })
    .from(inquiries)
    .where(status ? eq(inquiries.status, status) : undefined)
    .orderBy(desc(inquiries.createdAt), desc(inquiries.id))
    .limit(INQUIRIES_PAGE_SIZE)
    .offset((page - 1) * INQUIRIES_PAGE_SIZE);
  // The CHECK constraint guarantees the status vocabulary.
  return rows as InquirySummary[];
}

/** Inquiry counts per status (zero for statuses with none), in one grouped query. */
export async function countInquiriesByStatus(): Promise<Record<InquiryStatus, number>> {
  const rows = await getDb()
    .select({ status: inquiries.status, total: count() })
    .from(inquiries)
    .groupBy(inquiries.status);
  const counts: Record<InquiryStatus, number> = { new: 0, reviewing: 0, replied: 0, closed: 0, spam: 0 };
  for (const row of rows) counts[row.status as InquiryStatus] = row.total;
  return counts;
}

export async function getInquiry(id: string): Promise<InquiryDetail | null> {
  const [row] = await getDb()
    .select({
      id: inquiries.id,
      name: inquiries.name,
      email: inquiries.email,
      company: inquiries.company,
      status: inquiries.status,
      message: inquiries.message,
      createdAt: inquiries.createdAt,
      updatedAt: inquiries.updatedAt,
    })
    .from(inquiries)
    .where(eq(inquiries.id, id))
    .limit(1);
  return (row as InquiryDetail | undefined) ?? null;
}
