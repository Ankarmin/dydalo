import type { User } from "@/lib/stores";
import { normalizeText } from "@/lib/validations/forms";

export function splitFullName(name: string): { firstName: string; lastName: string } {
  const parts = normalizeText(name).split(" ").filter(Boolean);
  if (parts.length <= 1) return { firstName: parts[0] ?? "", lastName: "" };
  return { firstName: parts[0], lastName: parts.slice(1).join(" ") };
}

export function getUserFirstName(user: Pick<User, "name" | "firstName">): string {
  return user.firstName?.trim() || splitFullName(user.name).firstName;
}

export function getUserLastName(user: Pick<User, "name" | "lastName">): string {
  return user.lastName?.trim() || splitFullName(user.name).lastName;
}

export function composeFullName(firstName: string, lastName: string): string {
  return normalizeText(`${firstName} ${lastName}`);
}

export function getUserFullName(user: Pick<User, "name" | "firstName" | "lastName">): string {
  return composeFullName(getUserFirstName(user), getUserLastName(user)) || user.name;
}
