import type { SupportedLocale } from "@darb/i18n";

export interface MainSiteCopy {
  skipLink: string;
  brandDescriptor: string;
  nav: {
    primaryNavigation: string;
    story: string;
    paths: string;
    products: string;
    foundation: string;
    signIn: string;
    openMenu: string;
    closeMenu: string;
    language: string;
  };
  hero: {
    eyebrow: string;
    titleLead: string;
    titleAccent: string;
    description: string;
    primaryAction: string;
    secondaryAction: string;
    imageAlt: string;
    scrollLabel: string;
  };
  story: {
    eyebrow: string;
    title: string;
    body: string;
    principle: string;
  };
  paths: {
    eyebrow: string;
    title: string;
    description: string;
    items: readonly {
      title: string;
      status: string;
      description: string;
    }[];
  };
  products: {
    eyebrow: string;
    title: string;
    description: string;
    available: string;
    future: string;
    items: readonly {
      key: "restaurant" | "booking" | "pages" | "commerce";
      title: string;
      description: string;
      current: boolean;
    }[];
    honestNote: string;
  };
  foundation: {
    eyebrow: string;
    title: string;
    description: string;
    items: readonly { title: string; description: string }[];
  };
  languages: {
    eyebrow: string;
    title: string;
    description: string;
    scripts: readonly { code: string; title: string; detail: string; lang: SupportedLocale }[];
  };
  finalCta: {
    eyebrow: string;
    title: string;
    description: string;
    action: string;
  };
  footer: {
    statement: string;
    admin: string;
    rights: string;
  };
  metadata: {
    title: string;
    description: string;
  };
  notFound: {
    title: string;
    description: string;
    action: string;
  };
  error: {
    title: string;
    description: string;
    action: string;
  };
}

export const mainSiteCopy: Readonly<Record<SupportedLocale, MainSiteCopy>> = {
  ar: {
    skipLink: "روح للمحتوى",
    brandDescriptor: "منصة بتبني تجربة شغلك",
    nav: {
      primaryNavigation: "القائمة الرئيسية",
      story: "شو هو درب",
      paths: "مسارات الشغل",
      products: "منتجات درب",
      foundation: "الأساس",
      signIn: "فوت عالإدارة",
      openMenu: "افتح القائمة",
      closeMenu: "سكّر القائمة",
      language: "اللغة",
    },
    hero: {
      eyebrow: "بداية رقمية بتفتح أكتر من طريق",
      titleLead: "شغلك.",
      titleAccent: "بطريقك.",
      description:
        "درب بعطي شغلك أساس رقمي مرن ومتكامل — الأدوات اللي بتحتاجها اليوم، ومساحة تكبر وتتطوّر فيها بكرا.",
      primaryAction: "شوف كيف بشتغل درب",
      secondaryAction: "فوت عالإدارة",
      imageAlt: "مدخل معماري مضوّي بفتح على أفق جديد",
      scrollLabel: "كمّل وشوف أكتر",
    },
    story: {
      eyebrow: "درب واحد، وإمكانيات كتيرة",
      title: "منصة بتمشي مع هوية شغلك، مش قالب جاهز.",
      body: "درب بيلمّ أساس شغلك الرقمي بمكان واحد، وبخلّيك تفعّل اللي فعلًا بناسبك. بتبلّش بهوية واضحة، فروع، لغات، مظهر ونطاق خاص — وبتتوسّع بس لما تحتاج.",
      principle: "أساس واحد. شغل مختلف. وكل واحد إله طريقه.",
    },
    paths: {
      eyebrow: "كل شغل إله طريقه",
      title: "نفس الأساس، وتجربة بتمشي مع طبيعة شغلك.",
      description:
        "درب ما بفرض عليك وجهة وحدة. بوصل الأساس المشترك بمنتجات متخصّصة، وكل منتج معمول لنوع شغل مختلف.",
      items: [
        {
          title: "المطاعم والمقاهي",
          status: "متاح هلا",
          description:
            "قوائم أكل بأكتر من لغة، فروع، نطاق وهوية بصرية — كلها بتجربة مطاعم متكاملة.",
        },
        {
          title: "الصالونات ومجال الجمال",
          status: "لسّه بالطريق",
          description: "مسار جاي للخدمات، الطواقم والمواعيد، على نفس أساس درب.",
        },
        {
          title: "أصحاب المهن والعيادات",
          status: "لسّه بالطريق",
          description: "مسار جاي لترتيب الخدمات، المواعيد وشغل الطاقم.",
        },
        {
          title: "المتاجر والتجزئة",
          status: "لسّه بالطريق",
          description: "مسار جاي للكتالوج والبيع، تحت نفس هوية الشغل.",
        },
      ],
    },
    products: {
      eyebrow: "منتجات درب",
      title: "فعّل اللي بتحتاجه، بالوقت الصح.",
      description:
        "كل منتج في درب إله شغله الخاص، وبنفس الوقت بستخدم نفس الهوية، الفروع، اللغات والمظهر.",
      available: "متاح هلا",
      future: "لسّه بالطريق",
      items: [
        {
          key: "restaurant",
          title: "درب للمطاعم",
          description: "إدارة وتجربة عامة لقوائم أكل بأكتر من لغة، مع الفروع، المظهر والنطاقات.",
          current: true,
        },
        {
          key: "booking",
          title: "الحجوزات",
          description: "منتج جاي للخدمات، المواعيد والموارد المتاحة.",
          current: false,
        },
        {
          key: "pages",
          title: "الصفحات",
          description: "منتج جاي عشان توسّع حضور محتوى شغلك على درب.",
          current: false,
        },
        {
          key: "commerce",
          title: "التجارة",
          description: "منتج جاي للكتالوج وتجارب الشراء.",
          current: false,
        },
      ],
      honestNote: "الحجوزات، الصفحات والتجارة لسه منتجات مستقبلية، ومش متاحة هلا.",
    },
    foundation: {
      eyebrow: "الأساس المشترك",
      title: "تفاصيل شغلك بتضلّ مرتّبة، حتى لما تكبر.",
      description:
        "بدل ما تكرّر نفس المعلومات بين أدوات منفصلة، درب بخلّي أساس شغلك كلّه واضح ومترابط بمكان واحد.",
      items: [
        { title: "هوية الشغل", description: "اسم وحضور موحّد لكل قدرات درب." },
        { title: "الفروع", description: "كل فروعك واضحة، وبتخدم تجارب شغل مختلفة." },
        { title: "اللغات", description: "العربي، العبري والإنجليزي من أول يوم." },
        { title: "المظهر", description: "شكل بصري مضبوط بعكس شخصية شغلك." },
        { title: "النطاقات", description: "عنوان موثوق عالإنترنت باسم شغلك." },
        { title: "الوسائط", description: "صور وفيديوهات بتديرها من مكان واحد." },
      ],
    },
    languages: {
      eyebrow: "محلي من الأساس",
      title: "ثلاث لغات. اتجاهين. وتجربة وحدة محسوبة.",
      description:
        "درب معمول لسوقنا مثل ما هو: العربي والعبري من اليمين لليسار، والإنجليزي باتجاهه الطبيعي. ولا لغة فيهم بتجي كنسخة ثانوية.",
      scripts: [
        { code: "AR", title: "العربي", detail: "من اليمين لليسار", lang: "ar" },
        { code: "HE", title: "עברית", detail: "מימין לשמאל", lang: "he" },
        { code: "EN", title: "English", detail: "Left to right", lang: "en" },
      ],
    },
    finalCta: {
      eyebrow: "الباب مفتوح",
      title: "بلّش من أساس بكبر مع شغلك.",
      description: "إذا عندك حساب على درب، فوت على لوحة الإدارة ودير شغلك والمنتجات المتاحة إلك.",
      action: "فوت على لوحة الإدارة",
    },
    footer: {
      statement: "أساس رقمي واحد، وكل شغل إله طريقه.",
      admin: "إدارة درب",
      rights: "درب. كل الحقوق محفوظة.",
    },
    metadata: {
      title: "درب — الأساس الرقمي اللي بمشي مع شغلك",
      description:
        "درب منصة متعددة اللغات بتعطي شغلك أساس رقمي مرن ومنتجات متخصّصة، وأولها تجربة المطاعم.",
    },
    notFound: {
      title: "هاي الصفحة مش موجودة",
      description: "ما قدرنا نلاقي الصفحة اللي بتدور عليها على موقع درب.",
      action: "ارجع للرئيسية",
    },
    error: {
      title: "ما قدرنا نحمّل الصفحة",
      description: "صار خلل مش متوقّع. جرّب مرة ثانية، وإذا ضلّ موجود ارجع بعد شوي.",
      action: "جرّب كمان مرة",
    },
  },
  he: {
    skipLink: "דילוג לתוכן",
    brandDescriptor: "פלטפורמה לחוויות עסקיות",
    nav: {
      primaryNavigation: "ניווט ראשי",
      story: "מהו Darb",
      paths: "מסלולים לעסקים",
      products: "מוצרים",
      foundation: "הפלטפורמה",
      signIn: "כניסה לניהול",
      openMenu: "פתיחת התפריט",
      closeMenu: "סגירת התפריט",
      language: "שפה",
    },
    hero: {
      eyebrow: "בסיס דיגיטלי שפותח יותר מדרך אחת",
      titleLead: "העסק שלך.",
      titleAccent: "בדרך שלך.",
      description:
        "Darb היא פלטפורמה גמישה שבונה לעסק נוכחות דיגיטלית שלמה — עם הכלים הנכונים להיום והמרחב הדרוש למחר.",
      primaryAction: "לגלות את Darb",
      secondaryAction: "כניסה לניהול",
      imageAlt: "פתח אדריכלי מואר המוביל אל אופק חדש",
      scrollLabel: "המשך לגילוי Darb",
    },
    story: {
      eyebrow: "Darb אחד, אפשרויות רבות",
      title: "פלטפורמה שמתחילה בזהות של העסק — לא בתבנית מוכנה.",
      body: "Darb מאחד את הבסיס הדיגיטלי של העסק במקום אחד, ואז מאפשר להפעיל את היכולות שמתאימות לו. מתחילים בזהות, סניפים, שפות, מראה ודומיין — ומתרחבים רק כשצריך.",
      principle: "בסיס אחד. עסקים שונים. מסלולים רבים.",
    },
    paths: {
      eyebrow: "לכל עסק הדרך שלו",
      title: "אותו בסיס, בחוויה שמתאימה לאופי העסק.",
      description:
        "Darb אינו כופה יעד אחד. הוא מחבר בסיס משותף למוצרים ייעודיים שנבנים בקפידה עבור סוגים שונים של עסקים.",
      items: [
        {
          title: "מסעדות ובתי קפה",
          status: "זמין עכשיו",
          description: "תפריטים רב־לשוניים, סניפים, דומיינים וזהות חזותית בחוויית מסעדה שלמה.",
        },
        {
          title: "סלונים ויופי",
          status: "מסלול עתידי",
          description: "כיוון עתידי לשירותים, צוותים ותורים, על אותו הבסיס של Darb.",
        },
        {
          title: "בעלי מקצוע ומרפאות",
          status: "מסלול עתידי",
          description: "כיוון עתידי לניהול שירותים, תורים ונוכחות של צוותים מקצועיים.",
        },
        {
          title: "קמעונאות",
          status: "מסלול עתידי",
          description: "כיוון עתידי לקטלוג ולמסחר תחת זהות עסקית אחת.",
        },
      ],
    },
    products: {
      eyebrow: "המוצרים של Darb",
      title: "יכולות שנכנסות לפעולה כשהזמן מתאים.",
      description:
        "כל מוצר ב-Darb הוא תחום עצמאי, אך כולם משתמשים באותה זהות עסקית, באותם סניפים, שפות ומראה.",
      available: "מוצר זמין",
      future: "יגיע בהמשך",
      items: [
        {
          key: "restaurant",
          title: "Darb למסעדות",
          description: "ניהול וחוויה ציבורית לתפריטים רב־לשוניים, סניפים, מראה ודומיינים.",
          current: true,
        },
        {
          key: "booking",
          title: "הזמנות תורים",
          description: "מסלול עתידי לשירותים, תורים ומשאבים זמינים.",
          current: false,
        },
        {
          key: "pages",
          title: "עמודים",
          description: "מסלול עתידי לנוכחות תוכן רחבה יותר בתוך Darb.",
          current: false,
        },
        {
          key: "commerce",
          title: "מסחר",
          description: "מסלול עתידי לקטלוג ולחוויות רכישה.",
          current: false,
        },
      ],
      honestNote: "הזמנות תורים, עמודים ומסחר הם כיוונים עתידיים ואינם מוצרים זמינים עדיין.",
    },
    foundation: {
      eyebrow: "הבסיס המשותף",
      title: "פרטי העסק נשארים עקביים גם כשהדרך מתרחבת.",
      description:
        "במקום לשכפל מידע בין כלים נפרדים, Darb שומר את מרכיבי הליבה של העסק במבנה אחד ברור.",
      items: [
        { title: "זהות העסק", description: "שם ונוכחות בסיסית אחידה לכל היכולות." },
        { title: "סניפים", description: "מיקומים ברורים שמשרתים חוויות עסקיות שונות." },
        { title: "שפות", description: "ערבית, עברית ואנגלית מן ההתחלה." },
        { title: "מראה", description: "מערכת חזותית מבוקרת שמשקפת את אופי העסק." },
        { title: "דומיינים", description: "יעד ציבורי אמין בשם העסק." },
        { title: "מדיה", description: "תמונות וסרטונים מנוהלים ממקור אחד." },
      ],
    },
    languages: {
      eyebrow: "מקומי מהיסוד",
      title: "שלוש שפות. שני כיוונים. חוויה אחת מדויקת.",
      description:
        "Darb תוכנן לשוק המקומי כפי שהוא: ערבית ועברית מימין לשמאל, ואנגלית בכיוונה הטבעי — בלי להפוך אף שפה לגרסה משנית.",
      scripts: [
        { code: "AR", title: "العربية", detail: "من اليمين إلى اليسار", lang: "ar" },
        { code: "HE", title: "עברית", detail: "מימין לשמאל", lang: "he" },
        { code: "EN", title: "English", detail: "Left to right", lang: "en" },
      ],
    },
    finalCta: {
      eyebrow: "הדלת פתוחה",
      title: "מתחילים מבסיס שנועד להתקדם עם העסק.",
      description: "אם כבר יש לך חשבון Darb, אפשר לעבור למרחב הניהול ולנהל את העסק.",
      action: "כניסה לניהול Darb",
    },
    footer: {
      statement: "בסיס דיגיטלי אחד למסלולים עסקיים רבים.",
      admin: "ניהול Darb",
      rights: "Darb. כל הזכויות שמורות.",
    },
    metadata: {
      title: "Darb — בסיס דיגיטלי בדרך של העסק שלך",
      description:
        "Darb היא פלטפורמה רב־לשונית לחוויות עסקיות, עם בסיס דיגיטלי גמיש ומוצרים ייעודיים שמתחילים במסעדות.",
    },
    notFound: {
      title: "העמוד הזה לא נמצא",
      description: "לא הצלחנו למצוא את העמוד המבוקש באתר Darb.",
      action: "חזרה לעמוד הבית",
    },
    error: {
      title: "לא הצלחנו לטעון את העמוד",
      description: "אירעה תקלה בלתי צפויה. אפשר לנסות שוב בלי לחשוף פרטים פנימיים.",
      action: "לנסות שוב",
    },
  },
  en: {
    skipLink: "Skip to content",
    brandDescriptor: "Business Experience Platform",
    nav: {
      primaryNavigation: "Primary navigation",
      story: "What is Darb",
      paths: "Business paths",
      products: "Products",
      foundation: "Platform",
      signIn: "Admin sign in",
      openMenu: "Open menu",
      closeMenu: "Close menu",
      language: "Language",
    },
    hero: {
      eyebrow: "One digital foundation. More than one way forward.",
      titleLead: "Your business.",
      titleAccent: "Your way.",
      description:
        "Darb is a flexible platform for complete digital business experiences—giving you what you need today and room for what comes next.",
      primaryAction: "Discover Darb",
      secondaryAction: "Admin sign in",
      imageAlt: "An illuminated architectural opening leading toward a new horizon",
      scrollLabel: "Continue to discover Darb",
    },
    story: {
      eyebrow: "One Darb, many possibilities",
      title: "A platform shaped around your business—not a ready-made template.",
      body: "Darb brings your business's digital foundation together, then lets you activate the capabilities that fit. Start with identity, locations, languages, appearance and domains; expand only when the time is right.",
      principle: "One foundation. Different businesses. Many paths.",
    },
    paths: {
      eyebrow: "Every business has its path",
      title: "The same foundation, shaped for different kinds of work.",
      description:
        "Darb does not force every business toward the same destination. It connects a shared foundation to purpose-built products for distinct business experiences.",
      items: [
        {
          title: "Restaurants & cafés",
          status: "Available now",
          description:
            "Multilingual menus, locations, domains and visual identity in one Restaurant experience.",
        },
        {
          title: "Salons & beauty",
          status: "Future path",
          description:
            "A future direction for services, teams and appointments on the same Darb foundation.",
        },
        {
          title: "Professionals & clinics",
          status: "Future path",
          description: "A future direction for services, appointments and professional teams.",
        },
        {
          title: "Retail",
          status: "Future path",
          description: "A future direction for catalog and commerce under one business identity.",
        },
      ],
    },
    products: {
      eyebrow: "Darb products",
      title: "Capabilities that activate when the time is right.",
      description:
        "Each Darb product is a focused operating domain, sharing the same business identity, locations, languages and appearance.",
      available: "Available product",
      future: "Coming later",
      items: [
        {
          key: "restaurant",
          title: "Darb Restaurant",
          description:
            "Management and public experiences for multilingual menus, locations, appearance and domains.",
          current: true,
        },
        {
          key: "booking",
          title: "Booking",
          description: "A future path for services, appointments and available resources.",
          current: false,
        },
        {
          key: "pages",
          title: "Pages",
          description: "A future path for a broader content presence within Darb.",
          current: false,
        },
        {
          key: "commerce",
          title: "Commerce",
          description: "A future path for catalog and purchase experiences.",
          current: false,
        },
      ],
      honestNote:
        "Booking, Pages and Commerce are future directions and are not available products yet.",
    },
    foundation: {
      eyebrow: "The shared foundation",
      title: "Your business stays coherent as its path expands.",
      description:
        "Instead of duplicating information across disconnected tools, Darb keeps the essentials of your business within one clear foundation.",
      items: [
        {
          title: "Business identity",
          description: "One name and core presence across Darb capabilities.",
        },
        {
          title: "Locations",
          description: "Canonical locations that serve different business experiences.",
        },
        { title: "Languages", description: "Arabic, Hebrew and English from the beginning." },
        {
          title: "Appearance",
          description: "A controlled visual system that reflects the business.",
        },
        { title: "Domains", description: "A trusted public destination in the business's name." },
        { title: "Media", description: "Images and video managed from one source." },
      ],
    },
    languages: {
      eyebrow: "Local from the foundation",
      title: "Three languages. Two directions. One considered experience.",
      description:
        "Darb is designed for the local market as it is: Arabic and Hebrew flow right to left, English in its natural direction, and no language is treated as a secondary version.",
      scripts: [
        { code: "AR", title: "العربية", detail: "من اليمين إلى اليسار", lang: "ar" },
        { code: "HE", title: "עברית", detail: "מימין לשמאל", lang: "he" },
        { code: "EN", title: "English", detail: "Left to right", lang: "en" },
      ],
    },
    finalCta: {
      eyebrow: "The opening is here",
      title: "Start from a foundation designed to move with your business.",
      description:
        "If you already have a Darb account, enter the Admin workspace to manage your business and its available products.",
      action: "Enter Darb Admin",
    },
    footer: {
      statement: "One digital foundation for many business paths.",
      admin: "Darb Admin",
      rights: "Darb. All rights reserved.",
    },
    metadata: {
      title: "Darb — A digital foundation, your way",
      description:
        "Darb is a multilingual Business Experience Platform with a flexible digital foundation and focused products beginning with Restaurant.",
    },
    notFound: {
      title: "This page was not found",
      description: "The requested page is not available on the Darb website.",
      action: "Return home",
    },
    error: {
      title: "This page could not be loaded",
      description:
        "Something unexpected happened. You can try again without exposing internal details.",
      action: "Try again",
    },
  },
};
