// Nombre de la cookie de sesión (httpOnly). El frontend la envía
// automáticamente con `credentials: "include"`; nunca va en localStorage.
export const AUTH_COOKIE_NAME = 'access_token';

// 7 días, en línea con JWT_EXPIRES_IN por defecto.
export const AUTH_COOKIE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

// Costo bcrypt (decisión Fase 1: 12). bcryptjs puro-JS: sin compilación
// nativa en Windows.
export const BCRYPT_ROUNDS = 12;
