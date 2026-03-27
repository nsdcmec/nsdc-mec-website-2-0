import { createSignal, onMount, onCleanup, Show, createMemo } from "solid-js";
import type { HeroConfig, HeroMainConfig, Announcement, Event } from "../types";
import HeroEvent from "./HeroEvent";
import HeroAnimation from "./HeroAnimation";
import Announcements from "./AnnouncementIsland";
import { parseEventDate } from "../lib/date-utils";
import { getTarget, getRel } from "../lib/link-utils";
import { HeroRevealFade, HeroTextSplit } from "./HeroReveal";

interface Props {
  config: HeroConfig;
  main: HeroMainConfig;
  announcements: Announcement[];
  heroEvents: Event[];
}

export default function HeroClient(props: Props) {
  const [now, setNow] = createSignal(new Date().getTime());
  const [isHydrated, setIsHydrated] = createSignal(false);

  onMount(() => {
    setIsHydrated(true);
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
          <div 
            class="relative w-full h-[100dvh] flex flex-col overflow-hidden transition-opacity duration-700 ease-in-out"
            style={{ opacity: isHydrated() ? 1 : 0 }}
          >
            {/* Background Layer (Animation/Glow) */}
            <div class="absolute inset-0 pointer-events-none z-0 opacity-60">
              <Show
                when={props.main.animation_variant}
                fallback={
                  <div class="flex items-center justify-center w-full h-full">
                    <div class="w-[60vw] h-[60vw] max-w-[600px] max-h-[600px] bg-primary/20 rounded-full blur-[100px] md:blur-[140px]"></div>
                  </div>
                }
              >
                <HeroAnimation 
                  variant={props.main.animation_variant} 
                />
              </Show>
            </div>

            {/* Content Layer */}
            <div
              class="relative z-10 flex-grow pointer-events-auto flex flex-col items-center justify-center text-center"
              style="padding: clamp(2rem,min(3dvw,6dvh),5rem) clamp(0.2rem,min(0.5dvw,2dvh),0.6rem)"
            >
              <div
                class="max-w-5xl mx-auto w-full flex flex-col items-center"
                style="gap: clamp(0.5rem,min(1dvw,3dvh),1rem)"
              >
                <Show when={isHydrated()}>
                  <HeroRevealFade index={0} as="div">
                    <Announcements announcements={props.announcements} centered={true} />
                  </HeroRevealFade>

                  <HeroTextSplit
                    index={1}
                    as="h1"
                    class="font-black tracking-tighter text-fg-0 font-sans leading-[0.95] uppercase"
                    style="font-size: clamp(3rem,min(10dvw,16dvh),8rem)"
                    text={props.config.title || "NSDC MEC"}
                  />

                  <HeroTextSplit
                    index={2}
                    as="h2"
                    class="text-fg-1 font-medium tracking-tight"
                    style="font-size: clamp(1.25rem,min(5dvw,10dvh),2.4rem)"
                    text={props.config.subtitle || "National Students Data Corps"}
                  />

                  <HeroRevealFade index={3} as="div">
                    <p
                      class="text-fg-1 font-sans leading-relaxed max-w-2xl mx-auto opacity-85 mt-2"
                      style="font-size: clamp(1rem,min(3dvw,6dvh),1.25rem)"
                    >
                      {props.config.desc ||
                        "Bridging the gap between academic curriculum and industry demand in data-centric careers."}
                    </p>
                  </HeroRevealFade>
                </Show>
              </div>
            </div>
          </div>
        }
      >
        {/* =========================================
            STATE: SPLIT EVENT/MEDIA LAYOUT
            ========================================= */}
        <div 
          class="md:grid flex flex-col justify-between md:grid-rows-1 md:grid-cols-3 md:gap-12 items-stretch h-[calc(100dvh-80px)] w-full transition-opacity duration-700 ease-in-out"
          style={{ opacity: isHydrated() ? 1 : 0 }}
        >
          <div class="absolute inset-0 pointer-events-none z-0 opacity-40">
            <Show
              when={props.main.animation_variant}
              fallback={
                <div class="flex items-center justify-center w-full h-full">
                  <div class="w-[60vw] h-[60vw] max-w-[600px] max-h-[600px] bg-primary/20 rounded-full blur-[100px] md:blur-[140px]"></div>
                </div>
              }
            >
              <HeroAnimation 
                variant={props.main.animation_variant} 
              />
            </Show>
          </div>

          <div class="md:col-span-1 flex flex-col p-4 md:p-8 pt-6 md:pt-12 md:justify-between relative z-10">
            <div class="flex flex-col gap-4 md:gap-0">
              <Show when={isHydrated()}>
                <HeroRevealFade index={0} as="div">
                  <Announcements announcements={props.announcements} />
                </HeroRevealFade>

                <HeroTextSplit
                  index={1}
                  as="h1"
                  class="font-extrabold tracking-tight text-fg-0 font-sans leading-[1.1] md:mt-6"
                  style="font-size: clamp(2rem,min(10dvw,14dvh),5rem)"
                  text={props.config.title || "National Students Data Corps"}
                />

                <HeroTextSplit
                  index={2}
                  as="h2"
                  class="text-fg-1 mt-1 font-serif"
                  style="font-size: clamp(0.9rem,min(4dvw,7dvh),1.8rem)"
                  text={props.config.subtitle || "MEC Chapter"}
                />
              </Show>
            </div>

            <Show when={isHydrated()}>
              <HeroRevealFade index={3} as="div">
                <p
                  class="text-fg-1 mt-8 md:mt-4 md:mb-0 font-sans leading-relaxed"
                  style="font-size: clamp(0.8rem,min(3dvw,5dvh),1.2rem)"
                >
                  {props.config.desc ||
                    "Bridging the gap between academic curriculum and industry demand in data-centric careers."}
                </p>
              </HeroRevealFade>
            </Show>
          </div>

          <div class="md:col-span-2 bg-bg-0 w-full aspect-square md:h-auto relative group overflow-hidden">
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
                    <HeroAnimation 
                      variant={props.main.animation_variant} 
                    />
                  </Show>

                  {/* Fallback Media Overlay */}
                  <Show when={props.main.desc || props.main.link}>
                    <div class="absolute bottom-0 left-0 right-0 translate-y-full md:group-hover:translate-y-0 transition-transform duration-300 ease-out z-20">
                      <div class="bg-bg-0/75 backdrop-blur-sm border-t border-bg-2 p-2 md:p-4 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
                        <div class="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                          <Show when={props.main.desc}>
                            <p class="text-fg-0 text-xs md:text-base font-medium font-sans leading-snug">
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
