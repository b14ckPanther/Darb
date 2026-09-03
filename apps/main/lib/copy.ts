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
    skipLink: "انتقل للمحتوى",
    brandDescriptor: "منصة بتفهم طبيعة شغلك",
    nav: {
      primaryNavigation: "القائمة الرئيسية",
      story: "شو هو درب",
      paths: "المجالات",
      products: "منتجات درب",
      foundation: "أساس درب",
      signIn: "تسجيل الدخول",
      openMenu: "فتح القائمة",
      closeMenu: "إغلاق القائمة",
      language: "اللغة",
    },
    hero: {
      eyebrow: "شو ما كان شغلك، أكيد إله درب.",
      titleLead: "مجالات كثيرة.",
      titleAccent: "درب واحد.",
      description:
        "درب ببني لشغلك عالمه الرقمي الخاص — من الهوية والفروع، لتجارب ومنتجات معمولة حسب مجالك، كلها فوق منصة واحدة بتكبر معك.",
      primaryAction: "ابدأ مع درب",
      secondaryAction: "تسجيل دخول",
      imageAlt: "مدخل معماري مضوّي بفتح على أفق جديد",
      scrollLabel: "اكتشف أكتر",
    },
    story: {
      eyebrow: "كل شغل إله أسلوبه",
      title: "درب بناسب حاله لشغلك، مش العكس.",
      body: "كل مجال إله طريقته، وتفاصيله، واللي بميّزه. درب بياخد هالاختلاف وبيبني عليه تجربة كاملة لشغلك — مترابطة، مرنة، وجاهزة تكبر معك.",
      principle: "كل مجال إله منطقه. ودرب مبني على هالفكرة.",
    },
    paths: {
      eyebrow: "من مجال لمجال",
      title: "درب بغيّر التجربة، مش الأساس.",
      description:
        "كل مجال مختلف بطبيعته، بتفاصيله، وبطريقة شغله. ودرب ببني لكل واحد تجربة معمولة إله، فوق نفس المنصة.",
      items: [
        {
          title: "شغلك بمجال المطاعم",
          status: "جاهز",
          description:
            "خلّي زبونك يوصل للمنيو، يفهمه ويتصفّحه بسهولة — وكل شي يطلع قدامه مرتب وبمستوى يليق بمحلك.",
        },
        {
          title: "شغلك بيعتمد عالحجوزات",
          status: "قريباً",
          description: "خلّي الحجز يمشي بسلاسة من أول اختيار الموعد لحد تأكيده، وإنت ضلّ ماسك يومك وشغلك بدون فوضى.",
        },
        {
          title: "شغلك بحاجة لصفحة عالويب",
          status: "قريباً",
          description: "خلّي الناس تلاقي شغلك، تفهم شو بتقدّم، وتعرف ليش تختارك — بمحل واحد بيحكي عنك مثل ما لازم.",
        },
        {
          title: "شغلك جاهز يبيع أونلاين",
          status: "قريباً",
          description: "خلّي زبونك يلاقي اللي بده إياه، يختار براحة، ويكمّل طلبه من غير ما يضيع بين الخطوات.",
        },
      ],
    },
    products: {
      eyebrow: "منتجات درب",
      title: "ابدأ باللي بناسب شغلك، وزيد وقت ما تحتاج.",
      description:
        "منتجات درب معمولة تشتغل مع بعض، مش كل واحد لحاله. بتختار اللي بخدم شغلك اليوم، وبتضيف عليه أكتر كل ما تكبر احتياجاتك.",
      available: "جاهز",
      future: "قريباً",
      items: [
        {
          key: "restaurant",
          title: "المطاعم",
          description: "كل اللي بحتاجه محلك عشان يقدّم حاله للزبون بشكل مرتب، واضح، وسهل يتصفّح من أي جهاز.",
          current: true,
        },
        {
          key: "booking",
          title: "الحجوزات",
          description: "نظّم خدماتك، مواعيدك ووقتك، وخلي زباينك يحجزوا بالطريقة اللي بتريحهم وبتريحك.",
          current: false,
        },
        {
          key: "pages",
          title: "الصفحات",
          description: "ابني لشغلك موقع عالويب يعرّف عنك، يعرض اللي بتقدّمه، ويعطي الناس كل اللي لازم يعرفوه عنك.",
          current: false,
        },
        {
          key: "commerce",
          title: "التجارة",
          description: "حوّل منتجاتك لماركت أونلاين مرتب، وخلي زباينك يتصفّحوا، يختاروا ويشتروا بسهولة.",
          current: false,
        },
      ],
      honestNote: "هالمنتجات مجرد لمحة أولى — ودرب عنده أكثر بكثير ليقدّمه.",
    },
    foundation: {
      eyebrow: "عندك اكثر من بزنس؟",
      title: "درب بجمعهن كلهن وبساعدك تديرهن تحت نفس السقف.",
      description:
        "كل بزنس بضل إله تفاصيله، وإنت بتضل ماسك الإدارة كاملة من مكان واحد — بدون حسابات متفرقة، ولا شغل موزّع بين أكثر من نظام.",
      items: [
        { title: "هوية شغلك", description: "كل بزنس بضل إله اسمه، حضوره وتفاصيله الخاصة، بدون ما يضيع بين الباقي." },
        { title: "الفروع", description: "دير فروع كل بزنس ورتّب تفاصيلهن، بدون ما تتنقّل من محل لمحل." },
        { title: "اللغات", description: "درب مجهز يكون متعدد اللغات من أول يوم." },
        { title: "المظهر", description: "كل بزنس إله شكله وشخصيته، وإنت بتتحكم فيهم من نفس المكان." },
        { title: "النطاقات", description: "اربط كل بزنس بعنوانه الخاص عالويب، وخليه يضل جزء من نفس منظومة درب." },
        { title: "الميديا", description: "رتّب صور وفيديوهات كل بزنس بمحلها وخلي كل شي سهل تلاقيه وتستعمله." },
      ],
    },
    languages: {
      eyebrow: "بناسب الكل",
      title: "ثلاث لغات، وكل وحدة معمولة صح.",
      description:
        "درب من البداية مجهز للعربي، العبري والإنجليزي — كل لغة باتجاهها وتفاصيلها، عشان تطلع طبيعية بالموقع, ما في ولا حرف Hardcoded.",
      scripts: [
        { code: "AR", title: "العربية", detail: "من اليمين لليسار", lang: "ar" },
        { code: "HE", title: "עברית", detail: "מימין לשמאל", lang: "he" },
        { code: "EN", title: "English", detail: "Left to right", lang: "en" },
      ],
    },
    finalCta: {
      eyebrow: "إلك حساب بدرب؟",
      title: "كل إدارتك بمحل واحد.",
      description: "ادخل على حسابك وكمل إدارة شغلك، البزنسات والمنتجات المفعّلة إلك من نفس المحل تحت نفس السقف.",
      action: "تسجيل الدخول",
    },
    footer: {
      statement: "مجالات كثيرة. درب واحد.",
      admin: "إدارة درب",
      rights: "درب. جميع الحقوق محفوظة.",
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
      paths: "תחומים",
      products: "מוצרים",
      foundation: "הפלטפורמה",
      signIn: "התחברות",
      openMenu: "פתיחת התפריט",
      closeMenu: "סגירת התפריט",
      language: "שפה",
    },
    hero: {
      eyebrow: "לא משנה מה העסק שלך — יש לו מקום ב-Darb",
      titleLead: "עולמות שונים.",
      titleAccent: "בסיס אחד.",
      description:
        "Darb היא פלטפורמה שמתאימה את עצמה לאופי של העסק שלך — עם מוצרים שנבנו סביב התחום שלך, עובדים יחד, ונותנים לך להתרחב בלי לפצל את העסק בין מערכות שונות.",
      primaryAction: "מתחילים עם Darb",
      secondaryAction: "התחברות",
      imageAlt: "פתח אדריכלי מואר המוביל אל אופק חדש",
      scrollLabel: "לגלות עוד",
    },
    story: {
      eyebrow: "לכל עסק יש אופי משלו",
      title: "Darb היא פלטפורמה שתמאימה את עצמה לעסק שלך, לא להפך.",
      body: "כל תחום עובד אחרת, עם הפרטים שלו ועם מה שמייחד אותו. Darb לוקחת את ההבדלים האלה ובונה סביבם חוויה שלמה לעסק שלך — גמישה ומוכנה לגדול איתך.", 
      principle: "לכל תחום יש היגיון משלו, ו-Darb בנוי בדיוק על הרעיון הזה.",
    },
    paths: {
      eyebrow: "לכל עסק הדרך שלו",
      title: "Darb משנה את החוויה, לא את הבסיס.",
       description:
      "כל תחום שונה באופי שלו, בפרטים שלו ובדרך שבה הוא עובד. Darb בונה לכל אחד חוויה שמתאימה לו, על אותה פלטפורמה.",
      items: [
        {
          title: "מסעדות ובתי קפה",
          status: "זמין עכשיו",
          description:
          "תן ללקוחות להגיע לתפריט, להבין אותו ולהתמצא בו בקלות, כשהכול מוצג בצורה מסודרת וברמה שמתאימה לעסק שלך.",
      },
        {
          title: "סלונים והזמנת תורים",
          status: "בקרוב",
          description:
          "הפוך את תהליך ההזמנה לפשוט וזורם, מבחירת המועד ועד לאישור — בזמן שאתה נשאר בשליטה על היום ועל העסק.",
         },
        {
          title: "בעלי מקצוע ומרפאות",
          status: "בקרוב",
          description:
          "תן לאנשים למצוא את העסק שלך, להבין מה אתה מציע ולדעת למה לבחור בך — במקום אחד שמציג אותך כמו שצריך.",
      },
        {
          title: "חנות אונליין",
          status: "בקרוב",
          description:
          "תן ללקוחות למצוא את מה שהם מחפשים, לבחור בנוחות ולהשלים את ההזמנה בלי ללכת לאיבוד בדרך.",
        },
      ],
    },
    products: {
      eyebrow: "המוצרים של Darb",
      title: "מתחילים במה שמתאים לעסק, ומוסיפים כשצריך.",
      description:
        "המוצרים של Darb נבנו לעבוד יחד, לא כל אחד בנפרד. בוחרים את מה שמשרת את העסק היום, ומוסיפים עוד ככל שהצרכים גדלים.",
      available: "מוצר זמין",
      future: "בקרוב מאוד",
      items: [
        {
          key: "restaurant",
          title: "Darb למסעדות",
          description:
          "כל מה שהמסעדה צריכה כדי להציג את עצמה ללקוח בצורה מסודרת, ברורה ונוחה לשימוש מכל מכשיר.",
          current: true,
        },
        {
          key: "booking",
          title: "הזמנות תורים",
          description:
          "נהל את השירותים, התורים והזמן שלך, ותן ללקוחות להזמין בדרך שנוחה להם ונוחה לך.",
          current: false,
        },
        {
          key: "pages",
          title: "דפי נחיתה",
          description:
          "בנה לעסק שלך אתר שמספר מי אתה, מציג מה אתה מציע ונותן לאנשים את כל מה שהם צריכים לדעת.",
          current: false,
        },
        {
          key: "commerce",
          title: "חנות אונליין",
          description:
          "הפוך את המוצרים שלך לחנות אונליין מסודרת, ותן ללקוחות לגלות, לבחור ולקנות בקלות.",
          current: false,
        },
      ],
      honestNote:
      "המוצרים האלה הם רק הצצה ראשונה — ל-Darb יש עוד הרבה יותר להציע.",
  },
    foundation: {
      eyebrow: "יש לך יותר מעסק אחד?",
      title:
      "Darb מרכז את כולם ועוזר לך לנהל הכול תחת קורת גג אחת.",
      description:
      "כל עסק שומר על הפרטים שלו, ואתה נשאר בשליטה על כל הניהול ממקום אחד, בלי חשבונות מפוזרים ובלי עבודה בין כמה מערכות.",
      items: [
         {
        title: "זהות העסק",
        description:
          "כל עסק שומר על השם, הנוכחות והפרטים שלו, בלי להתערבב עם האחרים.",
         },
             {
        title: "סניפים",

        description:
          "נהל את הסניפים של כל עסק ואת הפרטים שלהם, בלי לקפוץ ממקום למקום.",
      },

           {
        title: "שפות",

        description:
          "Darb בנוי לריבוי שפות מהיום הראשון.",
      },

          {
        title: "מראה",

        description:
          "לכל עסק המראה והאופי שלו, ואתה שולט בכולם מאותו מקום.",
      },

         {
        title: "דומיינים",

        description:
          "חבר כל עסק לדומיין משלו, כשהכול נשאר מחובר בתוך Darb.",
      },
           {
        title: "מדיה",

        description:
          "ארגן את התמונות והסרטונים של כל עסק במקום שלהם, כדי שיהיה קל למצוא ולהשתמש בכל דבר.",
      },
      ],
    },
    languages: {
       eyebrow: "מתאים לכולם",
       title: "שלוש שפות, וכל אחת בנויה כמו שצריך.",
          description:
      "Darb בנוי מההתחלה לערבית, עברית ואנגלית — כל שפה בכיוון ובפרטים שלה, כדי שהכול ירגיש טבעי באתר, בלי טקסטים שהם Hardcoded.",
      scripts: [
        { code: "AR", title: "العربية", detail: "من اليمين إلى اليسار", lang: "ar" },
        { code: "HE", title: "עברית", detail: "מימין לשמאל", lang: "he" },
        { code: "EN", title: "English", detail: "Left to right", lang: "en" },
      ],
    },
    finalCta: {
      eyebrow: "יש לך חשבון ב-Darb?",
      title: "כל הניהול שלך במקום אחד.",
      description:
      "היכנס לחשבון והמשך לנהל את העסקים שלך ואת המוצרים הפעילים עבורך, מאותו מקום ותחת אותה קורת גג.",
      action: "התחברות",
    },
    footer: {
      statement: "עולמות שונים. פלטפורמה אחת.",
      admin: "ניהול Darb",
      rights: "Darb. כל הזכויות שמורות.",
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
      description:
    "לא הצלחנו להשלים את הטעינה. אפשר לנסות שוב בעוד רגע.",
      action: "נסה שוב",
    },
  },
  en: {
  skipLink: "Skip to content",

  brandDescriptor: "A platform that understands how your business works",

  nav: {
    primaryNavigation: "Primary navigation",
    story: "What is Darb",
    paths: "Industries",
    products: "Darb products",
    foundation: "Darb foundation",
    signIn: "Sign in",
    openMenu: "Open menu",
    closeMenu: "Close menu",
    language: "Language",
  },

  hero: {
    eyebrow: "Whatever your business, Darb is built for it.",

    titleLead: "Many worlds.",
    titleAccent: "One Platform.",

    description:
    "Darb adapts to how your business works — with products built around your industry, designed to work together and grow without splitting your business across separate systems.",
    primaryAction: "Get started with Darb",
    secondaryAction: "Sign in",

    imageAlt: "An illuminated architectural opening leading toward a new horizon",

    scrollLabel: "Discover more",
  },

  story: {
    eyebrow: "Built around difference",

    title: "Darb is built for your business, not the other way around.",
    body:
      "Every industry has its own way of working, its own details, and its own priorities. Darb takes those differences and builds around them — creating a flexible experience designed to grow with your business.",

    principle:
      "Every industry has its own logic. Darb is built around that idea.",
  },

  paths: {
    eyebrow: "Built across industries",

    title: "Darb changes the experience, not the foundation.",

    description:
      "Every industry works differently. Darb gives each one an experience shaped around how it actually operates, while keeping everything on the same platform.",

    items: [
      {
        title: "Restaurants & cafés",
        status: "Available",

        description:
          "Let customers reach your menu, understand it and explore it effortlessly — with everything presented clearly and at a standard that reflects your business.",
      },

      {
        title: "Appointments & bookings",
        status: "Coming soon",

        description:
          "Make booking effortless from choosing a time to confirming the appointment, while keeping your schedule and day-to-day operations under control.",
      },

      {
        title: "Professionals & clinics",
        status: "Coming soon",

        description:
          "Give people one clear place to discover your business, understand what you offer and see why you are the right choice.",
      },

      {
        title: "Online commerce",
        status: "Coming soon",

        description:
          "Help customers find what they need, choose with confidence and complete their order without getting lost along the way.",
      },
    ],
  },

  products: {
    eyebrow: "Darb products",

    title: "Start with what fits your business. Add more when you need it.",

    description:
      "Darb products are designed to work together, not in isolation. Start with what serves your business today, then add more as your needs grow.",

    available: "Available",
    future: "Coming soon",

    items: [
      {
        key: "restaurant",

        title: "Restaurants",

        description:
          "Everything a restaurant needs to present itself clearly, professionally and effortlessly to customers across any device.",

        current: true,
      },

      {
        key: "booking",

        title: "Bookings",

        description:
          "Manage your services, appointments and time while giving customers a booking flow that works just as well for them as it does for you.",

        current: false,
      },

      {
        key: "pages",

        title: "Websites",

        description:
          "Build your business a place on the web that introduces who you are, shows what you offer and gives people everything they need to know.",

        current: false,
      },

      {
        key: "commerce",

        title: "Commerce",

        description:
          "Turn your products into a polished online store where customers can discover, choose and buy with ease.",

        current: false,
      },
    ],

    honestNote:
      "These products are only a first glimpse — Darb has much more ahead.",
  },

  foundation: {
    eyebrow: "Running more than one business?",

    title:
      "Darb brings them together and helps you manage everything under one roof.",

    description:
      "Each business keeps its own details, while you stay in control of the bigger picture from one place — without scattered accounts or work spread across multiple systems.",

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

        description:
          "Darb is built for multilingual businesses from day one.",
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
    eyebrow: "Built for everyone",

    title: "Three languages, each built the way it should be.",

    description:
      "Darb is built from the start for Arabic, Hebrew and English — each with its own direction and language behavior, so every version feels native instead of being treated as an afterthought.",

    scripts: [
      {
        code: "AR",
        title: "العربية",
        detail: "من اليمين إلى اليسار",
        lang: "ar",
      },

      {
        code: "HE",
        title: "עברית",
        detail: "מימין לשמאל",
        lang: "he",
      },

      {
        code: "EN",
        title: "English",
        detail: "Left to right",
        lang: "en",
      },
    ],
  },

  finalCta: {
    eyebrow: "Already have a Darb account?",

    title: "All your management in one place.",

    description:
      "Sign in and continue managing your businesses and active Darb products from one place, under one roof.",

    action: "Sign in",
  },

  footer: {
    statement: "Different worlds. One platform.",
    admin: "Darb Admin",
    rights: "Darb. All rights reserved.",
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

    description:
      "Something prevented the page from loading. Try again in a moment.",

    action: "Try again",
  },
},
};
