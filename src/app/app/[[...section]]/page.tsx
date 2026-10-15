import { Suspense } from "react";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/layouts";
import { Dashboard, Discovery } from "@/components/discovery";
import { Matching } from "@/components/matching";
import { Messages, Friends, Notifications } from "@/components/social";
import { MyProfile, Settings } from "@/components/account";
import { SafetyPage } from "@/components/safety";
import { SkeletonCards } from "@/components/ui";
const pages = {
  overview: Dashboard,
  discover: Discovery,
  match: Matching,
  messages: Messages,
  friends: Friends,
  notifications: Notifications,
  profile: MyProfile,
  settings: Settings,
  safety: SafetyPage,
};
export default async function AppPage({
  params,
}: {
  params: Promise<{ section?: string[] }>;
}) {
  const { section } = await params;
  if (section && section.length > 1) notFound();
  const key = section?.[0] || "overview";
  if (!(key in pages)) notFound();
  const Page = pages[key as keyof typeof pages];
  return (
    <AppShell>
      <Suspense fallback={<SkeletonCards />}>
        <Page />
      </Suspense>
    </AppShell>
  );
}
