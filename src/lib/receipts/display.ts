import type { ReceiptStatus } from "./types";

export function statusLabel(status: ReceiptStatus): string {
  switch (status) {
    case "parsing":
      return "Parsing";
    case "parsed":
      return "Needs review";
    case "confirmed":
      return "Confirmed";
    case "matched":
      return "Matched";
    case "failed":
      return "Failed";
  }
}

export function sourceLabel(sourceType: "photo" | "text"): string {
  return sourceType === "photo" ? "Photo" : "Email";
}

export function sourceFullLabel(sourceType: "photo" | "text"): string {
  return sourceType === "photo" ? "Source: photo" : "Source: pasted email";
}
