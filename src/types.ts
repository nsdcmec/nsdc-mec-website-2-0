export interface Announcement {
  id: string;
  title: string;
  link?: string;
}

export interface HeroContent {
  type: "image" | "video" | "url" | "animation";
  src?: string;
  href?: string;
  desc?: string;
  buttonText?: string;
}

export interface AboutContent {
  title: string;
  paragraphs: string[];
  image: string;
}

export interface Event {
  id: string;
  relation: string;
  date: string;
  title: string;
  desc: string;
  img: string;
  isArchived: boolean;
  tags?: string[];
  buttonText?: string;
  link?: string;
}

export interface Project {
  id: string;
  date: string;
  title: string;
  desc: string;
  img: string;
  link?: string;
}

export interface Report {
  id: string;
  relation: string;
  date: string;
  title: string;
  desc: string;
  img: string;
}

export interface Resource {
  id: string;
  title: string;
  desc: string;
  img: string;
  link: string;
}

export interface TeamMember {
  id: string;
  name: string;
  title: string;
  img: string;
  linkedin?: string;
  github?: string;
  priority: number;
}

export interface TeamPreview {
  type: "url";
  src: string;
}

export interface TeamYear {
  id: string;
  title: string;
  members: TeamMember[];
}

interface SubLink {
  name: string;
  href: string;
  desc?: string;
}

export interface LinkColumn {
  title: string;
  links: SubLink[];
}

export interface MockData {
  heroContent: HeroContent;
  announcements: Announcement[];
  about: AboutContent;
  events: Event[];
  projects: Project[];
  resources: Resource[];
  teams: TeamYear[];
  teamsPreview: TeamPreview;
  links: LinkColumn[];
}
