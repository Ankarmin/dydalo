export const MAX_IMAGE_SIZE_BYTES = 3 * 1024 * 1024;
export const ALLOWED_IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp"];

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function normalizeText(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

export function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

export function isValidEmail(value: string): boolean {
  return EMAIL_REGEX.test(normalizeEmail(value));
}

export function getEmailError(value: string): string | null {
  if (!value.trim()) return "El email es requerido";
  if (!isValidEmail(value)) return "Email inválido";
  return null;
}

export function getRequiredError(value: string, label: string): string | null {
  return value.trim() ? null : `${label} es requerido`;
}

export function getMinLengthError(
  value: string,
  label: string,
  minLength: number
): string | null {
  if (!value.trim()) return `${label} es requerido`;
  if (normalizeText(value).length < minLength) {
    return `${label} debe tener al menos ${minLength} caracteres`;
  }
  return null;
}

export function normalizePhone(value: string): string {
  return value.replace(/[^\d+]/g, "").trim();
}

export function isValidPhone(value: string): boolean {
  const digits = value.replace(/\D/g, "");
  return digits.length >= 9 && digits.length <= 15;
}

export function getPhoneError(value: string): string | null {
  if (!value.trim()) return "El teléfono es requerido";
  if (!isValidPhone(value)) return "Ingresa un teléfono válido";
  return null;
}

export function isValidHexColor(value: string): boolean {
  return /^#[0-9a-fA-F]{6}$/.test(value);
}

export function getImageFileError(file: File): string | null {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return "Solo se permiten imágenes PNG, JPG o WEBP";
  }
  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    return "La imagen no puede superar 3 MB";
  }
  return null;
}

export function getCsvFileError(file: File): string | null {
  const isCsv = file.name.toLowerCase().endsWith(".csv") || file.type === "text/csv";
  if (!isCsv) return "Selecciona un archivo CSV válido";
  if (file.size === 0) return "El archivo CSV está vacío";
  return null;
}
