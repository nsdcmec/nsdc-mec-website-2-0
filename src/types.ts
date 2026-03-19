// 1. Announcements
export interface Announcement {
  id: number;
  priority: number;
  title: string | null;
  link: string | null;
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
  venue: string | null;
  event_type: string | null;
  tags: string[];
  link: string | null;
  report_url: string | null;
  custom_html: string | null;
  button_text: string | null;
  metadata: EventMetadata;
}

// 3. Team Members
export interface SocialLink {
  name: string;
  url: string;
}

export interface TeamMember {
  id: number;
  name: string;
  year: number;
  position: string;
  priority: number;
  description: string | null;
  image_url: string | null;
  social_links: SocialLink[];
  role: string;
}

export interface TeamYear {
  year: number;
  members: TeamMember[];
}

export interface AboutQuote {
  name: string;
  role?: string;
  quote: string;
  photo?: string;
  organization?: string;
}

export interface AboutConfig {
  title: string;
  subtitle?: string;
  desc_main?: string;
  desc_2?: string;
  established_year?: number;
  total_participants?: string;
  nbdc?: {
    title: string;
    desc: string;
    img?: string;
  };
  chairperson?: AboutQuote;
  external_testimonial?: AboutQuote;
  impact?: {
    line: string;
  };
}

export interface HeroConfig {
  title: string;
  subtitle: string;
  desc: string;
}

export interface Report {
  id: string;
  relation: string;
  date: string;
  title: string;
  desc: string;
  img: string;
}

export type AnimationVariant =
  | "constellation"
  | "data-stream"
  | "topographical-matrix";

export interface HeroMainConfig {
  type: "img" | "video" | "iframe" | "animation" | "none";
  src: string;
  link: string;
  buttontext: string;
  desc: string;
  animation_variant?: AnimationVariant;
}

export interface CarouselItem {
  type: "img" | "video";
  src: string;
  priority: number;
}

export interface TeamMainConfig {
  title: string;
  subtitle: string;
  items: CarouselItem[];
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
  type: "iframe" | "redirect" | "embed" | "gform" | "resource-page";
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
    colors?: ThemeColors;
  };
}

export interface ThemeColorSet {
  bg0?: string;
  bg1?: string;
  bg2?: string;
  fg0?: string;
  fg1?: string;
  primary?: string;
  primaryFg?: string;
}

export interface ThemeColors {
  light?: ThemeColorSet;
  dark?: ThemeColorSet;
}
