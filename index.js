const { addonBuilder, serveHTTP } = require("stremio-addon-sdk");
const TMDB_API_KEY = process.env.TMDB_API_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const TMDB_BASE = "https://api.themoviedb.org/3";
const TMDB_IMAGE = "https://image.tmdb.org/t/p/w500";
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
async function tmdb(path, params = {}) {
    if (!TMDB_API_KEY) {
        throw new Error("TMDB_API_KEY غير موجود");
    }

    const query = new URLSearchParams({
        api_key: TMDB_API_KEY,
        language: params.language || "ar-SA",
        ...params
    });

    const response = await fetch(
        `${TMDB_BASE}${path}?${query.toString()}`
    );

    if (!response.ok) {
        throw new Error(`TMDB error ${response.status}`);
    }

    return response.json();
}
async function translateWithGemini(text) {
    if (!text || !GEMINI_API_KEY) {
        return "";
    }

    try {
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: `ترجم وصف الفيلم أو المسلسل التالي إلى العربية الفصحى بشكل طبيعي ودقيق. لا تضف معلومات ولا تحذف أحداثًا ولا تكتب أي مقدمة أو ملاحظات. أعد الترجمة فقط:\n\n${text}`
                        }]
                    }]
                })
            }
        );

        if (!response.ok) {
            return "";
        }

        const data = await response.json();

        return data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";

    } catch (error) {
        console.error("Gemini translation error:", error);
        return "";
    }
}

const builder = new addonBuilder(manifest);
function getCatalogSource(type, id) {
    const mediaType = type === "series" ? "tv" : "movie";

    const sources = {
        featured_movies: ["/movie/top_rated", {}],
        featured_series: ["/tv/top_rated", {}],

        trending_movies: ["/trending/movie/week", {}],
        trending_series: ["/trending/tv/week", {}],

        new_movies: ["/movie/now_playing", {}],
        new_series: ["/tv/on_the_air", {}],

        current_year_movies: ["/discover/movie", {
            primary_release_year: currentYear,
            sort_by: "popularity.desc"
        }],
        current_year_series: ["/discover/tv", {
            first_air_date_year: currentYear,
            sort_by: "popularity.desc"
        }],

        previous_year_movies: ["/discover/movie", {
            primary_release_year: previousYear,
            sort_by: "popularity.desc"
        }],
        previous_year_series: ["/discover/tv", {
            first_air_date_year: previousYear,
            sort_by: "popularity.desc"
        }],

        action_movies: ["/discover/movie", { with_genres: 28 }],
        action_series: ["/discover/tv", { with_genres: 10759 }],

        arabic_movies: ["/discover/movie", {
            with_original_language: "ar",
            sort_by: "popularity.desc"
        }],
        arabic_series: ["/discover/tv", {
            with_original_language: "ar",
            sort_by: "popularity.desc"
        }],

        asian_movies: ["/discover/movie", {
            with_original_language: "ko|ja|zh",
            sort_by: "popularity.desc"
        }],
        asian_series: ["/discover/tv", {
            with_original_language: "ko|ja|zh",
            sort_by: "popularity.desc"
        }],

        european_movies: ["/discover/movie", {
            with_original_language: "fr|de|it|es",
            sort_by: "popularity.desc"
        }],
        european_series: ["/discover/tv", {
            with_original_language: "fr|de|it|es",
            sort_by: "popularity.desc"
        }],

        anime_movies: ["/discover/movie", {
            with_genres: 16,
            with_original_language: "ja",
            sort_by: "popularity.desc"
        }],
        anime_series: ["/discover/tv", {
            with_genres: 16,
            with_original_language: "ja",
            sort_by: "popularity.desc"
        }],

        kids_movies: ["/discover/movie", {
            with_genres: "16|10751",
            sort_by: "popularity.desc"
        }],
        kids_series: ["/discover/tv", {
            with_genres: "16|10762",
            sort_by: "popularity.desc"
        }],

        documentary_movies: ["/discover/movie", {
            with_genres: 99,
            sort_by: "popularity.desc"
        }],
        documentary_series: ["/discover/tv", {
            with_genres: 99,
            sort_by: "popularity.desc"
        }]
    };

    return sources[id] || [`/discover/${mediaType}`, {
        sort_by: "popularity.desc"
    }];
}

builder.defineCatalogHandler(async (args) => {
    try {
        const [path, params] = getCatalogSource(args.type, args.id);
        const skip = Number(args.extra?.skip || 0);
        const page = Math.floor(skip / 20) + 1;

        const data = await tmdb(path, {
            ...params,
            page,
            language: "ar-SA"
        });

        const metas = (data.results || [])
            .filter(item => item.poster_path)
            .map(item => ({
                id: `tmdb:${item.id}`,
                type: args.type,
                name:
                    item.title ||
                    item.name ||
                    item.original_title ||
                    item.original_name ||
                    "بدون عنوان",
                poster: `${TMDB_IMAGE}${item.poster_path}`,
                description:
                    item.overview ||
                    "لا يوجد وصف عربي متوفر",
                releaseInfo:
                    (
                        item.release_date ||
                        item.first_air_date ||
                        ""
                    ).substring(0, 4)
            }));

        return { metas };
    } catch (error) {
        console.error("Catalog error:", error);
        return { metas: [] };
    }
});
builder.defineMetaHandler(async (args) => {
    try {
        if (!args.id.startsWith("tmdb:")) {
            return { meta: null };
        }

        const tmdbId = args.id.split(":")[1];
        const mediaType = args.type === "series" ? "tv" : "movie";

        const data = await tmdb(
            `/${mediaType}/${tmdbId}`,
            {
                language: "ar-SA",
                append_to_response: "external_ids,credits"
            }
        );

        const date =
            data.release_date ||
            data.first_air_date ||
            "";

        const genres = Array.isArray(data.genres)
            ? data.genres.map(genre => genre.name)
            : [];

        const cast = data.credits?.cast
            ? data.credits.cast
                .slice(0, 10)
                .map(person => person.name)
            : [];

        const directors = data.credits?.crew
            ? data.credits.crew
                .filter(person => person.job === "Director")
                .slice(0, 3)
                .map(person => person.name)
            : [];
let description = data.overview || "";

if (!description) {
    const englishData = await tmdb(
        `/${mediaType}/${tmdbId}`,
        { language: "en-US" }
    );

    if (englishData.overview) {
        description = await translateWithGemini(englishData.overview);
    }
}
        const meta = {
            id: args.id,
            type: args.type,

            name:
                data.title ||
                data.name ||
                data.original_title ||
                data.original_name ||
                "بدون عنوان",

            poster: data.poster_path
                ? `${TMDB_IMAGE}${data.poster_path}`
                : undefined,

            background: data.backdrop_path
                ? `https://image.tmdb.org/t/p/original${data.backdrop_path}`
                : undefined,

       description:
    description || "لا يوجد وصف متوفر", 

            releaseInfo:
                date ? date.substring(0, 4) : undefined,

            genres,
            cast,
            director: directors,

            imdbRating:
                typeof data.vote_average === "number"
                    ? data.vote_average.toFixed(1)
                    : undefined,

            runtime:
                data.runtime
                    ? `${data.runtime} min`
                    : undefined
        };

        return { meta };

    } catch (error) {
        console.error("Meta error:", error);
        return { meta: null };
    }
});



serveHTTP(builder.getInterface(), {
    port: process.env.PORT || 7000
});
