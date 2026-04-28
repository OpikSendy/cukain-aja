/**
 * lib/utils.ts
 *
 * Core utilities. File ini wajib ada karena `cn` dipakai
 * di hampir semua component.
 *
 * Install dependency:
 *   npm install clsx tailwind-merge
 */
import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Utility untuk menggabungkan class Tailwind dengan aman.
 * Menghindari konflik class (misal: 'p-4' + 'p-2' → 'p-2').
 *
 * @example
 * cn('px-4 py-2', isActive && 'bg-blue-500', className)
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}