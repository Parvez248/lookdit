import { describe, expect, it } from "vitest";

import { mediaUrl } from "../media/url";
import { parseDimension, parseMediaDetails, parseUploadDetails, sniffImageType } from "./media";

function form(fields: Record<string, string>): FormData {
  const data = new FormData();
  for (const [key, value] of Object.entries(fields)) data.set(key, value);
  return data;
}

const bytes = (...values: number[]) => new Uint8Array(values);
const text = (value: string) => [...value].map((char) => char.charCodeAt(0));

describe("sniffImageType", () => {
  it("recognises the accepted formats by their bytes", () => {
    expect(sniffImageType(bytes(0xff, 0xd8, 0xff, 0xe0))?.mime).toBe("image/jpeg");
    expect(sniffImageType(bytes(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a))?.mime).toBe("image/png");
    expect(sniffImageType(bytes(...text("RIFF"), 0, 0, 0, 0, ...text("WEBP")))?.mime).toBe("image/webp");
    expect(sniffImageType(bytes(0, 0, 0, 0x1c, ...text("ftypavif")))?.mime).toBe("image/avif");
  });

  it("refuses anything else, whatever its name or reported type", () => {
    expect(sniffImageType(bytes(...text("<svg xmlns")))).toBeNull();
    expect(sniffImageType(bytes(...text("<!doctype html>")))).toBeNull();
    expect(sniffImageType(bytes(...text("GIF89a")))).toBeNull();
    expect(sniffImageType(bytes(0, 0, 0, 0x1c, ...text("ftypmp42")))).toBeNull();
    expect(sniffImageType(bytes())).toBeNull();
  });
});

describe("upload details", () => {
  it("trims alt text and keeps a measured size", () => {
    expect(parseUploadDetails(form({ alt: "  Booking flow  ", role: "hero", width: "2400", height: "1500" }))).toEqual({
      alt: "Booking flow",
      role: "hero",
      width: 2400,
      height: 1500,
    });
  });

  it("drops a half-known or implausible size", () => {
    expect(parseUploadDetails(form({ alt: "A", role: "gallery", width: "2400" }))).toMatchObject({
      width: null,
      height: null,
    });
    expect(parseDimension("0")).toBeNull();
    expect(parseDimension("20001")).toBeNull();
    expect(parseDimension("12.5")).toBeNull();
    expect(parseDimension(null)).toBeNull();
  });

  it("requires alt text and a known role", () => {
    expect(parseUploadDetails(form({ alt: "   ", role: "hero" }))).toBeNull();
    expect(parseUploadDetails(form({ alt: "A", role: "thumbnail" }))).toBeNull();
    expect(parseUploadDetails(form({ alt: "x".repeat(301), role: "hero" }))).toBeNull();
  });
});

describe("media details", () => {
  it("parses alt, role and order", () => {
    expect(parseMediaDetails(form({ alt: " Home ", role: "gallery", displayOrder: " 20 " }))).toEqual({
      alt: "Home",
      role: "gallery",
      displayOrder: 20,
    });
  });

  it("rejects a bad order", () => {
    expect(parseMediaDetails(form({ alt: "A", role: "gallery", displayOrder: "-1" }))).toBeNull();
    expect(parseMediaDetails(form({ alt: "A", role: "gallery", displayOrder: "10000" }))).toBeNull();
  });
});

describe("mediaUrl", () => {
  const blob = "https://abc123.public.blob.vercel-storage.com/projects/0199c000/image-x1y2.webp";

  it("passes through a public Blob URL under projects/", () => {
    expect(mediaUrl(blob)).toBe(blob);
  });

  it("resolves anything else to null", () => {
    expect(mediaUrl("projects/0199c000/image.webp")).toBeNull();
    expect(mediaUrl("http://abc123.public.blob.vercel-storage.com/projects/a.webp")).toBeNull();
    expect(mediaUrl("https://evil.example/projects/a.webp")).toBeNull();
    expect(mediaUrl("https://public.blob.vercel-storage.com.evil.example/projects/a.webp")).toBeNull();
    expect(mediaUrl("https://abc123.private.blob.vercel-storage.com/projects/a.webp")).toBeNull();
    expect(mediaUrl("https://abc123.public.blob.vercel-storage.com/other/a.webp")).toBeNull();
    expect(mediaUrl(`${blob}?download=1`)).toBeNull();
  });
});
