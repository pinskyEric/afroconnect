import { text as uiText } from "@/config/brand";
import { WifiOff, ArrowUpRight } from "lucide-react";
import { Logo, ButtonLink } from "@/components/ui";
export default function Offline() {
  return (
    <main id="main-content" className="fallback-page">
      <Logo />
      <WifiOff size={54} strokeWidth={1} />
      <span className="eyebrow">{uiText("page.a_moment_to_reconnect")}</span>
      <h1>{uiText("page.your_world_will_be_right_here")}</h1>
      <p>
        {uiText("page.this_is_the_offline_fallback_design_automatic")}
        <br />
        {uiText("page.and_message_synchronization_are_not_enabled_in")}
      </p>
      <ButtonLink href="/app">
        {uiText("page.try_the_community")}
        <ArrowUpRight size={17} />
      </ButtonLink>
    </main>
  );
}
