import type { SupportedLocale } from "@darb/i18n";

export type DarbEngineKey = "restaurant" | "booking" | "pages" | "commerce";

export type RestaurantLayerKey =
  "menus" | "items" | "availability" | "hours" | "languages" | "presence";

export interface MainSiteCopy {
  skipLink: string;
  brandDescriptor: string;
  nav: {
    primaryNavigation: string;
    story: string;
    paths: string;
    restaurant: string;
    foundation: string;
    signIn: string;
    start: string;
    openMenu: string;
    closeMenu: string;
    language: string;
  };
  hero: {
    titleLead: string;
    titleAccent: string;
    description: string;
    primaryAction: string;
    secondaryAction: string;
  };
  story: {
    title: string;
    body: string;
    principle: string;
  };
  junction: {
    title: string;
    description: string;
    available: string;
    future: string;
    visit: string;
    note: string;
    destinations: readonly {
      key: DarbEngineKey;
      product: string;
      industry: string;
      description: string;
      current: boolean;
    }[];
  };
  restaurant: {
    title: string;
    description: string;
    layersLabel: string;
    layers: readonly { key: RestaurantLayerKey; title: string; description: string }[];
    boundary: string;
    visit: string;
  };
  foundation: {
    title: string;
    description: string;
    items: readonly { title: string; description: string }[];
  };
  languages: {
    title: string;
    description: string;
    directions: Readonly<Record<"rtl" | "ltr", string>>;
  };
  arrival: {
    title: string;
    description: string;
    imageAlt: string;
  };
  footer: {
    statement: string;
    paths: string;
    account: string;
    rights: string;
    creditLead: string;
    creditName: string;
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
    skipLink: "انتقل للمحتوى",
    brandDescriptor: "منصة بتفهم طبيعة شغلك",
    nav: {
      primaryNavigation: "القائمة الرئيسية",
      story: "شو هو درب",
      paths: "المسارات",
      restaurant: "المطاعم",
      foundation: "الأساس",
      signIn: "تسجيل الدخول",
      start: "ابدأ مع درب",
      openMenu: "فتح القائمة",
      closeMenu: "إغلاق القائمة",
      language: "اللغة",
    },
    hero: {
      titleLead: "مجالات كثيرة.",
      titleAccent: "درب واحد.",
      description:
        "درب ببني لشغلك عالمه الرقمي الخاص: من الهوية والفروع، لتجارب ومنتجات معمولة حسب مجالك، كلها فوق منصة واحدة بتكبر معك.",
      primaryAction: "ابدأ مع درب",
      secondaryAction: "تسجيل الدخول",
    },
    story: {
      title: "درب بناسب حاله لشغلك، مش العكس.",
      body: "كل مجال إله طريقته، وتفاصيله، واللي بميّزه. درب بياخد هالاختلاف وبيبني عليه تجربة كاملة لشغلك، مترابطة، مرنة، وجاهزة تكبر معك.",
      principle: "كل مجال إله منطقه. ودرب مبني على هالفكرة.",
    },
    junction: {
      title: "منصة وحدة، وكل مجال إله دربه.",
      description:
        "كل مجال مختلف بطبيعته، بتفاصيله، وبطريقة شغله. ودرب ببني لكل واحد تجربة معمولة إله، فوق نفس المنصة.",
      available: "جاهز",
      future: "قريباً",
      visit: "ادخل عالم المطاعم",
      note: "هالمسارات مجرد لمحة أولى، ودرب عنده أكثر بكثير ليقدّمه.",
      destinations: [
        {
          key: "restaurant",
          product: "المطاعم",
          industry: "شغلك بمجال المطاعم",
          description:
            "خلّي زبونك يوصل للمنيو، يفهمه ويتصفّحه بسهولة، وكل شي يطلع قدامه مرتب وبمستوى يليق بمحلك.",
          current: true,
        },
        {
          key: "booking",
          product: "الحجوزات",
          industry: "شغلك بيعتمد عالحجوزات",
          description:
            "خلّي الحجز يمشي بسلاسة من أول اختيار الموعد لحد تأكيده، وإنت ضلّ ماسك يومك وشغلك بدون فوضى.",
          current: false,
        },
        {
          key: "pages",
          product: "الصفحات",
          industry: "شغلك بحاجة لصفحة عالويب",
          description:
            "خلّي الناس تلاقي شغلك، تفهم شو بتقدّم، وتعرف ليش تختارك، بمحل واحد بيحكي عنك مثل ما لازم.",
          current: false,
        },
        {
          key: "commerce",
          product: "التجارة",
          industry: "شغلك جاهز يبيع أونلاين",
          description:
            "خلّي زبونك يلاقي اللي بده إياه، يختار براحة، ويكمّل طلبه من غير ما يضيع بين الخطوات.",
          current: false,
        },
      ],
    },
    restaurant: {
      title: "المطاعم: أول درب جاهز.",
      description:
        "كل اللي بحتاجه محلك عشان يقدّم حاله للزبون بشكل مرتب، واضح، وسهل يتصفّح من أي جهاز. وهاي الطبقات اللي بتبني منها تجربة محلك.",
      layersLabel: "طبقات مسار المطاعم",
      layers: [
        {
          key: "menus",
          title: "المنيو والأقسام",
          description:
            "أكثر من منيو لنفس المحل، أقسام مرتبة، وكل منيو بضل مسودة لحد ما تقرر تنشره.",
        },
        {
          key: "items",
          title: "الأصناف والإضافات",
          description:
            "لكل صنف سعره، لكل حجم سعره الخاص، ومجموعات إضافات بتستعملها بأكثر من صنف، إجبارية أو اختيارية.",
        },
        {
          key: "availability",
          title: "المتوفر بكل فرع",
          description: "خلص صنف بفرع معيّن؟ علّمه إنه خلص بهالفرع بس، والباقي بضل متل ما هو.",
        },
        {
          key: "hours",
          title: "الفروع وساعات الدوام",
          description:
            "ساعات دوام أسبوعية لكل فرع، حتى لو الدوام مقسوم أو بطوّل لبعد نص الليل، مع التلفون والإيميل والروابط.",
        },
        {
          key: "languages",
          title: "المنيو بثلاث لغات",
          description:
            "عربي، عبري وإنجليزي. الزبون بشوف المنيو بلغته، وإذا صنف مش مترجم بيطلعله بلغة محلك الأساسية.",
        },
        {
          key: "presence",
          title: "الهوية والعنوان",
          description: "اللوجو، صورة أو فيديو رئيسي، قالب عرض بناسب محلك، وعنوان ويب خاص فيك.",
        },
      ],
      boundary: "الطلب أونلاين مش جزء من مسار المطاعم لهلّأ.",
      visit: "شوف مسار المطاعم",
    },
    foundation: {
      title: "عندك أكثر من بزنس؟ درب بجمعهن كلهن تحت نفس السقف.",
      description:
        "كل بزنس بضل إله تفاصيله، وإنت بتضل ماسك الإدارة كاملة من مكان واحد، بدون حسابات متفرقة، ولا شغل موزّع بين أكثر من نظام.",
      items: [
        {
          title: "هوية شغلك",
          description: "كل بزنس بضل إله اسمه، حضوره وتفاصيله الخاصة، بدون ما يضيع بين الباقي.",
        },
        {
          title: "الفروع",
          description: "دير فروع كل بزنس ورتّب تفاصيلهن، بدون ما تتنقّل من محل لمحل.",
        },
        { title: "اللغات", description: "درب مجهز يكون متعدد اللغات من أول يوم." },
        {
          title: "المظهر",
          description: "كل بزنس إله شكله وشخصيته، وإنت بتتحكم فيهم من نفس المكان.",
        },
        {
          title: "النطاقات",
          description: "اربط كل بزنس بعنوانه الخاص عالويب، وخليه يضل جزء من نفس منظومة درب.",
        },
        {
          title: "الميديا",
          description: "رتّب صور وفيديوهات كل بزنس بمحلها وخلي كل شي سهل تلاقيه وتستعمله.",
        },
      ],
    },
    languages: {
      title: "ثلاث لغات، وكل وحدة معمولة صح.",
      description:
        "درب من البداية مجهز للعربي، العبري والإنجليزي. كل لغة باتجاهها وخطها وتفاصيلها، عشان تطلع طبيعية مش مترجمة.",
      directions: { rtl: "من اليمين لليسار", ltr: "من اليسار لليمين" },
    },
    arrival: {
      title: "الباب مفتوح. ابدأ دربك.",
      description:
        "افتح حساب جديد وابدأ بمسار المطاعم، أو ادخل على حسابك وكمّل إدارة شغلك والمنتجات المفعّلة إلك من نفس المحل.",
      imageAlt: "مدخل معماري مضوّي بفتح على أفق جديد",
    },
    footer: {
      statement: "مجالات كثيرة. درب واحد.",
      paths: "المسارات",
      account: "حسابك",
      rights: "درب. جميع الحقوق محفوظة.",
      creditLead: "تصميم وتطوير",
      creditName: "نور الدين موسى",
    },
    metadata: {
      title: "درب — منصة بتناسب طبيعة شغلك",
      description:
        "درب منصة للأعمال بتجمع تحتها منتجات متخصصة لمجالات مختلفة، من المطاعم والحجوزات للصفحات والتجارة، ومع الوقت أكثر.",
    },
    notFound: {
      title: "الصفحة مش موجودة",
      description: "ما لقينا الصفحة اللي بتدور عليها. ممكن الرابط تغيّر أو الصفحة انشالت.",
      action: "ارجع للرئيسية",
    },
    error: {
      title: "صار خطأ بتحميل الصفحة",
      description: "ما قدرنا نحمّل الصفحة هالمرة. جرّب كمان مرة، وإذا ضلّت المشكلة ارجع بعد شوي.",
      action: "جرّب مرة ثانية",
    },
  },
  he: {
    skipLink: "דילוג לתוכן",
    brandDescriptor: "פלטפורמה שמבינה את אופי העסק שלך",
    nav: {
      primaryNavigation: "ניווט ראשי",
      story: "מה זה Darb",
      paths: "המסלולים",
      restaurant: "מסעדות",
      foundation: "הבסיס",
      signIn: "התחברות",
      start: "מתחילים עם Darb",
      openMenu: "פתיחת התפריט",
      closeMenu: "סגירת התפריט",
      language: "שפה",
    },
    hero: {
      titleLead: "עולמות שונים.",
      titleAccent: "בסיס אחד.",
      description:
        "Darb היא פלטפורמה שמתאימה את עצמה לאופי של העסק שלך, עם מוצרים שנבנו סביב התחום שלך, עובדים יחד, ונותנים לך להתרחב בלי לפצל את העסק בין מערכות שונות.",
      primaryAction: "מתחילים עם Darb",
      secondaryAction: "התחברות",
    },
    story: {
      title: "Darb מתאימה את עצמה לעסק שלך, לא להפך.",
      body: "כל תחום עובד אחרת, עם הפרטים שלו ועם מה שמייחד אותו. Darb לוקחת את ההבדלים האלה ובונה סביבם חוויה שלמה לעסק שלך, גמישה ומוכנה לגדול איתך.",
      principle: "לכל תחום יש היגיון משלו, ו-Darb בנויה בדיוק על הרעיון הזה.",
    },
    junction: {
      title: "פלטפורמה אחת, ולכל תחום הדרך שלו.",
      description:
        "כל תחום שונה באופי שלו, בפרטים שלו ובדרך שבה הוא עובד. Darb בונה לכל אחד חוויה שמתאימה לו, על אותה פלטפורמה.",
      available: "זמין עכשיו",
      future: "בקרוב",
      visit: "כניסה לעולם המסעדות",
      note: "המסלולים האלה הם רק הצצה ראשונה, ול-Darb יש עוד הרבה יותר להציע.",
      destinations: [
        {
          key: "restaurant",
          product: "מסעדות",
          industry: "מסעדות ובתי קפה",
          description:
            "תן ללקוחות להגיע לתפריט, להבין אותו ולהתמצא בו בקלות, כשהכול מוצג בצורה מסודרת וברמה שמתאימה לעסק שלך.",
          current: true,
        },
        {
          key: "booking",
          product: "הזמנות תורים",
          industry: "סלונים והזמנת תורים",
          description:
            "הפוך את תהליך ההזמנה לפשוט וזורם, מבחירת המועד ועד לאישור, בזמן שאתה נשאר בשליטה על היום ועל העסק.",
          current: false,
        },
        {
          key: "pages",
          product: "דפי עסק",
          industry: "בעלי מקצוע ומרפאות",
          description:
            "תן לאנשים למצוא את העסק שלך, להבין מה אתה מציע ולדעת למה לבחור בך, במקום אחד שמציג אותך כמו שצריך.",
          current: false,
        },
        {
          key: "commerce",
          product: "חנות אונליין",
          industry: "מכירה אונליין",
          description:
            "תן ללקוחות למצוא את מה שהם מחפשים, לבחור בנוחות ולהשלים את ההזמנה בלי ללכת לאיבוד בדרך.",
          current: false,
        },
      ],
    },
    restaurant: {
      title: "מסעדות: הדרך הראשונה שכבר פתוחה.",
      description:
        "כל מה שהמסעדה צריכה כדי להציג את עצמה ללקוח בצורה מסודרת, ברורה ונוחה מכל מכשיר. אלה השכבות שמהן בונים את החוויה של העסק שלך.",
      layersLabel: "השכבות של מסלול המסעדות",
      layers: [
        {
          key: "menus",
          title: "תפריטים וקטגוריות",
          description:
            "כמה תפריטים לאותו עסק, קטגוריות מסודרות, וכל תפריט נשאר טיוטה עד שמחליטים לפרסם אותו.",
        },
        {
          key: "items",
          title: "מנות ותוספות",
          description:
            "לכל מנה מחיר משלה, לכל גודל מחיר משלו, וקבוצות תוספות שאפשר להשתמש בהן בכמה מנות, חובה או רשות.",
        },
        {
          key: "availability",
          title: "זמינות לפי סניף",
          description: "מנה נגמרה בסניף אחד? מסמנים אותה כאזלה רק שם, וכל השאר נשאר כמו שהוא.",
        },
        {
          key: "hours",
          title: "סניפים ושעות פתיחה",
          description:
            "שעות פתיחה שבועיות לכל סניף, גם במשמרות מפוצלות או אחרי חצות, עם טלפון, אימייל וקישורים.",
        },
        {
          key: "languages",
          title: "תפריט בשלוש שפות",
          description:
            "ערבית, עברית ואנגלית. הלקוח רואה את התפריט בשפה שלו, ומנה שלא תורגמה מוצגת בשפת ברירת המחדל של העסק.",
        },
        {
          key: "presence",
          title: "זהות וכתובת",
          description: "לוגו, תמונה או סרטון ראשי, תבנית תצוגה שמתאימה לעסק, וכתובת אינטרנט משלך.",
        },
      ],
      boundary: "הזמנה אונליין עדיין אינה חלק ממסלול המסעדות.",
      visit: "למסלול המסעדות",
    },
    foundation: {
      title: "יש לך יותר מעסק אחד? Darb מרכזת את כולם תחת קורת גג אחת.",
      description:
        "כל עסק שומר על הפרטים שלו, ואתה נשאר בשליטה על כל הניהול ממקום אחד, בלי חשבונות מפוזרים ובלי עבודה בין כמה מערכות.",
      items: [
        {
          title: "זהות העסק",
          description: "כל עסק שומר על השם, הנוכחות והפרטים שלו, בלי להתערבב עם האחרים.",
        },
        {
          title: "סניפים",
          description: "נהל את הסניפים של כל עסק ואת הפרטים שלהם, בלי לקפוץ ממקום למקום.",
        },
        {
          title: "שפות",
          description: "Darb בנויה לריבוי שפות מהיום הראשון.",
        },
        {
          title: "מראה",
          description: "לכל עסק המראה והאופי שלו, ואתה שולט בכולם מאותו מקום.",
        },
        {
          title: "דומיינים",
          description: "חבר כל עסק לדומיין משלו, כשהכול נשאר מחובר בתוך Darb.",
        },
        {
          title: "מדיה",
          description:
            "ארגן את התמונות והסרטונים של כל עסק במקום שלהם, כדי שיהיה קל למצוא ולהשתמש בכל דבר.",
        },
      ],
    },
    languages: {
      title: "שלוש שפות, וכל אחת בנויה כמו שצריך.",
      description:
        "Darb בנויה מההתחלה לערבית, עברית ואנגלית. כל שפה בכיוון, בכתב ובפרטים שלה, כדי שהכול ירגיש טבעי ולא מתורגם.",
      directions: { rtl: "מימין לשמאל", ltr: "משמאל לימין" },
    },
    arrival: {
      title: "הדלת פתוחה. מתחילים את הדרך.",
      description:
        "פותחים חשבון חדש ומתחילים עם מסלול המסעדות, או מתחברים וממשיכים לנהל את העסקים ואת המוצרים הפעילים שלך מאותו מקום.",
      imageAlt: "פתח אדריכלי מואר המוביל אל אופק חדש",
    },
    footer: {
      statement: "עולמות שונים. בסיס אחד.",
      paths: "המסלולים",
      account: "החשבון שלך",
      rights: "Darb. כל הזכויות שמורות.",
      creditLead: "עיצוב ופיתוח:",
      creditName: "Nour Alden Mousa",
    },
    metadata: {
      title: "Darb — פלטפורמה אחת לעולמות עסקיים שונים",
      description:
        "Darb היא פלטפורמה מודולרית לעסקים, עם מוצרים ייעודיים שנבנים סביב הצרכים של כל תחום ומתחברים יחד למערכת אחת שגדלה עם העסק.",
    },
    notFound: {
      title: "העמוד שחיפשת לא נמצא",
      description:
        "יכול להיות שהקישור השתנה או שהעמוד כבר לא קיים. אפשר לחזור לעמוד הבית ולהמשיך משם.",
      action: "חזרה לעמוד הבית",
    },
    error: {
      title: "לא הצלחנו לטעון את העמוד",
      description: "לא הצלחנו להשלים את הטעינה. אפשר לנסות שוב בעוד רגע.",
      action: "נסה שוב",
    },
  },
  en: {
    skipLink: "Skip to content",
    brandDescriptor: "A platform that understands how your business works",
    nav: {
      primaryNavigation: "Primary navigation",
      story: "What is Darb",
      paths: "Paths",
      restaurant: "Restaurants",
      foundation: "Foundation",
      signIn: "Sign in",
      start: "Get started",
      openMenu: "Open menu",
      closeMenu: "Close menu",
      language: "Language",
    },
    hero: {
      titleLead: "Many worlds.",
      titleAccent: "One platform.",
      description:
        "Darb adapts to how your business works, with products built around your industry, designed to work together and grow without splitting your business across separate systems.",
      primaryAction: "Get started",
      secondaryAction: "Sign in",
    },
    story: {
      title: "Darb is built for your business, not the other way around.",
      body: "Every industry has its own way of working, its own details, and its own priorities. Darb takes those differences and builds around them, creating a flexible experience designed to grow with your business.",
      principle: "Every industry has its own logic. Darb is built around that idea.",
    },
    junction: {
      title: "One platform. A path for every kind of business.",
      description:
        "Every industry works differently. Darb gives each one an experience shaped around how it actually operates, while keeping everything on the same platform.",
      available: "Available",
      future: "Coming soon",
      visit: "Enter Restaurants",
      note: "These paths are only a first glimpse. Darb has much more ahead.",
      destinations: [
        {
          key: "restaurant",
          product: "Restaurants",
          industry: "Restaurants & cafés",
          description:
            "Let customers reach your menu, understand it and explore it effortlessly, with everything presented clearly and at a standard that reflects your business.",
          current: true,
        },
        {
          key: "booking",
          product: "Bookings",
          industry: "Appointments & bookings",
          description:
            "Make booking effortless from choosing a time to confirming the appointment, while keeping your schedule and day-to-day operations under control.",
          current: false,
        },
        {
          key: "pages",
          product: "Pages",
          industry: "Professionals & clinics",
          description:
            "Give people one clear place to discover your business, understand what you offer and see why you are the right choice.",
          current: false,
        },
        {
          key: "commerce",
          product: "Commerce",
          industry: "Online commerce",
          description:
            "Help customers find what they need, choose with confidence and complete their order without getting lost along the way.",
          current: false,
        },
      ],
    },
    restaurant: {
      title: "Restaurants: the first path, open today.",
      description:
        "Everything a food business needs to present itself clearly and professionally on any device. These are the layers you build your restaurant's experience from.",
      layersLabel: "Layers of the Restaurant path",
      layers: [
        {
          key: "menus",
          title: "Menus and categories",
          description:
            "Several menus for one business, ordered categories, and every menu stays a draft until you choose to publish it.",
        },
        {
          key: "items",
          title: "Items and modifiers",
          description:
            "Every item has its price, every variant its own price, and modifier groups you can reuse across items as required or optional.",
        },
        {
          key: "availability",
          title: "Availability per location",
          description:
            "Sold out at one location? Mark it sold out there only, and everything else stays as it is.",
        },
        {
          key: "hours",
          title: "Locations and hours",
          description:
            "Weekly opening hours for each location, including split shifts and past midnight, with phone, email and links.",
        },
        {
          key: "languages",
          title: "A menu in three languages",
          description:
            "Arabic, Hebrew and English. Customers read the menu in their language, and anything untranslated falls back to your default.",
        },
        {
          key: "presence",
          title: "Identity and address",
          description:
            "Your logo, a hero image or video, a presentation template that suits you, and a web address of your own.",
        },
      ],
      boundary: "Online ordering is not part of the Restaurant path yet.",
      visit: "Explore Restaurants",
    },
    foundation: {
      title: "Running more than one business? Darb brings them under one roof.",
      description:
        "Each business keeps its own details, while you stay in control of the bigger picture from one place, without scattered accounts or work spread across multiple systems.",
      items: [
        {
          title: "Business identity",
          description:
            "Each business keeps its own name, presence and details without getting mixed in with the rest.",
        },
        {
          title: "Locations",
          description:
            "Manage every business and its locations without constantly jumping between different places.",
        },
        {
          title: "Languages",
          description: "Darb is built for multilingual businesses from day one.",
        },
        {
          title: "Appearance",
          description:
            "Every business keeps its own look and personality, while you manage them all from the same place.",
        },
        {
          title: "Domains",
          description:
            "Connect each business to its own domain while keeping everything connected inside Darb.",
        },
        {
          title: "Media",
          description:
            "Keep each business's images and videos organized, easy to find and ready to use whenever you need them.",
        },
      ],
    },
    languages: {
      title: "Three languages, each built the way it should be.",
      description:
        "Darb is built from the start for Arabic, Hebrew and English, each with its own direction, script and language behavior, so every version feels native instead of translated.",
      directions: { rtl: "Right to left", ltr: "Left to right" },
    },
    arrival: {
      title: "The door is open. Start your path.",
      description:
        "Create an account and begin with Restaurants, or sign in and continue managing your businesses and active Darb products from one place.",
      imageAlt: "An illuminated architectural opening leading toward a new horizon",
    },
    footer: {
      statement: "Many worlds. One platform.",
      paths: "Paths",
      account: "Your account",
      rights: "Darb. All rights reserved.",
      creditLead: "Designed and built by",
      creditName: "Nour Alden Mousa",
    },
    metadata: {
      title: "Darb — One platform for different business worlds",
      description:
        "Darb is a modular business platform with purpose-built products shaped around the needs of different industries, all connected within one system that grows with the business.",
    },
    notFound: {
      title: "The page you're looking for isn't here",
      description:
        "The link may have changed or the page may no longer exist. Head back home and continue from there.",
      action: "Back to home",
    },
    error: {
      title: "We couldn't load this page",
      description: "Something prevented the page from loading. Try again in a moment.",
      action: "Try again",
    },
  },
};
