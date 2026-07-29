import { FIELDS } from "./fields";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Accepts spaces/dashes/parentheses, requires 7-15 digits overall.
const PHONE_RE = /^[0-9+()\-\s]{7,20}$/;

function isFutureDate(value) {
  if (!value) return false;
  const d = new Date(value);
  return d.getTime() > Date.now();
}

function isTooOld(value) {
  if (!value) return false;
  const d = new Date(value);
  const minYear = new Date().getFullYear() - 130;
  return d.getFullYear() < minYear;
}

/**
 * Validates a single field's value. Returns an error string, or "" if valid.
 */
export function validateField(fieldId, value) {
  const field = FIELDS.find((f) => f.id === fieldId);
  if (!field) return "";

  const trimmed = typeof value === "string" ? value.trim() : value;

  if (field.required && !trimmed) {
    return `${field.label} is required.`;
  }

  if (!trimmed) return ""; // optional + empty, nothing else to check

  if (field.id === "email" && !EMAIL_RE.test(trimmed)) {
    return "Enter a valid email address.";
  }

  if (field.id === "phone" && !PHONE_RE.test(trimmed)) {
    return "Enter a valid phone number.";
  }

  if (field.id === "dob") {
    if (isFutureDate(trimmed)) return "Date of birth can't be in the future.";
    if (isTooOld(trimmed)) return "Enter a valid date of birth.";
  }

  return "";
}

/**
 * Validates the full patient record. Returns { isValid, errors } where
 * errors is a map of fieldId -> message for every invalid field.
 */
export function validateAll(data) {
  const errors = {};
  for (const field of FIELDS) {
    const message = validateField(field.id, data[field.id]);
    if (message) errors[field.id] = message;
  }
  return { isValid: Object.keys(errors).length === 0, errors };
}
