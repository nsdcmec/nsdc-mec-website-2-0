import {
  createSignal,
  onMount,
  onCleanup,
  For,
  Show,
  createEffect,
} from "solid-js";
import type { CarouselItem } from "../types";

interface TeamCarouselProps {
  items: CarouselItem[];
  title?: string;
  subtitle?: string;
  isTeamCarousel?: boolean;
}

function CarouselSlide(props: {
  item: CarouselItem;
  index: number;
  currentIndex: number;
  isPaused: boolean;
  isMuted: boolean;
  onComplete: () => void;
}) {
  let videoRef: HTMLVideoElement | undefined;
  const isActive = () => props.index === props.currentIndex;

  createEffect(() => {
    if (videoRef) {
      if (isActive() && !props.isPaused) {
        videoRef.play().catch(() => {});
      } else {
        videoRef.pause();
      }
    }
  });

  return (
    <div
      class="absolute inset-0 w-full h-full will-change-[opacity,filter,transform]"
      style={{
        transition:
          "opacity 2000ms ease-in-out, filter 2000ms ease-in-out, transform 4000ms linear",
        opacity: isActive() ? 1 : 0,
        filter: isActive()
          ? "grayscale(0%) brightness(1)"
          : "grayscale(100%) brightness(0.6)",
        transform: isActive() ? "scale(1.05)" : "scale(1)",
        "z-index": isActive() ? 10 : 0,
      }}
    >
      <Show
        when={props.item.type === "video"}
        fallback={
          <img
            src={props.item.src}
            alt={`Team ${props.index + 1}`}
            class="w-full h-full object-cover"
          />
        }
      >
        <div class="relative w-full h-full">
          <video
            ref={videoRef}
            src={props.item.src}
            class="w-full h-full object-cover"
            muted={props.isMuted}
            playsinline
            onEnded={() => props.onComplete()}
          />
        </div>
      </Show>
      <div class="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />
    </div>
  );
}

export default function TeamCarousel(props: TeamCarouselProps) {
  const [currentIndex, setCurrentIndex] = createSignal(0);
  const [isPaused, setIsPaused] = createSignal(false);
  const [isMuted, setIsMuted] = createSignal(true);

  const items = () =>
    props.items && props.items.length > 0
      ? [...props.items].sort((a, b) => a.priority - b.priority)
      : [];

  const goTo = (index: number) => {
    setCurrentIndex(index);
  };

  const togglePause = () => {
    setIsPaused(!isPaused());
  };

  const next = () => {
    setCurrentIndex((prev) => (prev + 1) % items().length);
  };

  const prev = () => {
    setCurrentIndex((prev) => (prev - 1 + items().length) % items().length);
  };

  let timer: ReturnType<typeof setTimeout>;

  const startTimer = () => {
    clearTimeout(timer);
    if (isPaused() || items().length <= 1) return;

    const currentItem = items()[currentIndex()];
    if (currentItem.type === "img") {
      timer = setTimeout(next, 5000);
    }
  };

  onMount(() => {
    createEffect(() => {
      startTimer();
    });
    onCleanup(() => clearTimeout(timer));
  });

  return (
    <section class=" bg-bg-0">
      <div class="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        <Show
          when={props.isTeamCarousel}
        >
          <div class="mb-12">
            <p class="text-sm font-bold font-mono tracking-[0.2em] text-fg-1 uppercase mb-2">
              {props.subtitle || "NSDC CORE"}
            </p>
            <h2 class="text-5xl lg:text-7xl font-sans font-bold text-fg-0 uppercase tracking-tighter">
              {props.title || "OUR TEAM"}
            </h2>
          </div>
        </Show>

        {/* Carousel Frame */}
        <div
          class="w-full max-w-5xl mx-auto relative aspect-[16/9] overflow-hidden rounded-sm bg-bg-1  border border-fg-0/5 cursor-pointer group"
          onClick={(e) => {
            if ((e.target as HTMLElement).closest("button")) return;

            const rect = e.currentTarget.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const threshold = rect.width * 0.1;

            if (x < threshold) {
              prev();
            } else if (x > rect.width - threshold) {
              next();
            } else {
              const currentItem = items()[currentIndex()];
              if (currentItem.type === "video" && isMuted()) {
                setIsMuted(false);
                setIsPaused(false);
              } else {
                togglePause();
              }
            }
          }}
          onDblClick={(e) => {
            // Double click anywhere in the middle 80% to toggle mute
            const rect = e.currentTarget.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const threshold = rect.width * 0.1;

            if (x >= threshold && x <= rect.width - threshold) {
              setIsMuted(!isMuted());
            }
          }}
        >
          {/* Navigation Triggers (Visual Indicators) */}
          <div class="absolute left-0 top-0 bottom-0 w-[10%] z-30 group/prev flex items-center justify-center pointer-events-none">
            <div class="w-12 h-12 flex items-center justify-center bg-black/40 backdrop-blur-md rounded-full text-white opacity-0 group-hover/prev:opacity-100 transition-all duration-500 scale-90 group-hover/prev:scale-100 -translate-x-2 group-hover/prev:translate-x-0">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2.5"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path d="m15 18-6-6 6-6" />
              </svg>
            </div>
          </div>
          <div class="absolute right-0 top-0 bottom-0 w-[10%] z-30 group/next flex items-center justify-center pointer-events-none">
            <div class="w-12 h-12 flex items-center justify-center bg-black/40 backdrop-blur-md rounded-full text-white opacity-0 group-hover/next:opacity-100 transition-all duration-500 scale-90 group-hover/next:scale-100 translate-x-2 group-hover/next:translate-x-0">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2.5"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path d="m9 18 6-6-6-6" />
              </svg>
            </div>
          </div>

          {/* Trigger Area Overlays for Hover (They stay transparent but catch hover for the groups above) */}
          <div class="absolute left-0 top-0 bottom-0 w-[10%] z-40 group/prev pointer-events-none" />
          <div class="absolute right-0 top-0 bottom-0 w-[20%] z-40 group/next pointer-events-none" />

          <div class="absolute inset-y-0 left-0 w-[10%] z-30 peer/left pointer-events-auto" />
          <div class="absolute inset-y-0 right-0 w-[20%] z-30 peer/right pointer-events-auto " />

          <For each={items()}>
            {(item, index) => (
              <CarouselSlide
                item={item}
                index={index()}
                currentIndex={currentIndex()}
                isPaused={isPaused()}
                isMuted={isMuted()}
                onComplete={next}
              />
            )}
          </For>

          {/* Navigation Dots */}
          {items().length > 1 && (
            <div class="absolute bottom-6 left-6 flex gap-3 z-50 items-end">
              <For each={items()}>
                {(_, i) => {
                  const isActive = () => i() === currentIndex();
                  const showPause = () => isPaused() && isActive();

                  return (
                    <button
                      onClick={() => (isActive() ? togglePause() : goTo(i()))}
                      aria-label={`${isPaused() ? "Play" : "Pause"} slide ${i() + 1}`}
                      class={`cursor-pointer transition-all duration-500 ease-out rounded-full flex items-center justify-center overflow-hidden ${
                        showPause()
                          ? "h-6 w-12 bg-primary text-primary-fg"
                          : "h-1.5"
                      }`}
                      style={{
                        width: showPause()
                          ? "4rem"
                          : isActive()
                            ? "3rem"
                            : "0.75rem",
                        "background-color": isActive()
                          ? isPaused()
                            ? "var(--primary, #fff)"
                            : "var(--fg-0, #fff)"
                          : "rgba(255,255,255,0.2)",
                      }}
                    >
                      <Show
                        when={showPause()}
                        fallback={
                          <Show when={isActive()}>
                            {/* Visual indicator that this is the active dot */}
                            <div class="w-full h-full bg-fg-0 opacity-20" />
                          </Show>
                        }
                      >
                        <div class="flex items-center gap-1.5 px-2">
                          <svg
                            width="10"
                            height="10"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                            class="animate-in fade-in zoom-in duration-300"
                          >
                            <rect x="6" y="4" width="4" height="16" rx="1" />
                            <rect x="14" y="4" width="4" height="16" rx="1" />
                          </svg>
                          <span class="text-[9px] font-bold uppercase tracking-widest">
                            Paused
                          </span>
                        </div>
                      </Show>
                    </button>
                  );
                }}
              </For>
            </div>
          )}
        </div>

        <Show when={props.isTeamCarousel}>
          <div class="mt-8 text-center">
            <a
              href="/teams"
              class="inline-block py-4 px-10 text-xs font-bold font-mono tracking-widest uppercase bg-fg-0 text-bg-0 hover:bg-primary transition-colors duration-200"
            >
              Explore Members
            </a>
          </div>
        </Show>
      </div>
    </section>
  );
}
