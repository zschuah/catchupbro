import {
  FaBagShopping,
  FaBed,
  FaCar,
  FaEllipsis,
  FaUmbrellaBeach,
  FaUtensils,
} from "react-icons/fa6";
import type { Category } from "./types";

export const VERSION_NUMBER = "v1.0.1";

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

/** The six fast-log expense categories. Each has an optional free-text description. */
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
 * Resolve a category by its stored key. Unknown keys fall back to "Other" so a
 * row always has an icon.
 */
export function categoryByKey(key: string): Category {
  const match = CATEGORIES.find((c) => c.key === key);
  return match ?? CATEGORIES[CATEGORIES.length - 1];
}
