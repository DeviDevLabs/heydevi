import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Utility to merge conditional class names into a single string.
 * It first uses `clsx` to join conditional values and then `twMerge`
 * to deduplicate/resolve Tailwind conflicting classes (e.g. `p-2 p-4`).
 *
 * Example:
 * ```ts
 * cn('p-2 p-4', isActive && 'text-white') // => 'p-4 text-white' when isActive
 * ```
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Public type for `cn` so it can be referenced by consumers.
 */
export type Cn = (...inputs: ClassValue[]) => string;
