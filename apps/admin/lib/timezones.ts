const runtimeTimezones = Intl.supportedValuesOf("timeZone");
const timezoneSet = new Set(runtimeTimezones);

export function getSupportedTimezones(currentTimezone?: string | null): string[] {
  if (currentTimezone && !timezoneSet.has(currentTimezone) && isValidTimezone(currentTimezone)) {
    return [currentTimezone, ...runtimeTimezones];
  }

  return runtimeTimezones;
}

export function isValidTimezone(value: string): boolean {
  if (!value || value.length > 100) {
    return false;
  }

  try {
    new Intl.DateTimeFormat("en", { timeZone: value }).format();
    return true;
  } catch {
    return false;
  }
}
