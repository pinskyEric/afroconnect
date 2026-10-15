import test from "node:test";
import assert from "node:assert/strict";
import {
  filterProfiles,
  authService,
  messagingService,
  safetyService,
  matchmakingService,
} from "../src/services/mock";
import { profiles, countries, reportCategories } from "../src/lib/data";
import {
  ageFromDate,
  identitySchema,
  loginSchema,
  registerSchema,
  profileSchema,
} from "../src/lib/validation";
test("all mock profiles are adults with country-level locations", () => {
  assert.ok(
    profiles.every(
      (p) => p.age >= 18 && countries.some((c) => c.name === p.country),
    ),
  );
  assert.equal(new Set(profiles.map((p) => p.id)).size, profiles.length);
});
test("country and region filters work together", () => {
  assert.deepEqual(
    filterProfiles({ country: "Uganda", region: "East Africa" }).map(
      (p) => p.name,
    ),
    ["Amina"],
  );
  assert.equal(
    filterProfiles({ country: "Uganda", region: "West Africa" }).length,
    0,
  );
});
test("language, interest, online, and case-insensitive search combine", () => {
  assert.deepEqual(
    filterProfiles({
      language: "English",
      interest: "Music",
      online: true,
      query: "kwAME",
    }).map((p) => p.id),
    ["u2"],
  );
});
test("empty filters return all profiles without mutating source", () => {
  assert.equal(filterProfiles().length, profiles.length);
  assert.equal(filterProfiles({ query: "no such person" }).length, 0);
});
test("age eligibility handles exact birthdays and future dates", () => {
  const now = new Date("2026-10-14T12:00:00");
  assert.equal(ageFromDate("2008-10-14", now), 18);
  assert.equal(ageFromDate("2008-10-15", now), 17);
  assert.equal(ageFromDate("2030-01-01", now), 0);
  assert.equal(ageFromDate("", now), 0);
});
test("identity accepts email and phone but rejects malformed input", () => {
  assert.ok(identitySchema.safeParse("alex@example.com").success);
  assert.ok(identitySchema.safeParse("+256 700 000 000").success);
  assert.ok(!identitySchema.safeParse("abc").success);
});
test("registration requires adult and terms consent", () => {
  const input = {
    identity: "alex@example.com",
    password: "demo-only-123",
    age: true,
    consent: true,
  };
  assert.ok(registerSchema.safeParse(input).success);
  assert.ok(!registerSchema.safeParse({ ...input, age: false }).success);
  assert.ok(!registerSchema.safeParse({ ...input, consent: false }).success);
});
test("login and profile validation reject short or invalid content", () => {
  assert.ok(!loginSchema.safeParse({ identity: "abc", password: "1" }).success);
  assert.ok(
    !profileSchema.safeParse({ name: "A", username: "bad name", bio: "" })
      .success,
  );
  assert.ok(
    !profileSchema.safeParse({
      name: "Alex",
      username: "alex",
      bio: "x".repeat(241),
    }).success,
  );
});
test("authentication is explicitly simulated with a deterministic failure fixture", async () => {
  assert.deepEqual(
    await authService.login("demo@example.com", "demo-password"),
    { mode: "demo" },
  );
  await assert.rejects(
    authService.login("error@demo.test", "demo-password"),
    /Simulated/,
  );
});
test("message service returns local sent message", async () => {
  const m = await messagingService.send("c1", "Hello");
  assert.equal(m.text, "Hello");
  assert.equal(m.from, "me");
  assert.ok(m.id);
});
test("safety report is a local pending value, categories are comprehensive", async () => {
  assert.equal(reportCategories.length, 9);
  const r = await safetyService.report({
    userId: "u1",
    category: "Spam",
    details: "Fictional test incident",
  });
  assert.equal(r.status, "pending");
  assert.ok(r.id);
});
test("matching supports success, empty and failure outcomes", async () => {
  assert.equal(
    (await matchmakingService.find({ country: "Uganda" }))?.id,
    "u1",
  );
  assert.equal(await matchmakingService.find({}, "empty"), null);
  await assert.rejects(matchmakingService.find({}, "error"), /demo connection/);
});
