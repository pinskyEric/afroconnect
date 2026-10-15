"use client";
import { text as uiText } from "@/config/brand";

import { Button, Logo } from "@/components/ui";
export default function ErrorPage({
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <main id="main-content" className="fallback-page">
      <Logo />
      <span className="eyebrow">
        {uiText("error.a_small_bump_in_the_road")}
      </span>
      <h1>{uiText("error.lets_try_that_again")}</h1>
      <p>{uiText("error.the_demo_couldnt_load_this_screen_no")}</p>
      <Button onClick={reset}>{uiText("error.try_again")}</Button>
    </main>
  );
}
