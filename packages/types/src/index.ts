import type { darbApplications } from "@darb/config/platform";

export type DarbSurface = keyof typeof darbApplications;
export type DarbApplication = (typeof darbApplications)[DarbSurface];
