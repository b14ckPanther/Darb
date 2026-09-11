import type { SupportedLocale } from "@darb/i18n";

export interface RestaurantOpeningInterval {
  closesAt: string;
  opensAt: string;
  weekday: number;
}

export interface RestaurantNextOpening {
  dayOffset: number;
  opensAt: string;
  weekday: number;
}

export interface RestaurantOpeningStatus {
  isOpen: boolean;
  nextOpening: RestaurantNextOpening | null;
}

const timePattern = /^(?:[01]\d|2[0-3]):[0-5]\d$/;

export function isRestaurantOpeningInterval(value: unknown): value is RestaurantOpeningInterval {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<RestaurantOpeningInterval>;
  return (
    Number.isInteger(candidate.weekday) &&
    Number(candidate.weekday) >= 1 &&
    Number(candidate.weekday) <= 7 &&
    typeof candidate.opensAt === "string" &&
    typeof candidate.closesAt === "string" &&
    timePattern.test(candidate.opensAt) &&
    timePattern.test(candidate.closesAt) &&
    candidate.opensAt !== candidate.closesAt
  );
}

export function restaurantOpeningIntervalsOverlap(
  intervals: readonly RestaurantOpeningInterval[],
): boolean {
  const segments = intervals.flatMap((interval, index) => {
    if (!isRestaurantOpeningInterval(interval)) return [{ end: 1, index, start: 0 }];
    const start = (interval.weekday - 1) * 1440 + timeToMinute(interval.opensAt);
    const close = timeToMinute(interval.closesAt);
    const open = timeToMinute(interval.opensAt);
    const end = start + (close > open ? close - open : 1440 - open + close);
    return end <= 10080
      ? [{ end, index, start }]
      : [
          { end: 10080, index, start },
          { end: end - 10080, index, start: 0 },
        ];
  });
  return segments.some((left, leftIndex) =>
    segments
      .slice(leftIndex + 1)
      .some(
        (right) => left.index !== right.index && left.start < right.end && right.start < left.end,
      ),
  );
}

export function getRestaurantOpeningStatus(
  intervals: readonly RestaurantOpeningInterval[],
  timezone: string,
  instant: Date = new Date(),
): RestaurantOpeningStatus {
  const local = getLocalClock(instant, timezone);
  const currentMinute = local.hour * 60 + local.minute;
  const previousWeekday = local.weekday === 1 ? 7 : local.weekday - 1;

  const openFromCurrentDay = intervals.some((interval) => {
    if (interval.weekday !== local.weekday) return false;
    const opensAt = timeToMinute(interval.opensAt);
    const closesAt = timeToMinute(interval.closesAt);
    return closesAt > opensAt
      ? currentMinute >= opensAt && currentMinute < closesAt
      : currentMinute >= opensAt;
  });
  const openFromPreviousDay = intervals.some((interval) => {
    if (interval.weekday !== previousWeekday) return false;
    const opensAt = timeToMinute(interval.opensAt);
    const closesAt = timeToMinute(interval.closesAt);
    return closesAt < opensAt && currentMinute < closesAt;
  });

  if (openFromCurrentDay || openFromPreviousDay) {
    return { isOpen: true, nextOpening: null };
  }

  for (let dayOffset = 0; dayOffset <= 7; dayOffset += 1) {
    const weekday = ((local.weekday - 1 + dayOffset) % 7) + 1;
    const next = intervals
      .filter(
        (interval) =>
          interval.weekday === weekday &&
          (dayOffset > 0 || timeToMinute(interval.opensAt) > currentMinute),
      )
      .sort((left, right) => left.opensAt.localeCompare(right.opensAt))[0];
    if (next) return { isOpen: false, nextOpening: { dayOffset, opensAt: next.opensAt, weekday } };
  }

  return { isOpen: false, nextOpening: null };
}

export function formatRestaurantTime(value: string, locale: SupportedLocale): string {
  if (!timePattern.test(value)) throw new RangeError("Invalid opening time");
  const [hour = 0, minute = 0] = value.split(":").map(Number);
  const date = new Date(Date.UTC(2020, 0, 1, hour, minute));
  return new Intl.DateTimeFormat(locale, {
    hour: "numeric",
    minute: "2-digit",
    timeZone: "UTC",
  }).format(date);
}

export function formatRestaurantWeekday(
  weekday: number,
  locale: SupportedLocale,
  width: "long" | "short" = "long",
): string {
  if (!Number.isInteger(weekday) || weekday < 1 || weekday > 7) {
    throw new RangeError("Invalid ISO weekday");
  }
  const monday = Date.UTC(2024, 0, 1);
  return new Intl.DateTimeFormat(locale, { timeZone: "UTC", weekday: width }).format(
    new Date(monday + (weekday - 1) * 86_400_000),
  );
}

function getLocalClock(instant: Date, timezone: string) {
  if (Number.isNaN(instant.getTime())) throw new RangeError("Invalid instant");
  const parts = new Intl.DateTimeFormat("en-CA", {
    day: "2-digit",
    hour: "2-digit",
    hourCycle: "h23",
    minute: "2-digit",
    month: "2-digit",
    timeZone: timezone,
    year: "numeric",
  }).formatToParts(instant);
  const part = (type: Intl.DateTimeFormatPartTypes) => {
    const value = parts.find((candidate) => candidate.type === type)?.value;
    if (!value) throw new RangeError(`Missing ${type}`);
    return Number(value);
  };
  const year = part("year");
  const month = part("month");
  const day = part("day");
  const utcWeekday = new Date(Date.UTC(year, month - 1, day)).getUTCDay();
  return {
    hour: part("hour"),
    minute: part("minute"),
    weekday: utcWeekday === 0 ? 7 : utcWeekday,
  };
}

function timeToMinute(value: string): number {
  const [hour = 0, minute = 0] = value.split(":").map(Number);
  return hour * 60 + minute;
}
