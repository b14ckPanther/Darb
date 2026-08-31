import { redirect } from "next/navigation";

import { ShieldIcon } from "@darb/icons";

import { DarbAdminBrand } from "../../_components/brand";
import { getAdminAccessSnapshot } from "../../../lib/auth";
import { adminAuthCopy } from "../../../lib/copy";
import { getOnboardingDestination } from "../../../lib/navigation";
import { OnboardingForm } from "./onboarding-form";

const copy = adminAuthCopy.en.onboarding;

export default async function OnboardingPage() {
  const snapshot = await getAdminAccessSnapshot();
  const destination = getOnboardingDestination({
    accessibleBusinessCount: snapshot.businesses.length,
    isAuthenticated: Boolean(snapshot.user),
  });

  if (destination) {
    redirect(destination);
  }

  return (
    <main id="main-content" className="onboarding-layout">
      <header className="onboarding-header">
        <DarbAdminBrand />
        <p className="secure-context">
          <ShieldIcon size={18} />
          Signed in securely
        </p>
      </header>

      <section className="onboarding-card" aria-labelledby="onboarding-heading">
        <div className="onboarding-card__intro">
          <p className="eyebrow">{copy.eyebrow}</p>
          <h1 id="onboarding-heading">{copy.heading}</h1>
          <p className="auth-intro">{copy.intro}</p>
        </div>
        <OnboardingForm />
      </section>

      <p className="onboarding-note">
        Currency starts as ILS and the timezone as Asia/Jerusalem. No product modules are enabled
        during this step.
      </p>
    </main>
  );
}
