import type { SupportedLocale } from "@darb/i18n";

interface RestaurantCopy {
  address: string;
  allLocations: string;
  availableAt: string;
  categories: string;
  call: string;
  chooseLocation: string;
  close: string;
  closed: string;
  closedNow: string;
  details: string;
  email: string;
  language: string;
  location: string;
  loading: string;
  menu: string;
  map: string;
  landingDescription: string;
  landingTitle: string;
  productName: string;
  retry: string;
  loadErrorDescription: string;
  loadErrorTitle: string;
  visitDarb: string;
  heroVideo: (businessName: string) => string;
  pauseHeroVideo: string;
  playHeroVideo: string;
  modifierOptional: string;
  modifierRequired: string;
  noItems: string;
  noMenusDescription: string;
  noMenusTitle: string;
  openNow: string;
  openingHours: string;
  opensAt: (time: string) => string;
  opensOn: (day: string, time: string) => string;
  opensTomorrowAt: (time: string) => string;
  poweredBy: string;
  selections: (minimum: number, maximum: number) => string;
  skipToMenu: string;
  soldOut: string;
  unavailableDescription: string;
  unavailableTitle: string;
  variants: string;
  viewDetails: string;
  website: string;
  whatsapp: string;
}

const copy: Record<SupportedLocale, RestaurantCopy> = {
  ar: {
    address: "العنوان",
    allLocations: "كل الفروع",
    availableAt: "المتوفر بهالفرع",
    categories: "التصنيفات",
    call: "اتصل",
    chooseLocation: "اختار الفرع",
    close: "سكّر",
    closed: "مغلق",
    closedNow: "مغلق هلا",
    details: "التفاصيل",
    email: "البريد الإلكتروني",
    language: "اللغة",
    location: "الفرع",
    loading: "عم نحمّل القائمة",
    menu: "القائمة",
    map: "افتح الخريطة",
    landingDescription: "افتح رابط المطعم على درب عشان تشوف قائمته المنشورة.",
    landingTitle: "قائمة المطعم، بتجربة مرتّبة وواضحة.",
    productName: "درب للمطاعم",
    retry: "جرّب كمان مرة",
    loadErrorDescription: "ما قدرنا نحمّل القائمة هالمرة. جرّب كمان مرة.",
    loadErrorTitle: "القائمة ما تحمّلت",
    visitDarb: "تعرّف على درب",
    heroVideo: (businessName) => `فيديو الغلاف لـ ${businessName}`,
    pauseHeroVideo: "وقّف الفيديو",
    playHeroVideo: "شغّل الفيديو",
    modifierOptional: "اختياري",
    modifierRequired: "مطلوب",
    noItems: "لسّه ما في أصناف منشورة بهالقسم.",
    noMenusDescription: "لسّه ما اننشرت القائمة. ارجع شوفها بعد شوي.",
    noMenusTitle: "القائمة عم تتحضّر",
    openNow: "مفتوح هلا",
    openingHours: "ساعات الدوام",
    opensAt: (time) => `بفتح اليوم الساعة ${time}`,
    opensOn: (day, time) => `بفتح يوم ${day} الساعة ${time}`,
    opensTomorrowAt: (time) => `بفتح بكرا الساعة ${time}`,
    poweredBy: "بدعم من درب",
    selections: (minimum, maximum) =>
      minimum > 0
        ? `اختار من ${formatCount(minimum, "ar")} لـ ${formatCount(maximum, "ar")}`
        : `اختار لحد ${formatCount(maximum, "ar")}`,
    skipToMenu: "روح للقائمة",
    soldOut: "خلص لليوم",
    unavailableDescription: "الصفحة مش منشورة أو مش متاحة هلا.",
    unavailableTitle: "المطعم مش متاح هلا",
    variants: "الأحجام والخيارات",
    viewDetails: "شوف التفاصيل",
    website: "الموقع",
    whatsapp: "واتساب",
  },
  he: {
    address: "כתובת",
    allLocations: "כל הסניפים",
    availableAt: "זמינות בסניף זה",
    categories: "קטגוריות",
    call: "התקשרות",
    chooseLocation: "בחירת סניף",
    close: "סגירה",
    closed: "סגור",
    closedNow: "סגור עכשיו",
    details: "פרטים",
    email: "אימייל",
    language: "שפה",
    location: "סניף",
    loading: "טוענים את התפריט",
    menu: "תפריט",
    map: "פתיחה במפה",
    landingDescription: "פותחים את הקישור של המסעדה ב-Darb כדי לראות את התפריט שפורסם.",
    landingTitle: "תפריט המסעדה, בחוויה ברורה ונעימה.",
    productName: "Darb למסעדות",
    retry: "לנסות שוב",
    loadErrorDescription: "לא הצלחנו לטעון את התפריט כרגע. אפשר לנסות שוב.",
    loadErrorTitle: "התפריט לא נטען",
    visitDarb: "להכיר את Darb",
    heroVideo: (businessName) => `סרטון השער של ${businessName}`,
    pauseHeroVideo: "השהיית הסרטון",
    playHeroVideo: "הפעלת הסרטון",
    modifierOptional: "לבחירה",
    modifierRequired: "חובה",
    noItems: "עדיין אין פריטים שפורסמו בחלק זה.",
    noMenusDescription: "עדיין לא פורסם תפריט לתצוגה. כדאי לחזור בהמשך.",
    noMenusTitle: "התפריט בהכנה",
    openNow: "פתוח עכשיו",
    openingHours: "שעות פתיחה",
    opensAt: (time) => `נפתח היום ב-${time}`,
    opensOn: (day, time) => `נפתח ביום ${day} ב-${time}`,
    opensTomorrowAt: (time) => `נפתח מחר ב-${time}`,
    poweredBy: "מופעל באמצעות Darb",
    selections: (minimum, maximum) =>
      minimum > 0
        ? `יש לבחור ${formatCount(minimum, "he")} עד ${formatCount(maximum, "he")}`
        : `עד ${formatCount(maximum, "he")} בחירות`,
    skipToMenu: "דילוג לתפריט",
    soldOut: "אזל",
    unavailableDescription: "העמוד לא פורסם או שהוא לא זמין כרגע.",
    unavailableTitle: "המסעדה אינה זמינה",
    variants: "גדלים ואפשרויות",
    viewDetails: "הצגת פרטים",
    website: "אתר",
    whatsapp: "WhatsApp",
  },
  en: {
    address: "Address",
    allLocations: "All locations",
    availableAt: "Availability at this location",
    categories: "Categories",
    call: "Call",
    chooseLocation: "Choose a location",
    close: "Close",
    closed: "Closed",
    closedNow: "Closed now",
    details: "Details",
    email: "Email",
    language: "Language",
    location: "Location",
    loading: "Loading restaurant menu",
    menu: "Menu",
    map: "Open map",
    landingDescription: "Use a restaurant’s Darb link to view its published menu.",
    landingTitle: "Restaurant experiences, thoughtfully served.",
    productName: "Darb Restaurant",
    retry: "Try again",
    loadErrorDescription: "The menu could not be loaded. Please try again.",
    loadErrorTitle: "We couldn’t load this menu",
    visitDarb: "Visit Darb",
    heroVideo: (businessName) => `${businessName} hero video`,
    pauseHeroVideo: "Pause video",
    playHeroVideo: "Play video",
    modifierOptional: "Optional",
    modifierRequired: "Required",
    noItems: "No items have been published in this section yet.",
    noMenusDescription: "No menu is published for viewing yet. Please check back later.",
    noMenusTitle: "The menu is being prepared",
    openNow: "Open now",
    openingHours: "Opening hours",
    opensAt: (time) => `Opens today at ${time}`,
    opensOn: (day, time) => `Opens ${day} at ${time}`,
    opensTomorrowAt: (time) => `Opens tomorrow at ${time}`,
    poweredBy: "Powered by Darb",
    selections: (minimum, maximum) =>
      minimum > 0
        ? `Choose ${formatCount(minimum, "en")} to ${formatCount(maximum, "en")}`
        : `Choose up to ${formatCount(maximum, "en")}`,
    skipToMenu: "Skip to menu",
    soldOut: "Sold out",
    unavailableDescription: "This page is not published or is no longer available.",
    unavailableTitle: "Restaurant unavailable",
    variants: "Sizes and options",
    viewDetails: "View details",
    website: "Website",
    whatsapp: "WhatsApp",
  },
};

export function getRestaurantCopy(locale: SupportedLocale): RestaurantCopy {
  return copy[locale];
}

function formatCount(value: number, locale: SupportedLocale): string {
  return new Intl.NumberFormat(locale).format(value);
}
