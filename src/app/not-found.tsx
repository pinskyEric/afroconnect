import { text as uiText } from "@/config/brand";
import { Logo, ButtonLink } from "@/components/ui";
import { ArrowUpRight, Compass } from "lucide-react";
export default function NotFound() {
  return (
    <main id="main-content" className="fallback-page">
      <Logo />
      <Compass size={60} strokeWidth={1} />
      <span className="eyebrow">
        {uiText("notfound.a_little_off_the_map_404")}
      </span>
      <h1>{uiText("notfound.lets_find_your_way_back")}</h1>
      <p>{uiText("notfound.this_corner_of_the_community_doesnt_exist")}</p>
      <ButtonLink href="/">
        {uiText("notfound.back_to_home")}
        <ArrowUpRight size={17} />
      </ButtonLink>
    </main>
  );
}
