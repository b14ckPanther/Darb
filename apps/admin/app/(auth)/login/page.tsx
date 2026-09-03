import { redirect } from "next/navigation";

import { DarbAdminBrand, DarbPublicSiteLink } from "../../_components/brand";
import { getAdminAccessSnapshot } from "../../../lib/auth";
import { adminAuthCopy } from "../../../lib/copy";
import { getLoginDestination, sanitizeReturnPath } from "../../../lib/navigation";
import { LoginForm } from "./login-form";

const copy = adminAuthCopy.en;

interface LoginPageProps {
  searchParams: Promise<{ next?: string | string[] }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const snapshot = await getAdminAccessSnapshot();
  const destination = getLoginDestination({
    accessibleBusinessCount: snapshot.businesses.length,
    isAuthenticated: Boolean(snapshot.user),
  });

  if (destination) {
    redirect(destination);
  }

  const params = await searchParams;
  const requestedNext = Array.isArray(params.next) ? params.next[0] : params.next;
  const nextPath = sanitizeReturnPath(requestedNext);

  return (
    <main id="main-content" className="auth-layout">
      <section className="auth-story" aria-labelledby="auth-story-title">
        <div className="auth-story__brandline">
          <DarbAdminBrand tone="light" />
          <DarbPublicSiteLink className="auth-public-link" label="Back to Darb" />
        </div>
        <div className="auth-story__copy">
          <p className="auth-story__kicker">{copy.brandDescriptor}</p>
          <h2 id="auth-story-title">A clear path from your business to every customer.</h2>
          <p>
            One secure workspace for the teams, locations, and Darb products you are authorized to
            manage.
          </p>
        </div>
        <div className="auth-opening" aria-hidden="true">
          <span />
        </div>
      </section>

      <section className="auth-panel" aria-labelledby="login-heading">
        <div className="auth-card">
          <p className="eyebrow">{copy.login.eyebrow}</p>
          <h1 id="login-heading">{copy.login.heading}</h1>
          <p className="auth-intro">{copy.login.intro}</p>
          <LoginForm nextPath={nextPath} />
          <p className="auth-footnote">Access is limited to authorized Darb team members.</p>
        </div>
      </section>
    </main>
  );
}
