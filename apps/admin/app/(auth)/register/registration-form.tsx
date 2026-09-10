"use client";

import { useActionState, useState } from "react";
import type { ReactNode } from "react";

import {
  ArrowRightIcon,
  CheckmarkCircleIcon,
  LockIcon,
  MailIcon,
  PreviewIcon,
  VisibilityOffIcon,
} from "@darb/icons";

import { signUpAction } from "../../actions/auth";
import { initialFormState } from "../../../lib/forms";
import { useAdminI18n } from "../../../lib/i18n-client";

export function RegistrationForm() {
  const { t } = useAdminI18n();
  const [state, action, pending] = useActionState(signUpAction, initialFormState);
  const [visible, setVisible] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");

  return (
    <form action={action} className="auth-form" aria-busy={pending}>
      <AuthField
        id="registration-email"
        label={t("Email address")}
        error={state.fieldErrors?.email ? t(state.fieldErrors.email) : undefined}
      >
        <MailIcon size={19} />
        <input
          id="registration-email"
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder="name@company.com"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
          aria-invalid={Boolean(state.fieldErrors?.email)}
          aria-describedby={state.fieldErrors?.email ? "registration-email-error" : undefined}
        />
      </AuthField>
      <AuthField
        id="registration-password"
        label={t("Create password")}
        error={state.fieldErrors?.password ? t(state.fieldErrors.password) : undefined}
        hint={t("Use at least 8 characters.")}
      >
        <LockIcon size={19} />
        <input
          id="registration-password"
          name="password"
          type={visible ? "text" : "password"}
          autoComplete="new-password"
          minLength={8}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
          aria-invalid={Boolean(state.fieldErrors?.password)}
          aria-describedby={
            state.fieldErrors?.password
              ? "registration-password-error"
              : "registration-password-hint"
          }
        />
        <button
          className="password-visibility"
          type="button"
          aria-label={t(visible ? "Hide password" : "Show password")}
          aria-controls="registration-password"
          aria-pressed={visible}
          onClick={() => setVisible((value) => !value)}
        >
          {visible ? <VisibilityOffIcon size={19} /> : <PreviewIcon size={19} />}
        </button>
      </AuthField>
      <AuthField
        id="password-confirmation"
        label={t("Confirm password")}
        error={
          state.fieldErrors?.passwordConfirmation
            ? t(state.fieldErrors.passwordConfirmation)
            : undefined
        }
      >
        <LockIcon size={19} />
        <input
          id="password-confirmation"
          name="passwordConfirmation"
          type={visible ? "text" : "password"}
          autoComplete="new-password"
          minLength={8}
          value={passwordConfirmation}
          onChange={(event) => setPasswordConfirmation(event.target.value)}
          required
          aria-invalid={Boolean(state.fieldErrors?.passwordConfirmation)}
          aria-describedby={
            state.fieldErrors?.passwordConfirmation ? "password-confirmation-error" : undefined
          }
        />
      </AuthField>
      {state.message ? (
        <p
          className={state.status === "success" ? "success-alert" : "form-alert"}
          role={state.status === "success" ? "status" : "alert"}
        >
          {state.status === "success" ? <CheckmarkCircleIcon size={18} /> : null}
          {t(state.message)}
        </p>
      ) : null}
      <button className="primary-button" type="submit" disabled={pending}>
        <span>{t(pending ? "Creating account…" : "Create account")}</span>
        <ArrowRightIcon size={20} />
      </button>
    </form>
  );
}

function AuthField({
  children,
  error,
  hint,
  id,
  label,
}: {
  children: ReactNode;
  error?: string | undefined;
  hint?: string | undefined;
  id: string;
  label: string;
}) {
  return (
    <div className="field-group">
      <label htmlFor={id}>{label}</label>
      <div className="field-control">{children}</div>
      {hint ? (
        <p className="field-hint" id={`${id}-hint`}>
          {hint}
        </p>
      ) : null}
      {error ? (
        <p className="field-error" id={`${id}-error`}>
          {error}
        </p>
      ) : null}
    </div>
  );
}
