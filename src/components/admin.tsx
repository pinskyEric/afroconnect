"use client";
import { text as uiText } from "@/config/brand";

import { useState } from "react";
import {
  ArrowUpRight,
  Users,
  Radio,
  Video,
  Shuffle,
  Flag,
  UserX,
  Ban,
  CheckCircle2,
  ShieldCheck,
  Activity,
} from "lucide-react";
import { profiles, adminStats } from "@/lib/data";
import type { AdminUser } from "@/lib/types";
import { useApp } from "./provider";
import {
  Avatar,
  Button,
  ButtonLink,
  DemoNotice,
  EmptyState,
  Logo,
  Modal,
  PageHeader,
  SearchInput,
  Select,
  Tag,
} from "./ui";
export function Admin() {
  const store = useApp();
  const [tab, setTab] = useState("reports");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [pending, setPending] = useState<{
    id: string;
    status: AdminUser["status"];
  } | null>(null);
  const [viewReport, setViewReport] = useState<string | null>(null);
  const report = store.reports.find((r) => r.id === viewReport);
  const reports = store.reports.filter(
    (r) =>
      (filter === "all" || r.status === filter) &&
      `${profiles.find((p) => p.id === r.userId)?.name} ${r.category}`
        .toLowerCase()
        .includes(query.toLowerCase()),
  );
  const users = profiles.filter(
    (p) =>
      (filter === "all" || (store.statuses[p.id] || "active") === filter) &&
      `${p.name} ${p.country}`.toLowerCase().includes(query.toLowerCase()),
  );
  const stats = [
    {
      label: uiText("admin.registered_users"),
      value: adminStats.totalUsers,
      icon: Users,
    },
    {
      label: uiText("admin.online_users"),
      value: adminStats.onlineUsers,
      icon: Radio,
    },
    {
      label: uiText("admin.simulated_sessions"),
      value: adminStats.activeSessions,
      icon: Video,
    },
    {
      label: uiText("admin.matches_today"),
      value: adminStats.matchesToday,
      icon: Shuffle,
    },
    {
      label: uiText("admin.pending_reports"),
      value: store.reports.filter((r) => r.status === "pending").length,
      icon: Flag,
    },
    {
      label: uiText("admin.suspended_accounts"),
      value: Object.values(store.statuses).filter((s) => s === "suspended")
        .length,
      icon: UserX,
    },
    {
      label: uiText("admin.banned_accounts"),
      value: Object.values(store.statuses).filter((s) => s === "banned").length,
      icon: Ban,
    },
  ];
  return (
    <div className="admin-page">
      <header>
        <Logo />
        <span>
          <ShieldCheck size={17} />
          {uiText("admin.community_operations")}
          <Tag>{uiText("admin.development")}</Tag>
        </span>
        <ButtonLink variant="secondary" href="/app">
          {uiText("admin.back_to_community")}
          <ArrowUpRight size={16} />
        </ButtonLink>
      </header>
      <main id="main-content" className="container">
        <DemoNotice admin />
        <PageHeader
          eyebrow={uiText("admin.a_healthier_community_starts_here")}
          title={uiText("admin.a_little_care_a_stronger_community")}
          description={uiText(
            "admin.fictional_data_and_moderation_workflows_for_development",
          )}
        />
        <div className="admin-stats">
          {stats.map((s) => (
            <div className="panel" key={s.label}>
              <s.icon size={20} />
              <strong>{s.value.toLocaleString()}</strong>
              <span>{s.label}</span>
              <small>{uiText("admin.demo_metric")}</small>
            </div>
          ))}
        </div>
        <div className="admin-content">
          <section className="panel admin-table-panel">
            <div className="tabs">
              <button
                className={tab === "reports" ? "active" : ""}
                onClick={() => {
                  setTab("reports");
                  setFilter("all");
                  setQuery("");
                }}
              >
                <Flag size={16} />
                {uiText("admin.report_management")}
              </button>
              <button
                className={tab === "users" ? "active" : ""}
                onClick={() => {
                  setTab("users");
                  setFilter("all");
                  setQuery("");
                }}
              >
                <Users size={16} />
                {uiText("admin.user_management")}
              </button>
            </div>
            <div className="admin-filters">
              <SearchInput
                value={query}
                onChange={setQuery}
                placeholder={
                  tab === "reports"
                    ? uiText("admin.search_reports")
                    : uiText("admin.search_users")
                }
              />
              <Select
                label={uiText("admin.status")}
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
              >
                <option value="all">{uiText("admin.all_statuses")}</option>
                {(tab === "reports"
                  ? ["pending", "resolved"]
                  : ["active", "suspended", "banned"]
                ).map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </Select>
            </div>
            <div className="table-scroll">
              {tab === "reports" ? (
                <table>
                  <thead>
                    <tr>
                      <th>{uiText("admin.profile")}</th>
                      <th>{uiText("admin.category")}</th>
                      <th>{uiText("admin.created")}</th>
                      <th>{uiText("admin.status")}</th>
                      <th>{uiText("admin.action")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reports.map((r) => {
                      const p = profiles.find((p) => p.id === r.userId)!;
                      return (
                        <tr key={r.id}>
                          <td>
                            <div className="table-person">
                              <Avatar
                                profile={{ ...p, online: false }}
                                size={34}
                              />
                              {p.name}
                            </div>
                          </td>
                          <td>{r.category}</td>
                          <td>{r.date}</td>
                          <td>
                            <span className={`status-label ${r.status}`}>
                              {r.status}
                            </span>
                          </td>
                          <td>
                            <button
                              className="text-link"
                              onClick={() => setViewReport(r.id)}
                            >
                              {uiText("admin.review")}
                              <ArrowUpRight size={13} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              ) : (
                <table>
                  <thead>
                    <tr>
                      <th>{uiText("admin.profile")}</th>
                      <th>{uiText("admin.country")}</th>
                      <th>{uiText("admin.status")}</th>
                      <th>{uiText("admin.mock_actions")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((p) => (
                      <tr key={p.id}>
                        <td>
                          <div className="table-person">
                            <Avatar
                              profile={{ ...p, online: false }}
                              size={34}
                            />
                            <span>
                              {p.name}
                              <small>@{p.username}</small>
                            </span>
                          </div>
                        </td>
                        <td>{p.country}</td>
                        <td>
                          <span
                            className={`status-label ${store.statuses[p.id] || "active"}`}
                          >
                            {store.statuses[p.id] || "active"}
                          </span>
                        </td>
                        <td>
                          <div className="table-actions">
                            {(store.statuses[p.id] || "active") !==
                              "active" && (
                              <Button
                                variant="ghost"
                                onClick={() =>
                                  setPending({ id: p.id, status: "active" })
                                }
                              >
                                {uiText("admin.restore")}
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              disabled={store.statuses[p.id] === "suspended"}
                              onClick={() =>
                                setPending({ id: p.id, status: "suspended" })
                              }
                            >
                              {uiText("admin.suspend")}
                            </Button>
                            <Button
                              variant="ghost"
                              disabled={store.statuses[p.id] === "banned"}
                              onClick={() =>
                                setPending({ id: p.id, status: "banned" })
                              }
                            >
                              {uiText("admin.ban")}
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            {(tab === "reports" ? !reports.length : !users.length) && (
              <EmptyState
                title={uiText("admin.nothing_matches_those_filters")}
                description={uiText("admin.try_a_different_search_or_status")}
                action={
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setQuery("");
                      setFilter("all");
                    }}
                  >
                    {uiText("admin.clear_filters")}
                  </Button>
                }
              />
            )}
          </section>
          <aside className="panel admin-activity">
            <h3>
              <Activity size={19} />
              {uiText("admin.recent_activity")}
            </h3>
            {store.reports.slice(0, 4).map((r) => (
              <div key={r.id}>
                <span
                  className={
                    r.status === "resolved"
                      ? "activity-dot green"
                      : "activity-dot"
                  }
                />
                <p>
                  <strong>
                    {r.status === "resolved"
                      ? uiText("admin.demo_report_resolved")
                      : uiText("admin.sample_report_created")}
                  </strong>
                  {r.category}
                  <small>
                    {r.date} {uiText("admin.mock_activity")}
                  </small>
                </p>
              </div>
            ))}
            {Object.entries(store.statuses).map(([id, status]) => (
              <div key={id}>
                <span className="activity-dot" />
                <p>
                  <strong>
                    {uiText("admin.mock_account")}
                    {status}
                  </strong>
                  {profiles.find((p) => p.id === id)?.name}
                  <small>{uiText("admin.this_session_only")}</small>
                </p>
              </div>
            ))}
            <div className="admin-info">
              <ShieldCheck size={20} />
              <p>{uiText("admin.this_route_is_intentionally_public_in_the")}</p>
            </div>
          </aside>
        </div>
      </main>
      <Modal
        open={!!pending}
        onClose={() => setPending(null)}
        title={uiText("admin.confirm_a_mock_moderation_action")}
      >
        <p>
          {uiText("admin.set")}
          {profiles.find((p) => p.id === pending?.id)?.name}{" "}
          {uiText("admin.to")}
          <strong>{pending?.status}</strong>{" "}
          {uiText("admin.in_local_demo_state_no_real_account")}
        </p>
        <div className="modal-actions">
          <Button variant="secondary" onClick={() => setPending(null)}>
            {uiText("admin.cancel")}
          </Button>
          <Button
            variant={pending?.status === "active" ? "primary" : "danger"}
            onClick={async () => {
              if (pending) await store.moderate(pending.id, pending.status);
              setPending(null);
            }}
          >
            {uiText("admin.confirm_demo_action")}
          </Button>
        </div>
      </Modal>
      <Modal
        open={!!report}
        onClose={() => setViewReport(null)}
        title={uiText("admin.review_sample_report")}
      >
        {report && (
          <>
            <span className={`status-label ${report.status}`}>
              {report.status}
            </span>
            <h3 className="mt-4">{report.category}</h3>
            <p className="muted small">
              {uiText("admin.reported_fictional_profile")}
              {profiles.find((p) => p.id === report.userId)?.name}
            </p>
            <p className="report-details">{report.details}</p>
            <div className="auth-demo-note">
              {uiText("admin.this_action_affects_only_mock_application_state")}
            </div>
            <div className="modal-actions">
              <Button variant="secondary" onClick={() => setViewReport(null)}>
                {uiText("admin.close")}
              </Button>
              <Button
                disabled={report.status === "resolved"}
                onClick={async () => {
                  await store.resolveReport(report.id);
                  setViewReport(null);
                }}
              >
                <CheckCircle2 size={16} />
                {uiText("admin.mark_resolved")}
              </Button>
            </div>
          </>
        )}
      </Modal>
    </div>
  );
}
