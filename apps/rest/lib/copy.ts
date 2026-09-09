import type { SupportedLocale } from "@darb/i18n";

interface RestaurantCopy {
  allLocations: string;
  availableAt: string;
  categories: string;
  chooseLocation: string;
  close: string;
  details: string;
  language: string;
  location: string;
  loading: string;
  menu: string;
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
  poweredBy: string;
  selections: (minimum: number, maximum: number) => string;
  skipToMenu: string;
  soldOut: string;
  unavailableDescription: string;
  unavailableTitle: string;
  variants: string;
  viewDetails: string;
}

const copy: Record<SupportedLocale, RestaurantCopy> = {
  ar: {
    allLocations: "كل الفروع",
    availableAt: "المتوفر بهالفرع",
    categories: "التصنيفات",
    chooseLocation: "اختار الفرع",
    close: "سكّر",
    details: "التفاصيل",
    language: "اللغة",
    location: "الفرع",
    loading: "عم نحمّل القائمة",
    menu: "القائمة",
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
  },
  he: {
    allLocations: "כל הסניפים",
    availableAt: "זמינות בסניף זה",
    categories: "קטגוריות",
    chooseLocation: "בחירת סניף",
    close: "סגירה",
    details: "פרטים",
    language: "שפה",
    location: "סניף",
    loading: "טוענים את התפריט",
    menu: "תפריט",
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
  },
  en: {
    allLocations: "All locations",
    availableAt: "Availability at this location",
    categories: "Categories",
    chooseLocation: "Choose a location",
    close: "Close",
    details: "Details",
    language: "Language",
    location: "Location",
    loading: "Loading restaurant menu",
    menu: "Menu",
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
  },
};

export function getRestaurantCopy(locale: SupportedLocale): RestaurantCopy {
  return copy[locale];
}

function formatCount(value: number, locale: SupportedLocale): string {
  return new Intl.NumberFormat(locale).format(value);
}
