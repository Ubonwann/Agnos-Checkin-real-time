"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FIELD_GROUPS, FIELDS } from "../../lib/fields";
import { validateAll, validateField } from "../../lib/validation";
import { usePatientSession } from "../../hooks/usePatientSession";
import FormField from "./FormField";

const REDIRECT_DELAY_MS = 1800;

export default function PatientForm() {
  const router = useRouter();
  const { data, setField, submit, submitted, connected, sessionId } = usePatientSession();
  const [touched, setTouched] = useState({});
  const [errors, setErrors] = useState({});
  const [attemptedSubmit, setAttemptedSubmit] = useState(false);

  // Show the confirmation briefly, then send the patient back to the home page.
  useEffect(() => {
    if (!submitted) return;
    const t = setTimeout(() => router.push("/"), REDIRECT_DELAY_MS);
    return () => clearTimeout(t);
  }, [submitted, router]);

  function handleChange(fieldId, value) {
    setField(fieldId, value);
    if (touched[fieldId]) {
      setErrors((prev) => ({ ...prev, [fieldId]: validateField(fieldId, value) }));
    }
  }

  function handleBlur(fieldId) {
    setTouched((prev) => ({ ...prev, [fieldId]: true }));
    setErrors((prev) => ({ ...prev, [fieldId]: validateField(fieldId, data[fieldId]) }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    setAttemptedSubmit(true);
    const { isValid, errors: allErrors } = validateAll(data);
    setErrors(allErrors);
    setTouched(Object.fromEntries(FIELDS.map((f) => [f.id, true])));
    if (!isValid) {
      const firstInvalid = FIELDS.find((f) => allErrors[f.id]);
      document.getElementById(firstInvalid?.id)?.focus();
      return;
    }
    submit();
  }

  if (submitted) {
    return (
      <div className="max-w-md mx-auto text-center py-24 px-6">
        <div className="mx-auto w-12 h-12 rounded-full bg-pine-50 border border-pine-100 flex items-center justify-center mb-6">
          <svg viewBox="0 0 24 24" className="w-6 h-6 text-pine-600" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <h1 className="font-display text-2xl text-ink">You're checked in</h1>
        <p className="mt-2 text-sm text-slate-500">
          Thanks, {data.firstName || "there"}. A staff member has your details and will call you shortly.
        </p>
        <p className="mt-6 text-xs text-slate-400">Taking you back to the home page&hellip;</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-12">
      <header className="mb-10">
        <div className="flex items-center justify-between">
          <p className="font-mono text-xs tracking-[0.2em] uppercase text-pine-600">
            Agnos &middot; Patient check-in
          </p>
          <span className="flex items-center gap-1.5 text-xs text-slate-400">
            <span className={`w-1.5 h-1.5 rounded-full ${connected ? "bg-pine-500" : "bg-amber-500"}`} />
            {connected ? "Synced" : "Connecting\u2026"}
          </span>
        </div>
        <h1 className="font-display italic text-3xl mt-3 text-ink">Tell us about you</h1>
        <p className="mt-2 text-sm text-slate-500">
          Fields update on the front desk screen as you type — your info is safe and only visible to staff.
        </p>
      </header>

      <form onSubmit={handleSubmit} className="space-y-10" noValidate>
        {FIELD_GROUPS.map((group) => (
          <fieldset key={group.id}>
            <legend className="mb-4">
              <span className="block text-sm font-semibold text-ink">{group.title}</span>
              <span className="block text-xs text-slate-400 mt-0.5">{group.description}</span>
            </legend>
            <div className="grid sm:grid-cols-2 gap-x-4 gap-y-5">
              {FIELDS.filter((f) => f.group === group.id).map((field) => (
                <div key={field.id} className={field.type === "textarea" ? "sm:col-span-2" : ""}>
                  <FormField
                    field={field}
                    value={data[field.id]}
                    error={errors[field.id]}
                    touched={touched[field.id] || attemptedSubmit}
                    onChange={handleChange}
                    onBlur={handleBlur}
                  />
                </div>
              ))}
            </div>
          </fieldset>
        ))}

        <div className="pt-2 flex items-center justify-between">
          <span className="font-mono text-[11px] text-slate-300" title="Session ID">
            {sessionId?.slice(0, 8)}
          </span>
          <button
            type="submit"
            className="rounded-lg bg-pine-600 text-white text-sm font-medium px-6 py-3 hover:bg-pine-700 transition-colors"
          >
            Submit check-in
          </button>
        </div>
      </form>
    </div>
  );
}
