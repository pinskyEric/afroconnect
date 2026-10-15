"use client";
import { text as uiText } from "@/config/brand";

import { Photo } from "./photo";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Eye,
  EyeOff,
  ArrowUpRight,
  ArrowLeft,
  ShieldCheck,
  Check,
  Camera,
  Globe2,
  Sparkles,
} from "lucide-react";
import { brand } from "@/config/brand";
import { countries, languages, interests, getCountry } from "@/lib/data";
import {
  identitySchema,
  loginSchema,
  registerSchema,
  ageFromDate,
  readPhoto,
} from "@/lib/validation";
import { authService } from "@/services";
import { Button, ButtonLink, Logo, FormError, ChipSelect, Avatar } from "./ui";
import { useApp } from "./provider";
interface AuthValues {
  identity: string;
  password: string;
  age: boolean;
  consent: boolean;
}
export function AuthPage({
  mode,
}: {
  mode: "login" | "register" | "forgot-password";
}) {
  const router = useRouter();
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const schema =
    mode === "register"
      ? registerSchema
      : mode === "login"
        ? loginSchema
        : z.object({ identity: identitySchema });
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<AuthValues>({
    resolver: zodResolver(schema),
    defaultValues: { identity: "", password: "", age: false, consent: false },
  });
  const title =
    mode === "register"
      ? uiText("auth.your_people_are_out_there")
      : mode === "login"
        ? uiText("auth.good_to_see_you_again")
        : uiText("auth.lets_get_you_back_in");
  async function submit(values: AuthValues) {
    setError("");
    try {
      if (mode === "forgot-password") {
        await authService.recover(values.identity);
        setSuccess(true);
      } else if (mode === "register") {
        await authService.register(values.identity, values.password);
        router.push("/onboarding");
      } else {
        await authService.login(values.identity, values.password);
        router.push("/app");
      }
    } catch (e) {
      setError((e as Error).message);
    }
  }
  return (
    <main id="main-content" className="auth-page">
      <section className="auth-editorial">
        <Logo light />
        <div>
          <div className="eyebrow">
            {uiText("auth.rooted_in_africa_open_to_you")}
          </div>
          <h2 className="auth-editorial-title">
            {uiText("auth.a_world_of_people")}
            <br />
            {uiText("auth.a_place_to_belong")}
          </h2>
          <p>
            {uiText("auth.good_conversations_fresh_perspectives")}
            <br />
            {uiText("auth.connections_that_feel_a_little_more_you")}
          </p>
          <div className="auth-portraits">
            {["amina", "kwame", "zuri"].map((n) => (
              <Photo
                key={n}
                src={`/images/${n}.jpg`}
                alt={uiText("auth.fictional_community_member")}
              />
            ))}
          </div>
          <span className="auth-quote">
            {uiText("auth.sometimes_a_simple_hello_changes_your_whole")}
          </span>
        </div>
        <span>
          <ShieldCheck size={17} />{" "}
          {uiText("auth.a_respectful_community_for_adults_18")}
        </span>
      </section>
      <section className="auth-form-side">
        <Link className="back-link" href="/">
          <ArrowLeft size={16} />
          {uiText("auth.back_to_home")}
        </Link>
        <div className="auth-form-wrap">
          <span className="form-symbol">
            <Sparkles size={25} />
          </span>
          <h1>{title}</h1>
          <p>
            {mode === "register"
              ? `Join ${brand.name} and make your world a little bigger.`
              : mode === "login"
                ? uiText("auth.your_next_good_conversation_is_waiting")
                : uiText("auth.enter_a_fictional_email_or_phone_to")}
          </p>
          <div className="auth-demo-note">
            {uiText("auth.frontend_demo_no_real_account_is_created")}
          </div>
          {success ? (
            <div className="success-panel">
              <Check size={30} />
              <h2>{uiText("auth.recovery_preview_complete")}</h2>
              <p>{uiText("auth.in_the_live_product_an_eligible_account")}</p>
              <ButtonLink href="/login">
                {uiText("auth.back_to_log_in")}
                <ArrowUpRight size={16} />
              </ButtonLink>
            </div>
          ) : (
            <form onSubmit={handleSubmit(submit)} noValidate>
              <label className="field">
                <span>{uiText("auth.email_or_phone_number")}</span>
                <input
                  autoComplete="off"
                  placeholder={uiText("auth.alexexamplecom")}
                  {...register("identity")}
                />
                <FormError message={errors.identity?.message} />
              </label>
              {mode !== "forgot-password" && (
                <label className="field">
                  <span>
                    {uiText("auth.password")}
                    {mode === "login" && (
                      <Link href="/forgot-password">
                        {uiText("auth.forgot_password")}
                      </Link>
                    )}
                  </span>
                  <div className="password-field">
                    <input
                      aria-label={uiText("auth.password")}
                      type={show ? "text" : "password"}
                      autoComplete="off"
                      placeholder={uiText("auth.at_least_8_characters")}
                      {...register("password")}
                    />
                    <button
                      type="button"
                      aria-label={
                        show
                          ? uiText("auth.hide_password")
                          : uiText("auth.show_password")
                      }
                      onClick={() => setShow(!show)}
                    >
                      {show ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  <FormError message={errors.password?.message} />
                </label>
              )}
              {mode === "register" && (
                <>
                  <label className="checkbox-field">
                    <input type="checkbox" {...register("age")} />
                    <span>{uiText("auth.i_confirm_that_i_am_18_years")}</span>
                  </label>
                  <FormError message={errors.age?.message} />
                  <label className="checkbox-field">
                    <input type="checkbox" {...register("consent")} />
                    <span>
                      {uiText("auth.i_agree_to_the")}
                      <Link href="/terms">
                        {uiText("auth.terms_of_service")}
                      </Link>{" "}
                      {uiText("auth.and")}
                      <Link href="/privacy">
                        {uiText("auth.privacy_policy")}
                      </Link>
                      .
                    </span>
                  </label>
                  <FormError message={errors.consent?.message} />
                </>
              )}
              <FormError message={error} />
              <Button
                type="submit"
                loading={isSubmitting}
                className="full-width"
              >
                {mode === "register"
                  ? uiText("auth.create_demo_profile")
                  : mode === "login"
                    ? uiText("auth.log_in_to_the_demo")
                    : uiText("auth.preview_recovery")}
                <ArrowUpRight size={18} />
              </Button>
            </form>
          )}
          {mode !== "forgot-password" && (
            <>
              <div className="auth-divider">
                <span>{uiText("auth.or_take_a_look_around")}</span>
              </div>
              <ButtonLink
                variant="secondary"
                className="full-width"
                href="/app"
              >
                {uiText("auth.explore_the_demo")}
                <Globe2 size={17} />
              </ButtonLink>
              <p className="auth-switch">
                {mode === "register"
                  ? uiText("auth.already_feel_at_home")
                  : uiText("auth.new_around_here")}{" "}
                <Link href={mode === "register" ? "/login" : "/register"}>
                  {mode === "register"
                    ? uiText("auth.log_in")
                    : uiText("auth.join_the_community")}
                </Link>
              </p>
            </>
          )}
          <p className="auth-fine">
            <ShieldCheck size={14} />
            {uiText("auth.your_details_stay_in_this_session_no")}
          </p>
        </div>
        <span className="auth-copyright">
          © {new Date().getFullYear()} {brand.name}{" "}
          {uiText("auth.good_people_real_connections")}
        </span>
      </section>
    </main>
  );
}
const steps = [
  uiText("auth.your_username"),
  uiText("auth.adults_only"),
  uiText("auth.your_country"),
  uiText("auth.your_languages"),
  uiText("auth.your_interests"),
  uiText("auth.your_story"),
  uiText("auth.looking_good"),
];
export function Onboarding() {
  const store = useApp();
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [username, setUsername] = useState("");
  const [dob, setDob] = useState("");
  const [ageConfirm, setAgeConfirm] = useState(false);
  const [country, setCountry] = useState("Uganda");
  const [spoken, setSpoken] = useState<string[]>(["English"]);
  const [likes, setLikes] = useState<string[]>([]);
  const [bio, setBio] = useState("");
  const [name, setName] = useState("");
  const [photo, setPhoto] = useState("/images/kwame.jpg");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  async function next() {
    setError("");
    if (step === 0 && !/^[a-zA-Z0-9_.]{3,24}$/.test(username)) {
      setError(uiText("auth.choose_324_letters_numbers_dots_or_underscores"));
      return;
    }
    if (
      step === 1 &&
      (!ageConfirm || ageFromDate(dob) < 18 || ageFromDate(dob) > 110)
    ) {
      setError(uiText("auth.you_must_confirm_you_are_18_and"));
      return;
    }
    if (step === 3 && !spoken.length) {
      setError(uiText("auth.choose_at_least_one_language"));
      return;
    }
    if (step === 4 && !likes.length) {
      setError(uiText("auth.choose_at_least_one_interest"));
      return;
    }
    if (step === 5 && (name.trim().length < 2 || bio.length > 240)) {
      setError(uiText("auth.add_a_display_name_at_least_2"));
      return;
    }
    if (step === 6) {
      setLoading(true);
      await store.saveProfile({
        ...store.profile,
        name: name.trim(),
        username,
        age: ageFromDate(dob),
        country,
        languages: spoken,
        interests: likes,
        bio,
        photo,
      });
      router.push("/app");
    } else setStep(step + 1);
  }
  const preview = {
    ...store.profile,
    name: name || username,
    username,
    age: ageFromDate(dob),
    country,
    languages: spoken,
    interests: likes,
    bio,
    photo,
  };
  return (
    <main id="main-content" className="onboarding-page">
      <header>
        <Logo />
        <Link href="/">
          {uiText("auth.save_the_hello_for_later")}
          <ArrowUpRight size={15} />
        </Link>
      </header>
      <div className="onboarding-layout">
        <aside>
          <div className="eyebrow">{uiText("auth.lets_make_it_you")}</div>
          <h1>
            {uiText("auth.a_little_about_you")}
            <br />
            {uiText("auth.a_world_to_discover")}
          </h1>
          <p>{uiText("auth.use_fictional_details_for_this_preview_your")}</p>
          <ol>
            {steps.map((label, i) => (
              <li
                className={i === step ? "active" : i < step ? "done" : ""}
                key={label}
              >
                <span>{i < step ? <Check size={16} /> : i + 1}</span>
                {label}
              </li>
            ))}
          </ol>
        </aside>
        <section className="onboarding-card">
          <div className="step-progress">
            <span style={{ width: `${((step + 1) / 7) * 100}%` }} />
          </div>
          <div className="eyebrow">
            {uiText("auth.step")}
            {step + 1} {uiText("auth.of_7")}
          </div>
          <h2>{steps[step]}.</h2>
          {step === 0 && (
            <>
              <p>{uiText("auth.pick_a_name_thats_uniquely_you")}</p>
              <label className="field">
                <span>{uiText("auth.username")}</span>
                <input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder={uiText("auth.alexconnects")}
                  maxLength={24}
                />
              </label>
            </>
          )}
          {step === 1 && (
            <>
              <p>{uiText("auth.this_community_is_for_adults_aged_18")}</p>
              <label className="field">
                <span>{uiText("auth.date_of_birth")}</span>
                <input
                  type="date"
                  value={dob}
                  max={new Date().toISOString().slice(0, 10)}
                  onChange={(e) => setDob(e.target.value)}
                />
              </label>
              <label className="checkbox-field">
                <input
                  type="checkbox"
                  checked={ageConfirm}
                  onChange={(e) => setAgeConfirm(e.target.checked)}
                />
                {uiText("auth.i_confirm_im_18_or_older")}
              </label>
              <p className="small muted">
                {uiText("auth.date_of_birth_isnt_stored_only_your")}
              </p>
            </>
          )}
          {step === 2 && (
            <>
              <p>
                {uiText("auth.just_your_country_never_your_precise_location")}
              </p>
              <label className="field">
                <span>{uiText("auth.country")}</span>
                <select
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                >
                  {countries.map((c) => (
                    <option key={c.code}>{c.name}</option>
                  ))}
                </select>
              </label>
            </>
          )}
          {step === 3 && (
            <>
              <p>{uiText("auth.a_familiar_language_makes_that_first_hello")}</p>
              <ChipSelect
                options={languages}
                value={spoken}
                onChange={setSpoken}
              />
            </>
          )}
          {step === 4 && (
            <>
              <p>{uiText("auth.what_lights_you_up_choose_at_least")}</p>
              <ChipSelect
                options={interests}
                value={likes}
                onChange={setLikes}
              />
            </>
          )}
          {step === 5 && (
            <>
              <div className="photo-upload">
                <Avatar profile={preview} size={84} />
                <label className="btn btn-secondary">
                  <Camera size={17} />
                  {uiText("auth.add_photo")}
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    className="sr-only"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (file)
                        try {
                          setPhoto(await readPhoto(file));
                          setError("");
                        } catch (err) {
                          setError((err as Error).message);
                        }
                    }}
                  />
                </label>
              </div>
              <p className="small muted">
                {uiText("auth.jpg_png_or_webp_up_to_5")}
              </p>
              <label className="field">
                <span>{uiText("auth.display_name")}</span>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={uiText("auth.alex")}
                  maxLength={40}
                />
              </label>
              <label className="field">
                <span>
                  {uiText("auth.a_little_about_you_2")}
                  <small>{bio.length}/240</small>
                </span>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  maxLength={240}
                  rows={3}
                  placeholder={uiText("auth.your_interests_a_fun_fact_or_your")}
                />
              </label>
            </>
          )}
          {step === 6 && (
            <div className="onboarding-review">
              <Avatar profile={preview} size={105} />
              <h2>
                {preview.name}, {preview.age}
              </h2>
              <p>
                @{username} · {getCountry(country)?.flag} {country}
              </p>
              <p>{bio || uiText("auth.ready_for_a_new_conversation")}</p>
              <div className="chip-group">
                {likes.map((i) => (
                  <span className="tag" key={i}>
                    {i}
                  </span>
                ))}
              </div>
              <p className="small muted">{spoken.join(" · ")}</p>
              <div className="auth-demo-note">
                {uiText("auth.looking_good_this_is_a_fictional_sessiononly")}
              </div>
            </div>
          )}
          <FormError message={error} />
          <div className="onboarding-actions">
            {step > 0 && (
              <Button
                variant="ghost"
                onClick={() => {
                  setStep(step - 1);
                  setError("");
                }}
              >
                <ArrowLeft size={16} />
                {uiText("auth.back")}
              </Button>
            )}
            <Button onClick={next} loading={loading}>
              {step === 6 ? uiText("auth.enter_the_community") : "Continue"}
              <ArrowUpRight size={18} />
            </Button>
          </div>
        </section>
      </div>
    </main>
  );
}
