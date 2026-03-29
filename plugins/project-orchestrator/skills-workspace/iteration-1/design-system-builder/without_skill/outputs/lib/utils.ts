import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merge Tailwind classes with conflict resolution.
 *
 * Combines clsx (conditional classes) with tailwind-merge
 * (deduplicates and resolves conflicting Tailwind utilities).
 *
 * Usage:
 *   cn('px-4 py-2', isActive && 'bg-primary-600', className)
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
