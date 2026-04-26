import { Suspense } from "react";
import OnboardingFlow from "./OnboardingFlow";

export default function OnboardingPage() {
  return (
    <Suspense fallback={<main className="onb-root"><div className="onb-bg" aria-hidden="true" /></main>}>
      <OnboardingFlow />
    </Suspense>
  );
}
