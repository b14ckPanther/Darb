export const darbPlatform = {
  name: "Darb",
  nameArabic: "درب",
  rootDomain: "darb.co.il",
  countryCode: "IL",
  currency: "ILS",
  currencySymbol: "₪",
  timezone: "Asia/Jerusalem",
} as const;

export const darbApplications = {
  main: {
    name: "Darb",
    productionHost: "darb.co.il",
  },
  admin: {
    name: "Darb Admin",
    productionHost: "admin.darb.co.il",
  },
} as const;
