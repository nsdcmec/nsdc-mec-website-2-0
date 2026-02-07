import type { MockData } from "../types";

export interface ShortUrl {
  slug: string;
  destination: string;
  type: "redirect" | "iframe";
  title?: string;
}

class SiteStore {
  private readonly MAX_CACHE_SIZE = 200;
  public lastResetTime: number = 0;
  private siteData: MockData | null = null;

  private routeMap: Map<string, ShortUrl> = new Map();

  private htmlCache: Map<string, string> = new Map();

  public lastFetched: number = 0;

  private fetchPromise: Promise<void> | null = null;

  private fetcher: () => Promise<{ siteData: MockData; routes: ShortUrl[] }> =
    async () => {
      throw new Error("Fetcher not initialized");
    };

  public registerFetcher(
    fn: () => Promise<{ siteData: MockData; routes: ShortUrl[] }>,
  ) {
    this.fetcher = fn;
  }

  public async getSiteData(): Promise<MockData> {
    await this.ensureData();
    return this.siteData!;
  }

  public async getRoute(slug: string): Promise<ShortUrl | undefined> {
    await this.ensureData();
    return this.routeMap.get(slug);
  }

  public getCachedHtml(key: string): string | undefined {
    const content = this.htmlCache.get(key);
    if (content) {
      this.htmlCache.delete(key);
      this.htmlCache.set(key, content);
    }
    return content;
  }

  public setCachedHtml(key: string, html: string) {
    if (!this.siteData) return;

    if (this.htmlCache.size >= this.MAX_CACHE_SIZE) {
      const oldestKey = this.htmlCache.keys().next().value;
      if (oldestKey) {
        this.htmlCache.delete(oldestKey);
      }
    }

    this.htmlCache.set(key, html);
  }

  private async ensureData() {
    if (this.siteData) return;
    if (this.fetchPromise) {
      await this.fetchPromise;
      return;
    }

    this.fetchPromise = this.performFetch();
    try {
      await this.fetchPromise;
    } finally {
      this.fetchPromise = null;
    }
  }

  private async performFetch() {
    const start = Date.now();

    const { siteData, routes } = await this.fetcher();

    this.siteData = siteData;
    console.log(routes);

    this.routeMap.clear();
    routes.forEach((r) => this.routeMap.set(r.slug, r));

    this.htmlCache.clear();

    this.lastFetched = Date.now();
    console.log(
      `[Store] ✅ Data loaded in ${Date.now() - start}ms. Routes: ${routes.length}`,
    );
  }

  public reset() {
    console.log("[Store] ⚠️ Cache Reset Triggered");
    this.siteData = null;
    this.routeMap.clear();
    this.htmlCache.clear();
    this.lastFetched = 0;
  }
}

export const store = new SiteStore();
