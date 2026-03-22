import { createSignal, onMount, onCleanup, Show, createMemo } from "solid-js";
import type { HeroConfig, HeroMainConfig, Announcement, Event } from "../types";
import HeroEvent from "./HeroEvent";
import HeroAnimation from "./HeroAnimation";
import Announcements from "./AnnouncementIsland";
import { parseEventDate } from "../lib/date-utils";
import { getTarget, getRel } from "../lib/link-utils";

interface Props {
  config: HeroConfig;
  main: HeroMainConfig;
  announcements: Announcement[];
  heroEvents: Event[];
}

export default function HeroClient(props: Props) {
  const [now, setNow] = createSignal(new Date().getTime());

  onMount(() => {
    setNow(new Date().getTime());
    const interval = setInterval(() => {
      setNow(new Date().getTime());
    }, 1000);
    onCleanup(() => clearInterval(interval));
  });

  // Determines if there is a LIVE event that needs to hijack the hero space
  const activeEvent = createMemo(() => {
    const current = now();
    return props.heroEvents.find((e) => {
      const meta = e.metadata?.hero_config;
      if (!meta || !meta.show_in_hero) return false;

      const start = parseEventDate(meta.start_date);
      const end = parseEventDate(meta.end_date);
      const before = (meta.before || 0) * 60 * 1000;
      const after = (meta.after || 0) * 60 * 1000;

      return current >= start - before && current <= end + after;
    });
  });

  // Check if we should render the beautiful centered typography state
  const isNoneState = createMemo(
    () => !activeEvent() && props.main.type === "none",
  );

  return (
    <div class="w-full relative">
      <Show
        when={!isNoneState()}
        fallback={
          /* =========================================
             STATE: CENTERED "NONE" LAYOUT
             ========================================= */
          <div class="relative w-full min-h-screen flex flex-col overflow-hidden">
            {/* Background Layer (Animation/Glow) */}
            <div class="absolute inset-0 pointer-events-none z-0 opacity-40">
              <Show
                when={props.main.animation_variant}
                fallback={
                  <div class="flex items-center justify-center w-full h-full">
                    <div class="w-[60vw] h-[60vw] max-w-[600px] max-h-[600px] bg-primary/20 rounded-full blur-[100px] md:blur-[140px]"></div>
                  </div>
                }
              >
                <HeroAnimation variant={props.main.animation_variant} />
              </Show>
            </div>

            {/* Content Layer */}
            <div class="relative z-10 flex-grow pointer-events-auto flex flex-col items-center justify-center text-center px-4 py-20">
              <div class="max-w-5xl mx-auto w-full flex flex-col items-center ">
                <Announcements
                  announcements={props.announcements}
                  centered={true}
                />

                <h1 class="text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-black tracking-tighter text-fg-0 font-sans leading-[0.95] mb-6 uppercase">
                  {props.config.title || "NSDC MEC"}
                </h1>

                <h2 class="text-xl sm:text-2xl md:text-3xl text-fg-1 font-medium tracking-tight mb-8">
                  {props.config.subtitle || "National Students Data Corps"}
                </h2>

                <p class="text-base sm:text-lg md:text-xl text-fg-1 font-sans leading-relaxed max-w-2xl mx-auto mb-10 opacity-80">
                  {props.config.desc ||
                    "Bridging the gap between academic curriculum and industry demand in data-centric careers."}
                </p>
              </div>
            </div>
          </div>
        }
      >
        {/* =========================================
            STATE: SPLIT EVENT/MEDIA LAYOUT
            ========================================= */}
        <div class="grid grid-rows-9 md:grid-rows-1 md:grid-cols-3 md:gap-12 items-stretch min-h-[calc(100vh-80px)] w-full">
          <div class="md:col-span-1 row-span-5 md:row-span-1 flex flex-col p-4 md:p-8 pt-6 md:pt-12 md:justify-between relative z-10">
            <div class="flex flex-col gap-4 md:gap-0">
              <Announcements announcements={props.announcements} />
              <h1 class="text-6xl md:text-6xl font-extrabold tracking-tight text-fg-0 font-sans leading-[1.1]">
                {props.config.title || "National Students Data Corps"}
              </h1>
              <h2 class="text-xl md:text-2xl text-fg-1 mt-1 font-serif">
                {props.config.subtitle || "MEC Chapter"}
              </h2>
            </div>
            <p class="text-lg text-fg-1 mt-8 md:mt-4 md:mb-0 font-sans leading-relaxed">
              {props.config.desc ||
                "Bridging the gap between academic curriculum and industry demand in data-centric careers."}
            </p>
          </div>

          <div class="md:col-span-2 md:row-span-1 bg-bg-0 row-span-4 w-full h-[400px] md:h-auto relative group overflow-hidden">
            <Show
              when={activeEvent()}
              fallback={
                <>
                  <Show when={props.main.type === "img" && props.main.src}>
                    <img
                      src={props.main.src}
                      alt="Hero visual"
                      class="w-full h-full object-cover"
                    />
                  </Show>
                  <Show when={props.main.type === "video" && props.main.src}>
                    <video
                      src={props.main.src}
                      class="w-full h-full object-cover cursor-pointer"
                      autoplay
                      loop
                      muted
                      playsinline
                      onClick={(e) => {
                        e.currentTarget.muted = !e.currentTarget.muted;
                      }}
                    />
                  </Show>
                  <Show when={props.main.type === "iframe" && props.main.src}>
                    <iframe
                      src={props.main.src}
                      title="Hero External Content"
                      class="w-full h-full border-0 bg-bg-1"
                    />
                  </Show>
                  <Show when={props.main.type === "animation"}>
                    <HeroAnimation variant={props.main.animation_variant} />
                  </Show>

                  {/* Fallback Media Overlay */}
                  <Show when={props.main.desc || props.main.link}>
                    <div class="absolute bottom-0 left-0 right-0 translate-y-full md:group-hover:translate-y-0 transition-transform duration-300 ease-out z-20">
                      <div class="bg-bg-0/75 backdrop-blur-sm border-t border-bg-2 p-2 md:p-4 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
                        <div class="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                          <Show when={props.main.desc}>
                            <p class="text-fg-0 text-sm md:text-base font-medium font-sans leading-snug">
                              {props.main.desc}
                            </p>
                          </Show>
                          <Show when={props.main.link}>
                            <a
                              href={props.main.link}
                              target={getTarget(props.main.link)}
                              rel={getRel(props.main.link)}
                              class="flex-shrink-0 whitespace-nowrap px-6 py-2.5 bg-primary text-primary-fg font-bold font-sans text-xs uppercase tracking-widest shadow-sm hover:opacity-90 transition-opacity"
                            >
                              {props.main.buttontext || "Learn More"}
                            </a>
                          </Show>
                        </div>
                      </div>
                    </div>
                    <div class="md:hidden absolute bottom-0 left-0 right-0 bg-bg-0/90 border-t border-bg-2 p-4 z-20">
                      <div class="flex items-center justify-between gap-3">
                        <Show when={props.main.desc}>
                          <p class="text-fg-0 text-xs font-medium truncate flex-1">
                            {props.main.desc}
                          </p>
                        </Show>
                        <Show when={props.main.link}>
                          <a
                            href={props.main.link}
                            target={getTarget(props.main.link)}
                            rel={getRel(props.main.link)}
                            class="text-[10px] font-bold text-primary uppercase tracking-widest underline decoration-2 underline-offset-4"
                          >
                            {props.main.buttontext || "Learn More"}
                          </a>
                        </Show>
                      </div>
                    </div>
                  </Show>
                </>
              }
            >
              <HeroEvent event={activeEvent()!} />
            </Show>
          </div>
        </div>
      </Show>
    </div>
  );
}
