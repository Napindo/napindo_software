const MAX_TEXT_LENGTH = 120;

const cleanText = (value: unknown) => String(value ?? "").trim();

export function validateUsername(value: unknown) {
  const text = cleanText(value);
  if (!text) return "username wajib diisi";
  if (text.length > 50) return "username terlalu panjang";
  if (!/^[a-zA-Z0-9 ._-]+$/.test(text)) return "username mengandung karakter tidak valid";
  return null;
}

export function validateDivision(value: unknown) {
  const text = cleanText(value);
  if (!text) return null;
  if (text.length > 50) return "division terlalu panjang";
  if (!/^[a-zA-Z0-9 ._-]+$/.test(text)) return "division mengandung karakter tidak valid";
  return null;
}

export function validatePassword(value: unknown, opts?: { min?: number; max?: number }) {
  const text = cleanText(value);
  if (!text) return "password wajib diisi";
  const min = opts?.min ?? 4;
  const max = opts?.max ?? MAX_TEXT_LENGTH;
  if (text.length < min) return `password minimal ${min} karakter`;
  if (text.length > max) return `password terlalu panjang (maks ${max})`;
  return null;
}
