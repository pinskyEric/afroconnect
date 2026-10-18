/** Contract-documented adapter composition root. Set NEXT_PUBLIC_API_BASE_URL for Laravel; mock mode remains an explicit offline preview. */
import * as mock from "./mock";
import * as laravel from "./laravel";

export const apiMode = Boolean(process.env.NEXT_PUBLIC_API_BASE_URL) && process.env.NEXT_PUBLIC_SERVICE_ADAPTER !== "mock";
const selected = apiMode ? laravel : mock;
export const authService = selected.authService;
export const profileService = selected.profileService;
export const discoveryService = selected.discoveryService;
export const matchmakingService = selected.matchmakingService;
export const callService = selected.callService;
export const messagingService = selected.messagingService;
export const friendsService = selected.friendsService;
export const notificationService = selected.notificationService;
export const safetyService = selected.safetyService;
export const adminService = selected.adminService;
export const accountService = selected.accountService;
export const appealService = selected.appealService;
export type * from "./interfaces";
