import content from "./content.en.json";
/** Product identity, design tokens and shared editorial copy. Replace here to rebrand. */
export const brand = {
  name: "AfriConnect",
  shortName: "ac",
  tagline: "Good people. Real connections.",
  description:
    "A little closer to your world. Meet new people across Africa and beyond.",
  contact: "hello@africonnect.example",
  colors: {
    primary: "#7552ed",
    secondary: "#c3f083",
    ink: "#202329",
    muted: "#66676e",
    background: "#faf9f6",
    surface: "#ffffff",
    border: "#e8e7e3",
  },
  fonts: { heading: "Manrope, sans-serif", body: "DM Sans, sans-serif" },
  radius: { small: "10px", medium: "18px", large: "28px" },
  spacing: [4, 8, 12, 16, 24, 32, 48, 64],
  typeScale: [12, 14, 16, 20, 24, 32, 48, 64],
  shadow: "0 12px 40px rgba(32,35,41,.06)",
  logo: { mark: "connected-bubbles", asset: "" },
};
export const copy = {
  hero: {
    eyebrow: "ROOTED IN AFRICA. OPEN TO THE WORLD.",
    title: ["A new face.", "A new story.", "A real connection."],
    description:
      "Meet people who get you. Share a laugh, discover a new culture, or find your kind of people — across Africa and beyond.",
    primary: "Start Meeting People",
    secondary: "Explore the Platform",
  },
  demo: "Frontend preview · All people and interactions are simulated.",
  adult: "For adults 18+ only",
  nav: {
    discover: "Discover",
    how: "How it works",
    safety: "Our safety promise",
    login: "Log in",
    register: "Join the community",
  },
  pages: {
    dashboard: {
      title: "Your world, a little closer.",
      description: "A new conversation could be the start of something good.",
    },
    discover: {
      title: "Find your kind of people.",
      description: "Different places. Shared interests. Endless possibilities.",
    },
    match: {
      title: "Say hello to someone new.",
      description: "One conversation can open up a whole new world.",
    },
    messages: {
      title: "Keep the conversation going.",
      description: "A little hello goes a long way.",
    },
    friends: {
      title: "Good people, closer.",
      description: "The connections you want to keep.",
    },
    notifications: {
      title: "You’re in the loop.",
      description: "A little update from your corner of the world.",
    },
    profile: {
      title: "A little more you.",
      description: "Your story starts here. Let your personality shine.",
    },
    settings: {
      title: "Make yourself at home.",
      description: "Your experience, your preferences, your choice.",
    },
    safety: {
      title: "Good connections feel safe.",
      description: "You’re always in control of who you connect with.",
    },
  },
};
export const navigation = [
  { href: "/app", label: "Overview", icon: "home" },
  { href: "/app/discover", label: "Discover people", icon: "compass" },
  { href: "/app/match", label: "Start matching", icon: "shuffle" },
  { href: "/app/messages", label: "Messages", icon: "message" },
  { href: "/app/friends", label: "Friends", icon: "users" },
  { href: "/app/notifications", label: "Notifications", icon: "bell" },
] as const;
export const faqs = [
  [
    `What is ${brand.name}?`,
    "An Africa-first space for adults to discover people through shared interests, languages, and conversations. This version is a frontend prototype with fictional profiles.",
  ],
  [
    `Is ${brand.name} free to use?`,
    "This prototype is completely free to explore. There are no payments or paid services connected. Launch pricing has not been decided.",
  ],
  [
    "Do I have to be in Africa to join?",
    "Not at all. We’re rooted in Africa and open to the world. Everyone aged 18 or above is welcome.",
  ],
  [
    "Can I choose who I connect with?",
    "Yes. Explore by country, language, and interests, or try a random match. You can always skip, disconnect, or block.",
  ],
  [
    "How do you keep the community safe?",
    "The prototype includes reporting, blocking, privacy preferences, and an adults-only flow. Real moderation, age assurance, and enforcement will require a secure backend before launch.",
  ],
  [
    "Are video calls and messages live?",
    "No. All calls, messages, accounts, and moderation actions in this preview are simulated locally. No one else receives your messages.",
  ],
];

/** Central English copy catalog; literal keys remain stable when values are edited. */
export function text(key: keyof typeof content): string {
  return content[key].replaceAll("AfriConnect", brand.name);
}
