"use client";

const baseInput =
  "w-full rounded-lg border bg-surface px-3.5 py-2.5 text-[15px] text-ink placeholder:text-slate-400 transition-colors focus:outline-none focus:ring-2 focus:ring-pine-500/40";

export default function FormField({ field, value, error, touched, onChange, onBlur }) {
  const showError = touched && error;
  const borderClass = showError
    ? "border-clay-500 focus:ring-clay-500/30"
    : "border-line focus:border-pine-500";

  const commonProps = {
    id: field.id,
    name: field.id,
    value: value ?? "",
    onChange: (e) => onChange(field.id, e.target.value),
    onBlur: () => onBlur(field.id),
    autoComplete: field.autoComplete,
    placeholder: field.placeholder,
    "aria-invalid": showError ? "true" : "false",
    "aria-describedby": showError ? `${field.id}-error` : undefined,
  };

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={field.id} className="text-sm font-medium text-ink">
        {field.label}
        {!field.required && (
          <span className="ml-1.5 text-xs font-normal text-slate-400">optional</span>
        )}
      </label>

      {field.type === "textarea" && (
        <textarea rows={2} className={`${baseInput} ${borderClass}`} {...commonProps} />
      )}

      {field.type === "select" && (
        <select className={`${baseInput} ${borderClass} appearance-none bg-surface`} {...commonProps}>
          <option value="" disabled>
            Select&hellip;
          </option>
          {field.options.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      )}

      {["text", "date", "tel", "email"].includes(field.type) && (
        <input type={field.type} className={`${baseInput} ${borderClass}`} {...commonProps} />
      )}

      {showError && (
        <p id={`${field.id}-error`} className="text-xs text-clay-600">
          {error}
        </p>
      )}
    </div>
  );
}
