import { pool } from "./db";
import { store } from "./store";
import type {
  SiteData,
  Announcement,
  Event,
  TeamMember,
  TeamYear,
  Link,
  ShortUrl,
  AboutConfig,
  HeroConfig,
  HeroMainConfig,
  TeamMainConfig,
  GlobalInjections,
  Resource,
  ThemeColors,
} from "../types";

/* =========================================
   DB FETCHERS
   ========================================= */

async function fetchAnnouncements(): Promise<Announcement[]> {
  const res = await pool.query<Announcement>(
    "SELECT id, title, link, priority FROM club.announcements ORDER BY priority ASC",
  );
  return res.rows;
}

async function fetchEvents(): Promise<Event[]> {
  const res = await pool.query<Event>(
    "SELECT id, title, description, image_url, date, venue, event_type, tags, link, report_url, custom_html, button_text, metadata FROM club.events",
  );
  return res.rows;
}

async function fetchTeams(): Promise<TeamYear[]> {
  const res = await pool.query<TeamMember>(
    "SELECT * FROM club.teams ORDER BY year DESC, priority ASC",
  );

  // Group by Year
  const map = new Map<number, TeamMember[]>();
  for (const m of res.rows) {
    const y = m.year;
    if (!map.has(y)) map.set(y, []);
    map.get(y)!.push(m);
  }

  const result: TeamYear[] = [];
  // Sort years desc
  const years = Array.from(map.keys()).sort((a, b) => b - a);
  for (const year of years) {
    result.push({ year, members: map.get(year)! });
  }
  return result;
}

async function fetchLinks(): Promise<Link[]> {
  const res = await pool.query<Link>(
    "SELECT * FROM club.links ORDER BY priority ASC",
  );
  return res.rows;
}

async function fetchShortLinks(): Promise<ShortUrl[]> {
  const res = await pool.query<ShortUrl>("SELECT * FROM club.short_links");
  return res.rows;
}

async function fetchResources(): Promise<Resource[]> {
  const res = await pool.query<Resource>(
    "SELECT * FROM club.resources ORDER BY priority ASC",
  );
  return res.rows;
}

async function fetchSiteConfig() {
  const res = await pool.query<{ key: string; value: any }>(
    "SELECT * FROM club.site_config",
  );
  const map = new Map<string, any>();
  res.rows.forEach((r) => map.set(r.key, r.value));
  return map;
}

/* =========================================
   MAIN LOADER
   ========================================= */

const loadNeonData = async (
  retries = 3,
  delayMs = 2500,
): Promise<{ siteData: SiteData; routes: ShortUrl[] }> => {
  console.log(`Loading data from Neon DB... (Retries left: ${retries})`);

  try {
    const results = await Promise.allSettled([
      fetchAnnouncements(),
      fetchEvents(),
      fetchTeams(),
      fetchLinks(),
      fetchShortLinks(),
      fetchResources(),
      fetchSiteConfig(),
    ]);

    // Check if any critical fetch failed
    const failed = results.filter((r) => r.status === "rejected");

    if (failed.length > 0) {
      if (retries > 0) {
        // If we have retries left, wait and try again
        console.warn(
          `[Neon] ${failed.length} queries failed. Retrying in ${delayMs}ms...`,
        );
        await new Promise((res) => setTimeout(res, delayMs));
        return loadNeonData(retries - 1, delayMs);
      } else {
        throw new Error(
          `CRITICAL: ${failed.length} database queries failed after all retries.`,
        );
      }
    }

    const getResult = <T>(result: PromiseSettledResult<T>, fallback: T): T => {
      if (result.status === "fulfilled") return result.value;
      return fallback;
    };

    const announcements = getResult(results[0], []) as Announcement[];
    const events = getResult(results[1], []) as Event[];
    const teams = getResult(results[2], []) as TeamYear[];
    const links = getResult(results[3], []) as Link[];
    const shortLinks = getResult(results[4], []) as ShortUrl[];
    const resources = getResult(results[5], []) as Resource[];
    const configMap = getResult(results[6], new Map<string, any>()) as Map<
      string,
      any
    >;

    // Parse Configs
    const about = (configMap.get("about") || {
      title: "",
      desc: "",
    }) as AboutConfig;
    const hero = (configMap.get("hero") || {
      title: "",
      subtitle: "",
      desc: "",
    }) as HeroConfig;
    const heroMain = (configMap.get("hero-main") || {
      type: "none",
      src: "",
      link: "",
      buttontext: "",
      desc: "",
    }) as HeroMainConfig;
    const teamMain = (configMap.get("team-main") || {
      title: "",
      subtitle: "",
      items: [],
    }) as TeamMainConfig;
    const theme = (configMap.get("default-theme") || "light") as string;
    const colors = configMap.get("theme_colors") as ThemeColors | undefined;

    const injections: GlobalInjections = {
      top_html: configMap.get("top-html"),
      hero_slot: configMap.get("hero-slot"),
      footer_slot: configMap.get("footer-slot"),
    };

    const siteData: SiteData = {
      announcements,
      events,
      teams,
      links,
      shortLinks,
      resources,
      config: {
        about,
        hero,
        heroMain,
        teamMain,
        injections,
        theme,
        colors,
      },
    };

    return { siteData, routes: shortLinks };
  } catch (error) {
    // This catch block will now successfully catch the "CRITICAL" error we threw above.
    console.error("Failed to load data from Neon:", error);

    // We already handled retries inside the try block for Promise.allSettled,
    // so if we reach here, we just throw the error up to Astro.
    throw error;
  }
};

store.registerFetcher(loadNeonData);

export const dataService = {
  getInitialData: async () => store.getSiteData(),
  getRoute: async (slug: string) => store.getRoute(slug),
};
