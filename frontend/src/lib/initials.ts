/**
 * Derives initials from a name, or falls back to email.
 * - "John Doe" → "JD" (first letter of first name + first letter of last name)
 * - "John" → "Jo" (first two letters)
 * - "" / no name → first two letters of email (e.g. "jo" from "john@example.com")
 */
export function getInitials(name: string | null | undefined, email: string): string {
  const trimmed = (name ?? "").trim();
  if (trimmed.length > 0) {
    const parts = trimmed.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      const first = parts[0]!.charAt(0);
      const last = parts[parts.length - 1]!.charAt(0);
      return `${first}${last}`.toUpperCase();
    }
    const first = trimmed.charAt(0);
    const second = trimmed.charAt(1);
    return (second ? `${first}${second}` : first).toUpperCase();
  }
  const local = email.split("@")[0] ?? email;
  const a = local.charAt(0);
  const b = local.charAt(1);
  return (b ? `${a}${b}` : a).toUpperCase();
}
