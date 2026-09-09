"use client";

import { useActionState, useState } from "react";

import { ArrowRightIcon, LockIcon, MailIcon, PreviewIcon, VisibilityOffIcon } from "@darb/icons";

import { signInAction } from "../../actions/auth";
import { initialFormState } from "../../../lib/forms";
import { useAdminI18n } from "../../../lib/i18n-client";

export function LoginForm({ nextPath }: Readonly<{ nextPath: string }>) {
  const { t } = useAdminI18n();
  const [state, action, pending] = useActionState(signInAction, initialFormState);
  const [passwordVisible, setPasswordVisible] = useState(false);

  return (
    <form action={action} className="auth-form">
      <input type="hidden" name="next" value={nextPath} />

      <div className="field-group">
        <label htmlFor="email">{t("Email address")}</label>
        <div className="field-control">
          <MailIcon size={19} />
          <input
            id="email"
            name="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder="name@company.com"
            aria-invalid={Boolean(state.fieldErrors?.email)}
            aria-describedby={state.fieldErrors?.email ? "email-error" : undefined}
            required
          />
        </div>
        {state.fieldErrors?.email ? (
          <p className="field-error" id="email-error">
            {t(state.fieldErrors.email)}
          </p>
        ) : null}
      </div>

      <div className="field-group">
        <label htmlFor="password">{t("Password")}</label>
        <div className="field-control">
          <LockIcon size={19} />
          <input
            id="password"
            name="password"
            type={passwordVisible ? "text" : "password"}
            autoComplete="current-password"
            aria-invalid={Boolean(state.fieldErrors?.password)}
            aria-describedby={state.fieldErrors?.password ? "password-error" : undefined}
            required
          />
          <button
            className="password-visibility"
            type="button"
            aria-controls="password"
            aria-label={t(passwordVisible ? "Hide password" : "Show password")}
            aria-pressed={passwordVisible}
            onClick={() => setPasswordVisible((visible) => !visible)}
          >
            {passwordVisible ? <VisibilityOffIcon size={19} /> : <PreviewIcon size={19} />}
          </button>
        </div>
        {state.fieldErrors?.password ? (
          <p className="field-error" id="password-error">
            {t(state.fieldErrors.password)}
          </p>
        ) : null}
      </div>

      {state.message ? (
        <p className="form-alert" role="alert">
          {t(state.message)}
        </p>
      ) : null}

      <button className="primary-button" type="submit" disabled={pending}>
        <span>{t(pending ? "Signing in…" : "Sign in")}</span>
        <ArrowRightIcon size={20} />
      </button>
    </form>
  );
}
