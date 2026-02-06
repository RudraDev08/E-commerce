/**
 * Simple utility to merge class names
 * Fallback since clsx/tailwind-merge are not installed
 */
export function cn(...classes) {
    return classes.filter(Boolean).map(c => c.trim()).filter(c => c).join(" ");
}
