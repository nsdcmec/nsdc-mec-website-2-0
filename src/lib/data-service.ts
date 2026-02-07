import { initializeApp, cert, getApps } from "firebase-admin/app";
import { store } from "./store";
import fs from "node:fs/promises";
import path from "node:path";
import type { MockData, Event, Project, Announcement } from "../types";
import { fetchCollection, fetchTeams, fetchShortUrls } from "./db-operations";

/* =========================================
   HELPER: JSON READER (Used by both modes)
   ========================================= */
const readJson = async (filename: string) => {
  try {
    const filePath = path.join(process.cwd(), "public", "mock-db", filename);
    const fileContent = await fs.readFile(filePath, "utf-8");
    return JSON.parse(fileContent);
  } catch (e) {
    console.error(`Failed to load mock file: ${filename}`, e);
    return null;
  }
};

/* =========================================
   1. MOCK DATA LOADER (Pure File System)
   ========================================= */
const loadMockData = async () => {
  console.log("Loading ALL data from filesystem...");
  const [
    hero,
    about,
    resources,
    teamsPreview,
    links,
    announcements,
    events,
    projects,
    teams,
    routes,
  ] = await Promise.all([
    readJson("hero.json"),
    readJson("about.json"),
    readJson("resources.json"),
    readJson("team-preview.json"),
    readJson("links.json"),
    readJson("announcements.json"),
    readJson("events.json"),
    readJson("projects.json"),
    readJson("teams.json"),
    readJson("routes.json"),
  ]);

  const siteData: MockData = {
    heroContent: hero || {},
    about: about || {},
    resources: resources || [],
    teamsPreview: teamsPreview || {},
    links: links || [],
    announcements: announcements || [],
    events: events || [],
    projects: projects || [],
    teams: teams || [],
  };

  return { siteData, routes };
};

/* =========================================
   2. HYBRID LOADER (Firestore + Mock Fallback)
   ========================================= */
const loadFirestoreData = async () => {
  console.log("Loading HYBRID data (DB + Filesystem)...");

  if (!getApps().length) {
    const serviceAccount = JSON.parse(
      process.env.FIREBASE_SERVICE_ACCOUNT || "{}",
    );
    initializeApp({ credential: cert(serviceAccount) });
  }

  const dbPromise = Promise.all([
    fetchTeams(),
    fetchCollection<Event>("events"),
    fetchCollection<Project>("projects"),
    fetchCollection<Announcement>("announcements"),
    fetchShortUrls(),
  ]);

  //TODO add these data to db
  const filePromise = Promise.all([
    readJson("hero.json"),
    readJson("about.json"),
    readJson("resources.json"),
    readJson("team-preview.json"),
    readJson("links.json"),
    readJson("routes.json"),
  ]);

  const [
    [dbTeams, dbEvents, dbProjects, dbAnnouncements],
    [hero, about, resources, teamsPreview, links, routes],
  ] = await Promise.all([dbPromise, filePromise]);

  const siteData: MockData = {
    teams: dbTeams,
    events: dbEvents,
    projects: dbProjects,
    announcements: dbAnnouncements,

    heroContent: hero || {},
    about: about || {},
    resources: resources || [],
    teamsPreview: teamsPreview || {},
    links: links || [],
  };

  return { siteData, routes: routes as any[] };
};

const useMock = process.env.NODE_ENV === "development";
console.log(useMock, "usemock");

store.registerFetcher(useMock ? loadMockData : loadFirestoreData);

export const dataService = {
  getInitialData: async () => store.getSiteData(),
  getRoute: async (slug: string) => store.getRoute(slug),
};
