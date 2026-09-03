"use client";

import { useActionState, useState } from "react";

import { ArrowRightIcon, LockIcon, MailIcon, PreviewIcon, VisibilityOffIcon } from "@darb/icons";

import { signInAction } from "../../actions/auth";
import { adminAuthCopy } from "../../../lib/copy";
import { initialFormState } from "../../../lib/forms";

const copy = adminAuthCopy.en.login;

export function LoginForm({ nextPath }: Readonly<{ nextPath: string }>) {
  const [state, action, pending] = useActionState(signInAction, initialFormState);
  const [passwordVisible, setPasswordVisible] = useState(false);

  return (
    <form action={action} className="auth-form">
      <input type="hidden" name="next" value={nextPath} />

      <div className="field-group">
        <label htmlFor="email">{copy.emailLabel}</label>
        <div className="field-control">
          <MailIcon size={19} />
          <input
            id="email"
            name="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder={copy.emailPlaceholder}
            aria-invalid={Boolean(state.fieldErrors?.email)}
            aria-describedby={state.fieldErrors?.email ? "email-error" : undefined}
            required
          />
        </div>
        {state.fieldErrors?.email ? (
          <p className="field-error" id="email-error">
            {state.fieldErrors.email}
          </p>
        ) : null}
      </div>

      <div className="field-group">
        <label htmlFor="password">{copy.passwordLabel}</label>
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
            aria-label={passwordVisible ? "Hide password" : "Show password"}
            aria-pressed={passwordVisible}
            onClick={() => setPasswordVisible((visible) => !visible)}
          >
            {passwordVisible ? <VisibilityOffIcon size={19} /> : <PreviewIcon size={19} />}
          </button>
        </div>
        {state.fieldErrors?.password ? (
          <p className="field-error" id="password-error">
            {state.fieldErrors.password}
          </p>
        ) : null}
      </div>

      {state.message ? (
        <p className="form-alert" role="alert">
          {state.message}
        </p>
      ) : null}

      <button className="primary-button" type="submit" disabled={pending}>
        <span>{pending ? copy.submitting : copy.submit}</span>
        <ArrowRightIcon size={20} />
      </button>
    </form>
  );
}
