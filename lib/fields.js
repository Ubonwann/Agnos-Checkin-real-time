/**
 * Field schema shared by the patient form and the staff view.
 * Keeping one definition means a field only has to be added/edited here to
 * show up correctly (label, grouping, validation) in both interfaces.
 */

const GENDER_OPTIONS = [
  "Female",
  "Male",
  "Non-binary",
  "Prefer not to say",
];

const LANGUAGE_OPTIONS = [
  "Thai",
  "English",
  "Mandarin",
  "Burmese",
  "Lao",
  "Khmer",
  "Other",
];

const FIELD_GROUPS = [
  {
    id: "personal",
    title: "Personal details",
    description: "Who we're seeing today.",
  },
  {
    id: "contact",
    title: "Contact information",
    description: "How we reach you.",
  },
  {
    id: "background",
    title: "Background",
    description: "Helps staff communicate care clearly.",
  },
  {
    id: "emergency",
    title: "Emergency contact",
    description: "Optional, but recommended.",
  },
];

const FIELDS = [
  { id: "firstName", label: "First name", type: "text", group: "personal", required: true, autoComplete: "given-name" },
  { id: "middleName", label: "Middle name", type: "text", group: "personal", required: false, autoComplete: "additional-name" },
  { id: "lastName", label: "Last name", type: "text", group: "personal", required: true, autoComplete: "family-name" },
  { id: "dob", label: "Date of birth", type: "date", group: "personal", required: true, autoComplete: "bday" },
  { id: "gender", label: "Gender", type: "select", group: "personal", required: true, options: GENDER_OPTIONS },

  { id: "phone", label: "Phone number", type: "tel", group: "contact", required: true, autoComplete: "tel", placeholder: "e.g. 081 234 5678" },
  { id: "email", label: "Email", type: "email", group: "contact", required: true, autoComplete: "email", placeholder: "name@example.com" },
  { id: "address", label: "Address", type: "textarea", group: "contact", required: true, autoComplete: "street-address" },

  { id: "preferredLanguage", label: "Preferred language", type: "select", group: "background", required: true, options: LANGUAGE_OPTIONS },
  { id: "nationality", label: "Nationality", type: "text", group: "background", required: true, autoComplete: "country-name" },
  { id: "religion", label: "Religion", type: "text", group: "background", required: false },

  { id: "emergencyContactName", label: "Emergency contact name", type: "text", group: "emergency", required: false },
  { id: "emergencyContactRelationship", label: "Relationship", type: "text", group: "emergency", required: false, placeholder: "e.g. Spouse, Parent, Friend" },
];

const FIELD_MAP = Object.fromEntries(FIELDS.map((f) => [f.id, f]));

const EMPTY_PATIENT_DATA = Object.fromEntries(
  FIELDS.map((f) => [f.id, ""])
);

module.exports = {
  GENDER_OPTIONS,
  LANGUAGE_OPTIONS,
  FIELD_GROUPS,
  FIELDS,
  FIELD_MAP,
  EMPTY_PATIENT_DATA,
};
