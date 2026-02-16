// 1. Announcements
export interface Announcement {
  id: number;
  priority: number;
  title: string | null;
  date: string | null;
  link: string | null;
  description: string | null;
}

// 2. Events & Metadata
export interface Collaborator {
  name: string;
  desc: string;
  img: string;
  link?: string;
}

export interface Prize {
  title: string;
  reward: string;
  priority: number;
  position?: number;
  desc?: string;
}

export interface Round {
  name: string;
  desc: string;
  priority: number;
  format: "online" | "offline";
  outcome?: string;
  criteria?: string;
  objective?: string;
}

export interface Contact {
  name: string;
  role?: string;
  phone?: string;
  email?: string;
  priority: number;
}

export interface Fee {
  label: string;
  amount: string;
  condition?: string;
  is_active: boolean;
}

export interface BgConfig {
  type: "image" | "html" | "iframe";
  value: string; // URL or HTML string
}

export interface HeroStateConfig {
  bg?: BgConfig;
  link?: string;
  hide_details?: boolean;
}

export interface HeroEventConfig {
  start_date: string;
  end_date: string;
  show_in_hero: boolean;

  // Timings (optional, default 0)
  before?: number;
  after?: number;

  // Default/Fallback BG (required if no specific BG provided?)
  bg_type?: "image" | "html" | "iframe";
  bg_value?: string;

  // State-specific Configurations
  before_config?: HeroStateConfig;
  ongoing_config?: HeroStateConfig;
  after_config?: HeroStateConfig;
}

export interface EventMetadata {
  collaborators?: Collaborator[];
  prizes?: Prize[];
  rounds?: Round[];
  contacts?: Contact[];
  fees?: Fee[];
  hero_config?: HeroEventConfig;
}

export interface Event {
  id: number;
  title: string;
  description: string | null;
  image_url: string | null;
  date: string | null;
  status: "upcoming" | "recent" | "past";
  venue: string | null;
  event_type: string | null;
  tags: string[];
  link: string | null;
  priority: number;
  report_url: string | null;
  custom_html: string | null;
  button_text: string | null;
  metadata: EventMetadata;
}

// 3. Team Members
export interface SocialLinks {
  linkedin?: string;
  github?: string;
  twitter?: string;
  instagram?: string;
  website?: string;
}

export interface TeamMember {
  id: number;
  name: string;
  year: number;
  position: string;
  priority: number;
  description: string | null;
  image_url: string | null;
  social_links: SocialLinks;
  role: string;
}

export interface TeamYear {
  year: number;
  members: TeamMember[];
}

export interface AboutCardConfig {
  id: string;
  type: "stats" | "reviews" | "chairman" | "general";
  title?: string;
  content?: string;
  rowSpan: number;
  colSpan: number;
  isActive: boolean;
  metadata?: Record<string, any>;
}

export interface AboutConfig {
  title: string;
  subtitle?: string;
  cards: AboutCardConfig[];
}


export interface HeroConfig {
  title: string;
  subtitle: string;
  desc: string;
}

export interface HeroMainConfig {
  type: "img" | "video" | "iframe";
  src: string;
  link: string;
  buttontext: string;
  desc: string;
}

export interface TeamMainConfig {
  title: string;
  subtitle: string;
  src: string;
  type: "img" | "video";
  images?: string[];
}

export interface SlotConfig {
  html: string;
  is_active: boolean;
}

export interface TopHtmlConfig extends SlotConfig {
  should_close?: boolean;
}

export interface GlobalInjections {
  top_html?: TopHtmlConfig | string;
  hero_slot?: SlotConfig | string;
  footer_slot?: SlotConfig | string;
}

export interface Link {
  id: number;
  label: string;
  url: string;
  position: "header" | "footer";
  group: string | null;
  priority: number;
}

export interface ShortUrl {
  slug: string;
  destination_url: string;
  type: "iframe" | "redirect" | "embed" | "gform";
  metadata?: Record<string, any>;
}

export interface ResourceMetadata {
  authors?: { name: string; link?: string }[];
  doi?: string;
  publishers?: { name: string; link?: string }[];
  version?: string;
  additional_html?: string;
}

export interface Resource {
  id: number;
  title: string;
  description: string | null;
  image_url: string | null;
  link: string | null;
  date: string | null;
  priority: number;
  resource_type: string;
  status: "active" | "archived" | "upcoming";
  tags: string[];
  button_text?: string;
  metadata: ResourceMetadata;
}

export interface Report {
  id: string;
  relation: string;
  date: string;
  title: string;
  desc: string;
  img: string;
}

export interface SiteData {
  announcements: Announcement[];
  events: Event[];
  teams: TeamYear[];
  links: Link[];
  shortLinks: ShortUrl[];
  resources: Resource[];
  config: {
    about: AboutConfig;
    hero: HeroConfig;
    heroMain: HeroMainConfig;
    teamMain: TeamMainConfig;
    injections: GlobalInjections;
    theme: string;
  };
}
