import { text as uiText } from "@/config/brand";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import { AuthPage, Onboarding } from "@/components/auth";
import { AppealPage } from "@/components/appeal";
import { PublicHeader, PublicFooter } from "@/components/layouts";
import { SafetyPage } from "@/components/safety";
import { brand } from "@/config/brand";
import { ShieldCheck, ArrowUpRight } from "lucide-react";
export default async function PublicPage({
  params,
}: {
  params: Promise<{ page: string }>;
}) {
  const { page } = await params;
  if (page === "login" || page === "register" || page === "forgot-password")
    return <AuthPage key={page} mode={page} />;
  if (page === "onboarding") return <Onboarding />;
  if (page === "appeal") return <AppealPage />;
  if (page === "safety")
    return (
      <>
        <PublicHeader />
        <Suspense
          fallback={
            <p className="container">
              {uiText("pagePublic.loading_safety_center")}
            </p>
          }
        >
          <SafetyPage publicPage />
        </Suspense>
        <PublicFooter />
      </>
    );
  if (page !== "terms" && page !== "privacy") notFound();
  const privacy = page === "privacy";
  const sections = privacy
    ? [
        [
          uiText("pagePublic.what_this_prototype_stores"),
          uiText(
            "pagePublic.profile_edits_sample_reports_messages_friends_and",
          ),
        ],
        [
          uiText("pagePublic.what_we_dont_store"),
          uiText("pagePublic.we_do_not_store_passwords_authentication_tokens"),
        ],
        [
          uiText("pagePublic.photos_and_thirdparty_services"),
          uiText("pagePublic.sample_portrait_assets_are_bundled_locally_no"),
        ],
        [
          uiText("pagePublic.your_choices"),
          uiText("pagePublic.use_settings_to_adjust_harmless_preferences_and"),
        ],
        [
          uiText("pagePublic.before_a_public_launch"),
          uiText("pagePublic.a_reviewed_privacy_policy_must_define_the"),
        ],
      ]
    : [
        [
          uiText("pagePublic.adults_only"),
          uiText("pagePublic.this_platform_is_designed_for_adults_aged"),
        ],
        [
          uiText("pagePublic.a_respectful_community"),
          uiText("pagePublic.do_not_harass_threaten_impersonate_scam_or"),
        ],
        [
          uiText("pagePublic.a_frontend_demonstration"),
          uiText(
            "pagePublic.all_profiles_and_social_interactions_are_fictional",
          ),
        ],
        [
          uiText("pagePublic.your_information"),
          uiText(
            "pagePublic.use_fictional_details_never_submit_identity_documents",
          ),
        ],
        [
          uiText("pagePublic.before_a_public_launch"),
          uiText(
            "pagePublic.these_are_development_placeholders_not_final_legal",
          ),
        ],
      ];
  return (
    <>
      <PublicHeader />
      <main id="main-content" className="container legal-page">
        <div className="eyebrow">
          <ShieldCheck size={16} />
          {uiText("pagePublic.clarity_is_part_of_trust")}
        </div>
        <h1>
          {privacy
            ? uiText("pagePublic.your_privacy_matters")
            : uiText("pagePublic.a_little_clarity_a_better_community")}
        </h1>
        <p className="legal-subtitle">
          {privacy
            ? uiText("pagePublic.privacy_policy")
            : uiText("pagePublic.terms_of_service")}{" "}
          {uiText("pagePublic.development_placeholder_october_2026")}
        </p>
        <div className="auth-demo-note">
          {uiText("pagePublic.this_document_explains_the")}
          {brand.name}{" "}
          {uiText("pagePublic.frontend_prototype_only_it_is_not_a")}
        </div>
        {sections.map(([title, text], i) => (
          <section key={title}>
            <span>0{i + 1}</span>
            <div>
              <h2>{title}</h2>
              <p>{text}</p>
            </div>
          </section>
        ))}
        <div className="legal-links">
          <Link href="/safety">
            {uiText("pagePublic.visit_the_safety_center")}
            <ArrowUpRight size={16} />
          </Link>
          <Link href={privacy ? "/terms" : "/privacy"}>
            {privacy
              ? uiText("pagePublic.terms_of_service")
              : uiText("pagePublic.privacy_policy")}
            <ArrowUpRight size={16} />
          </Link>
        </div>
      </main>
      <PublicFooter />
    </>
  );
}
