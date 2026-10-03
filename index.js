const { addonBuilder, serveHTTP } = require("stremio-addon-sdk");

const currentYear = new Date().getFullYear();
const previousYear = currentYear - 1;

const catalogs = [
    // ⭐ مميز
    { type: "movie", id: "featured_movies", name: "⭐ أفلام مميزة" },
    { type: "series", id: "featured_series", name: "⭐ مسلسلات مميزة" },

    // 🔥 رائج
    { type: "movie", id: "trending_movies", name: "🔥 أفلام رائجة" },
    { type: "series", id: "trending_series", name: "🔥 مسلسلات رائجة" },

    // 🆕 جديد
    { type: "movie", id: "new_movies", name: "🆕 أفلام جديدة" },
    { type: "series", id: "new_series", name: "🆕 مسلسلات جديدة" },

    // ⚡ أكشن
    { type: "movie", id: "action_movies", name: "⚡ أفلام أكشن" },
    { type: "series", id: "action_series", name: "⚡ مسلسلات أكشن" },

    // 📅 السنة الحالية
    {
        type: "movie",
        id: "current_year_movies",
        name: `🎬 أفلام ${currentYear}`
    },
    {
        type: "series",
        id: "current_year_series",
        name: `📺 مسلسلات ${currentYear}`
    },

    // 📅 السنة السابقة
    {
        type: "movie",
        id: "previous_year_movies",
        name: `🎬 أفلام ${previousYear}`
    },
    {
        type: "series",
        id: "previous_year_series",
        name: `📺 مسلسلات ${previousYear}`
    },

    // 🌙 عربي
    { type: "movie", id: "arabic_movies", name: "🌙 أفلام عربية" },
    { type: "series", id: "arabic_series", name: "🌙 مسلسلات عربية" },

    // 🌏 آسيوي
    { type: "movie", id: "asian_movies", name: "🌏 أفلام آسيوية" },
    { type: "series", id: "asian_series", name: "🌏 مسلسلات آسيوية" },

    // 🇪🇺 أوروبي
    { type: "movie", id: "european_movies", name: "🇪🇺 أفلام أوروبية" },
    { type: "series", id: "european_series", name: "🇪🇺 مسلسلات أوروبية" },

    // 🍥 أنمي
    { type: "movie", id: "anime_movies", name: "🍥 أفلام أنمي" },
    { type: "series", id: "anime_series", name: "🍥 مسلسلات أنمي" },

    // 🧸 أطفال
    { type: "movie", id: "kids_movies", name: "🧸 أفلام أطفال" },
    { type: "series", id: "kids_series", name: "🧸 مسلسلات أطفال" },

    // 🎥 وثائقي
    { type: "movie", id: "documentary_movies", name: "🎥 أفلام وثائقية" },
    { type: "series", id: "documentary_series", name: "🎥 مسلسلات وثائقية" }
].map(catalog => ({
    ...catalog,
    extra: [
        {
            name: "skip",
            isRequired: false
        }
    ]
}));

const manifest = {
    id: "org.khalid.arabic.library",
    version: "1.0.0",
    name: "مكتبتي العربية",
    description: "مكتبة عربية مخصصة للأفلام والمسلسلات والأنمي والأطفال والوثائقيات",
    resources: ["catalog", "meta"],
    types: ["movie", "series"],
    catalogs
};

const builder = new addonBuilder(manifest);

// مؤقتًا حتى نربط المكتبات بالمصادر
builder.defineCatalogHandler(async () => {
    return { metas: [] };
});

builder.defineMetaHandler(async () => {
    return { meta: null };
});

serveHTTP(builder.getInterface(), {
    port: process.env.PORT || 7000
});
