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
  menu: string;
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
    availableAt: "التوفر في هذا الفرع",
    categories: "التصنيفات",
    chooseLocation: "اختر الفرع",
    close: "إغلاق",
    details: "التفاصيل",
    language: "اللغة",
    location: "الفرع",
    menu: "القائمة",
    heroVideo: (businessName) => `فيديو الغلاف لـ ${businessName}`,
    pauseHeroVideo: "وقّف الفيديو",
    playHeroVideo: "شغّل الفيديو",
    modifierOptional: "اختياري",
    modifierRequired: "مطلوب",
    noItems: "لا توجد أصناف منشورة في هذا القسم بعد.",
    noMenusDescription: "لم تُنشر قائمة للعرض بعد. يرجى العودة لاحقًا.",
    noMenusTitle: "القائمة قيد التحضير",
    poweredBy: "مقدّم من درب",
    selections: (minimum, maximum) =>
      minimum > 0 ? `اختر من ${minimum} إلى ${maximum}` : `اختر حتى ${maximum}`,
    skipToMenu: "انتقل إلى القائمة",
    soldOut: "نفدت الكمية",
    unavailableDescription: "هذه الصفحة غير متاحة حاليًا.",
    unavailableTitle: "المطعم غير متاح",
    variants: "الأحجام والخيارات",
    viewDetails: "عرض التفاصيل",
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
    menu: "תפריט",
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
      minimum > 0 ? `יש לבחור ${minimum} עד ${maximum}` : `עד ${maximum} בחירות`,
    skipToMenu: "דילוג לתפריט",
    soldOut: "אזל",
    unavailableDescription: "העמוד הזה אינו זמין כרגע.",
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
    menu: "Menu",
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
      minimum > 0 ? `Choose ${minimum} to ${maximum}` : `Choose up to ${maximum}`,
    skipToMenu: "Skip to menu",
    soldOut: "Sold out",
    unavailableDescription: "This page is not available right now.",
    unavailableTitle: "Restaurant unavailable",
    variants: "Sizes and options",
    viewDetails: "View details",
  },
};

export function getRestaurantCopy(locale: SupportedLocale): RestaurantCopy {
  return copy[locale];
}
