"use client";
import { text as uiText } from "@/config/brand";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  ShieldCheck,
  Flag,
  Heart,
  LockKeyhole,
  Ban,
  ArrowUpRight,
  Check,
  AlertTriangle,
  UserCheck,
  X,
} from "lucide-react";
import { profiles, reportCategories } from "@/lib/data";
import { copy, brand } from "@/config/brand";
import { useApp } from "./provider";
import {
  Avatar,
  Button,
  ButtonLink,
  EmptyState,
  FormError,
  Modal,
  PageHeader,
  Select,
} from "./ui";
const reportSchema = z.object({
  userId: z.string().min(1, uiText("safety.choose_a_user_to_report")),
  category: z
    .string()
    .refine(
      (s) => reportCategories.includes(s),
      uiText("safety.choose_a_report_category"),
    ),
  details: z
    .string()
    .trim()
    .min(10, uiText("safety.add_at_least_10_characters_of_context"))
    .max(1000),
});
export function ReportForm({
  userId = "",
  onDone,
}: {
  userId?: string;
  onDone?: () => void;
}) {
  const store = useApp();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<z.infer<typeof reportSchema>>({
    resolver: zodResolver(reportSchema),
    defaultValues: { userId, category: "", details: "" },
  });
  const [success, setSuccess] = useState(false);
  async function submit(v: z.infer<typeof reportSchema>) {
    await store.submitReport(v.userId, v.category, v.details);
    setSuccess(true);
    reset();
    if (onDone) onDone();
  }
  return (
    <>
      {success ? (
        <div className="success-panel">
          <Check size={28} />
          <h3>{uiText("safety.saved_to_the_demo")}</h3>
          <p>{uiText("safety.your_report_is_only_in_local_application")}</p>
          <Button variant="secondary" onClick={() => setSuccess(false)}>
            {uiText("safety.create_another_sample_report")}
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit(submit)} noValidate>
          <div className="auth-demo-note">
            {uiText("safety.reports_are_mock_data_only_dont_include")}
          </div>
          <label className="field">
            <span>{uiText("safety.who_are_you_reporting")}</span>
            <select {...register("userId")}>
              <option value="">
                {uiText("safety.select_a_fictional_profile")}
              </option>
              {profiles.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} · {p.country}
                </option>
              ))}
            </select>
            <FormError message={errors.userId?.message} />
          </label>
          <label className="field">
            <span>{uiText("safety.what_happened")}</span>
            <select {...register("category")}>
              <option value="">{uiText("safety.choose_a_category")}</option>
              {reportCategories.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
            <FormError message={errors.category?.message} />
          </label>
          <label className="field">
            <span>{uiText("safety.additional_context")}</span>
            <textarea
              rows={4}
              placeholder={uiText(
                "safety.describe_a_fictional_incident_for_testing",
              )}
              maxLength={1000}
              {...register("details")}
            />
            <FormError message={errors.details?.message} />
          </label>
          <Button type="submit" loading={isSubmitting}>
            <Flag size={16} />
            {uiText("safety.save_mock_report")}
          </Button>
          <p className="small muted mt-3">
            {uiText("safety.no_real_moderation_action_will_be_taken")}
          </p>
        </form>
      )}
    </>
  );
}
export function SafetyPage({ publicPage = false }: { publicPage?: boolean }) {
  const params = useSearchParams();
  const reportId = params.get("report") || "";
  const store = useApp();
  const [tab, setTab] = useState(reportId ? "report" : "guidelines");
  const [blockId, setBlockId] = useState("");
  const [confirm, setConfirm] = useState(false);
  useEffect(() => {
    if (reportId) setTab("report");
  }, [reportId]);
  return (
    <div
      id="main-content"
      className={publicPage ? "container public-safety" : ""}
    >
      <PageHeader
        eyebrow={uiText("safety.the_safety_center")}
        {...copy.pages.safety}
        action={
          <span className="safe-label">
            <ShieldCheck size={18} />
            {uiText("safety.respect_isnt_optional")}
          </span>
        }
      />
      <div className="safety-hero">
        <span className="safety-hero-icon">
          <ShieldCheck size={42} strokeWidth={1.3} />
        </span>
        <div>
          <h2>{uiText("safety.your_space_your_boundaries")}</h2>
          <p>
            {uiText(
              "safety.good_connections_begin_with_feeling_comfortable_were",
            )}
            {brand.name}{" "}
            {uiText("safety.with_respect_choice_and_community_care_at")}
          </p>
        </div>
        <span className="adult-pill">
          18+<small>{uiText("safety.adults_only")}</small>
        </span>
      </div>
      <div className="tabs">
        <button
          className={tab === "guidelines" ? "active" : ""}
          onClick={() => setTab("guidelines")}
        >
          {uiText("safety.community_guidelines")}
        </button>
        <button
          className={tab === "report" ? "active" : ""}
          onClick={() => setTab("report")}
        >
          <Flag size={16} />
          {uiText("safety.report_a_user")}
        </button>
        <button
          className={tab === "blocked" ? "active" : ""}
          onClick={() => setTab("blocked")}
        >
          <Ban size={16} />
          {uiText("safety.blocked_users")}
          <span>{store.blocked.length}</span>
        </button>
      </div>
      {tab === "guidelines" && (
        <>
          <div className="guideline-grid">
            {[
              {
                icon: Heart,
                title: uiText("safety.lead_with_kindness"),
                text: uiText(
                  "safety.harassment_hate_speech_threats_and_unwanted_sexual",
                ),
              },
              {
                icon: UserCheck,
                title: uiText("safety.an_adultsonly_community"),
                text: uiText("safety.you_must_be_at_least_18_to"),
              },
              {
                icon: LockKeyhole,
                title: uiText("safety.keep_private_things_private"),
                text: uiText(
                  "safety.dont_share_your_home_address_financial_details",
                ),
              },
              {
                icon: AlertTriangle,
                title: uiText("safety.stay_one_step_ahead_of_scams"),
                text: uiText(
                  "safety.never_send_money_verification_codes_or_gifts",
                ),
              },
              {
                icon: Ban,
                title: uiText("safety.leave_whenever_you_need_to"),
                text: uiText("safety.skip_a_match_end_a_call_or"),
              },
              {
                icon: Flag,
                title: uiText("safety.speak_up_when_something_feels_off"),
                text: uiText(
                  "safety.use_reporting_tools_to_flag_concerning_behavior",
                ),
              },
            ].map((item) => (
              <article className="panel guideline-card" key={item.title}>
                <item.icon size={26} />
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </article>
            ))}
          </div>
          <div className="safety-bottom-note">
            <ShieldCheck size={22} />
            <div>
              <strong>
                {uiText("safety.safety_tools_are_a_foundation_not_a")}
              </strong>
              <p>
                {uiText(
                  "safety.real_blocking_moderation_age_assurance_and_privacy",
                )}
              </p>
            </div>
          </div>
        </>
      )}
      {tab === "report" && (
        <div className="safety-two-column">
          <section className="panel">
            <h2>{uiText("safety.lets_understand_what_happened")}</h2>
            <p className="muted">
              {uiText(
                "safety.a_respectful_community_is_everyones_responsibility",
              )}
            </p>
            <ReportForm key={reportId} userId={reportId} />
          </section>
          <aside>
            <div className="daily-note">
              <ShieldCheck size={28} />
              <h3>{uiText("safety.you_dont_have_to_keep_talking")}</h3>
              <p>{uiText("safety.end_a_conversation_at_any_time_if")}</p>
              <Button variant="secondary" onClick={() => setTab("blocked")}>
                {uiText("safety.manage_blocked_users")}
                <ArrowUpRight size={15} />
              </Button>
            </div>
            <div className="panel mt-5">
              <h3>{uiText("safety.this_sessions_reports")}</h3>
              <p className="muted small">
                {
                  store.reports.filter(
                    (r) => !["r1", "r2", "r3"].includes(r.id),
                  ).length
                }{" "}
                {uiText(
                  "safety.local_sample_reports_created_refreshing_the_page",
                )}
              </p>
            </div>
          </aside>
        </div>
      )}
      {tab === "blocked" && (
        <section className="panel blocked-panel">
          <h2>{uiText("safety.a_little_peace_of_mind")}</h2>
          <p className="muted">
            {uiText("safety.blocked_people_are_hidden_from_discovery_and")}
          </p>
          <div className="block-user-control">
            <Select
              label={uiText("safety.choose_a_fictional_user")}
              value={blockId}
              onChange={(e) => setBlockId(e.target.value)}
            >
              <option value="">{uiText("safety.select_a_person")}</option>
              {profiles
                .filter((p) => !store.blocked.includes(p.id))
                .map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
            </Select>
            <Button
              variant="secondary"
              disabled={!blockId}
              onClick={() => setConfirm(true)}
            >
              <Ban size={16} />
              {uiText("safety.block_user")}
            </Button>
          </div>
          {store.blocked.length ? (
            store.blocked.map((id) => {
              const p = profiles.find((p) => p.id === id)!;
              return (
                <div className="blocked-row" key={id}>
                  <Avatar profile={{ ...p, online: false }} />
                  <span>
                    <strong>{p.name}</strong>
                    <small>{p.country}</small>
                  </span>
                  <Button
                    variant="secondary"
                    onClick={() => store.unblockUser(id)}
                  >
                    {uiText("safety.unblock")}
                  </Button>
                </div>
              );
            })
          ) : (
            <EmptyState
              icon={<ShieldCheck size={30} />}
              title={uiText("safety.no_one_on_your_blocked_list")}
              description={uiText(
                "safety.youre_in_control_block_someone_whenever_you",
              )}
            />
          )}
          <div className="auth-demo-note">
            {uiText("safety.ui_blocking_only_backend_enforcement_is_required")}
          </div>
        </section>
      )}
      <Modal
        open={confirm}
        onClose={() => setConfirm(false)}
        title={uiText("safety.block_this_person")}
      >
        <p>
          {profiles.find((p) => p.id === blockId)?.name}{" "}
          {uiText("safety.will_be_hidden_from_discovery_and_matching")}
        </p>
        <div className="modal-actions">
          <Button variant="secondary" onClick={() => setConfirm(false)}>
            <X size={16} />
            {uiText("safety.cancel")}
          </Button>
          <Button
            variant="danger"
            onClick={async () => {
              await store.blockUser(blockId);
              setBlockId("");
              setConfirm(false);
            }}
          >
            {uiText("safety.block_user")}
          </Button>
        </div>
      </Modal>
      {publicPage && (
        <div className="public-safety-cta">
          <ButtonLink href="/register">
            {uiText("safety.connect_with_confidence")}
            <ArrowUpRight size={17} />
          </ButtonLink>
        </div>
      )}
    </div>
  );
}
