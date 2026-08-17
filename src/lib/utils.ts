import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Tailwind sinflarini xavfsiz birlashtiradi (keyingi sinf oldingisini bekor qiladi). */
export function cn(...kirish: ClassValue[]) {
  return twMerge(clsx(kirish));
}
