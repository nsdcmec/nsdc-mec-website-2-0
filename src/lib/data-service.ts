import type { MockData, TeamYear } from "../types";

async function fetchJsonFromUrl<T>(url: string): Promise<T> {
  if (!url) {
    console.warn("fetchJsonFromUrl called with an undefined URL.");
    return {} as T;
  }
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch ${url}: ${response.statusText}`);
    }
    return response.json();
  } catch (error) {
    console.error(`Error fetching from ${url}:`, error);
    throw error;
  }
}

const productionDataService = {
  getInitialData: async (): Promise<MockData> => {
    const urls = {
      hero: process.env.MOCK_HERO_URL,
      about: process.env.MOCK_ABOUT_URL,
      resources: process.env.MOCK_RESOURCES_URL,
      teamsPreview: process.env.MOCK_TEAM_PREVIEW_URL,
      links: process.env.MOCK_LINKS_URL,
    };

    try {
      const serverUrl = process.env.SERVER_URL;
      const serverDataResponse = await fetch(`${serverUrl}/api/data`);

      if (!serverDataResponse.ok) {
        throw new Error(`Server returned ${serverDataResponse.status}`);
      }

      const serverData = await serverDataResponse.json();

      const [heroContent, about, resources, teamsPreview, links] =
        await Promise.all([
          fetchJsonFromUrl<any>(urls.hero!),
          fetchJsonFromUrl<any>(urls.about!),
          fetchJsonFromUrl<any>(urls.resources!),
          fetchJsonFromUrl<any>(urls.teamsPreview!),
          fetchJsonFromUrl<any>(urls.links!),
        ]);

      return {
        heroContent,
        announcements: serverData.announcements || [],
        about,
        events: serverData.events || [],
        projects: serverData.projects || [],
        resources,
        teams: serverData.teams || [],
        teamsPreview,
        links: links || [],
      };
    } catch (error) {
      console.error("Failed to fetch data during build:", error);
      throw new Error("Could not load data from server-side service.");
    }
  },
};

const mockDataService = {
  getInitialData: async (): Promise<MockData> => {
    const urls = {
      hero: process.env.MOCK_HERO_URL,
      about: process.env.MOCK_ABOUT_URL,
      resources: process.env.MOCK_RESOURCES_URL,
      teamsPreview: process.env.MOCK_TEAM_PREVIEW_URL,
      links: process.env.MOCK_LINKS_URL,
    };

    try {
      const [
        heroContent,
        announcements,
        about,
        events,
        projects,
        resources,
        teams,
        teamsPreview,
        links,
      ] = await Promise.all([
        fetchJsonFromUrl<any>(urls.hero!),
        fetchJsonFromUrl<any[]>(
          process.env.MOCK_ANNOUNCEMENTS_URL || urls.hero!,
        ),
        fetchJsonFromUrl<any>(urls.about!),
        fetchJsonFromUrl<any[]>(process.env.MOCK_EVENTS_URL || urls.hero!),
        fetchJsonFromUrl<any[]>(process.env.MOCK_PROJECTS_URL || urls.hero!),
        fetchJsonFromUrl<any>(urls.resources!),
        fetchJsonFromUrl<TeamYear[]>(process.env.MOCK_TEAMS_URL || urls.hero!),
        fetchJsonFromUrl<any>(urls.teamsPreview!),
        fetchJsonFromUrl<any>(urls.links!),
      ]);

      return {
        heroContent,
        announcements: announcements || [],
        about,
        events: events || [],
        projects: projects || [],
        resources,
        teams: teams || [],
        teamsPreview,
        links: links || [],
      };
    } catch (error) {
      console.error("Failed to fetch mock data:", error);
      throw new Error("Could not load mock data.");
    }
  },
};

const USE_MOCK_DATA = process.env.USE_MOCK_DATA === "true";

export const dataService = USE_MOCK_DATA
  ? mockDataService
  : productionDataService;
