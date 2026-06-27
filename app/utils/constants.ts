import {
  FaBagShopping,
  FaBed,
  FaCar,
  FaEllipsis,
  FaUmbrellaBeach,
  FaUtensils,
} from "react-icons/fa6";
import type { Category } from "./types";

export const VERSION_NUMBER = "v1.0.0";

/** localStorage key holding the active ActiveTrip identity. */
export const STORAGE_KEY = "activeTrip";

/** Trip codes are uppercase alphanumeric only. */
export const CODE_REGEX = /^[A-Z0-9]+$/;

/** Suggested currency symbols for the admin picker (free text also allowed). */
export const CURRENCIES = [
  "$",
  "¥",
  "₩",
  "€",
  "£",
  "AUD",
  "CNY",
  "IDR",
  "MYR",
  "THB",
  "VND",
] as const;

/** Default currency symbol when none is chosen. */
export const DEFAULT_CURRENCY = "$";

/** The six fast-log expense categories. "other" reveals a custom-description input. */
export const CATEGORIES: Category[] = [
  { key: "food", label: "Food", Icon: FaUtensils },
  { key: "transport", label: "Transport", Icon: FaCar },
  { key: "shopping", label: "Shopping", Icon: FaBagShopping },
  { key: "activities", label: "Activities", Icon: FaUmbrellaBeach },
  { key: "lodging", label: "Lodging", Icon: FaBed },
  { key: "other", label: "Other", Icon: FaEllipsis },
];

export const OTHER_CATEGORY_KEY = "other";

/**
 * Resolve a category by its stored description. Saved descriptions are either a
 * category label (e.g. "Food") or free text from "Other" — anything that does
 * not match a known label falls back to the "Other" category.
 */
export function categoryForDescription(description: string): Category {
  const match = CATEGORIES.find(
    (c) => c.label.toLowerCase() === description.trim().toLowerCase(),
  );
  return match ?? CATEGORIES[CATEGORIES.length - 1];
}
