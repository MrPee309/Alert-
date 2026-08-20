/** Input validation helpers. Boundary validation only — return an i18n key. */

export const isEmail = (v: string): boolean =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());

export const isPhone = (v: string): boolean => {
  const digits = v.replace(/\D/g, "").replace(/^509/, "");
  return digits.length === 8;
};

export const isBlank = (v: string): boolean => v.trim().length === 0;

export interface FieldErrors {
  [field: string]: string | undefined;
}

/** Returns i18n keys for any invalid login fields. */
export function validateLogin(email: string, password: string): FieldErrors {
  const errors: FieldErrors = {};
  if (isBlank(email)) errors.email = "validation.required";
  else if (!isEmail(email)) errors.email = "validation.invalidEmail";
  if (isBlank(password)) errors.password = "validation.required";
  else if (password.length < 6) errors.password = "validation.passwordShort";
  return errors;
}

export function validateRegister(fields: {
  fullName: string;
  email: string;
  phone: string;
  password: string;
}): FieldErrors {
  const errors: FieldErrors = {};
  if (isBlank(fields.fullName)) errors.fullName = "validation.required";
  if (isBlank(fields.email)) errors.email = "validation.required";
  else if (!isEmail(fields.email)) errors.email = "validation.invalidEmail";
  if (isBlank(fields.phone)) errors.phone = "validation.required";
  else if (!isPhone(fields.phone)) errors.phone = "validation.invalidPhone";
  if (isBlank(fields.password)) errors.password = "validation.required";
  else if (fields.password.length < 6) errors.password = "validation.passwordShort";
  return errors;
}

export const hasErrors = (e: FieldErrors): boolean =>
  Object.values(e).some(Boolean);
