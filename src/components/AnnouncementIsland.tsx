import { createSignal, onMount, onCleanup, For, createEffect, createMemo } from "solid-js";
import type { Announcement } from "../types";

interface Props {
  announcements: Announcement[];
  centered?: boolean;
}

const CONFIG = {
  rotationSpeed: 5000,
  pixelsPerSecond: 20, // Lower means slower, calmer marquee
};

export default function AnnouncementRotator(props: Props) {
  if (!props.announcements || props.announcements.length === 0) return null;

  // Ensure announcements are sorted by priority
  const sortedAnnouncements = createMemo(() => 
    [...props.announcements].sort((a, b) => a.priority - b.priority)
  );

  const [currentIndex, setCurrentIndex] = createSignal(0);
  const [expanded, setExpanded] = createSignal(false);
  const [textOpacity, setTextOpacity] = createSignal(1);

  let widgetRef: HTMLDivElement | undefined;
  let textDynamicRef: HTMLSpanElement | undefined;
  let intervalId: number | undefined;

  // Calculates if text overflows its container, and applies a calm "yoyo" CSS animation
  const applyMarquee = (el: HTMLElement | undefined) => {
    if (!el) return;
    const parent = el.parentElement;
    if (!parent) return;

    // Reset animation to calculate true natural width
    el.style.animation = "none";
    el.style.transform = "translateX(0)";

    requestAnimationFrame(() => {
      const scrollWidth = el.scrollWidth;
      const clientWidth = parent.clientWidth;

      if (scrollWidth > clientWidth) {
        const dist = scrollWidth - clientWidth + 16; // Small padding buffer
        el.style.setProperty("--scroll-dist", `-${dist}px`);

        const duration = Math.max(dist / CONFIG.pixelsPerSecond, 3);
        // Uses ease-in-out for a very gentle deceleration at edges
        el.style.animation = `yoyo-scroll ${duration}s ease-in-out infinite alternate`;
      }
    });
  };

  // Re-evaluate the dynamic text's scroll when it changes
  createEffect(() => {
    currentIndex();
    if (textDynamicRef && !expanded()) {
      setTimeout(() => applyMarquee(textDynamicRef), 50);
    }
  });

  // Re-evaluate the dropdown items' scroll when the menu expands
  createEffect(() => {
    if (expanded()) {
      setTimeout(() => {
        const els = widgetRef?.querySelectorAll(".dropdown-scroll-text");
        els?.forEach((el) => applyMarquee(el as HTMLElement));
      }, 350); // wait for CSS grid transition to reveal elements
    }
  });

  const updateText = () => {
    setTextOpacity(0);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % sortedAnnouncements().length);
      setTimeout(() => {
        setTextOpacity(1);
      }, 50);
    }, 300);
  };

  const rotate = () => {
    if (expanded()) return;
    updateText();
  };

  const startTimer = () => {
    if (sortedAnnouncements().length > 1 && !intervalId) {
      intervalId = window.setInterval(rotate, CONFIG.rotationSpeed);
    }
  };

  const toggleExpanded = (open: boolean) => {
    setExpanded(open);
    if (intervalId) {
      clearInterval(intervalId);
      intervalId = undefined;
    }
    if (!open) {
      startTimer();
    }
  };

  onMount(() => {
    startTimer();

    // Use ResizeObserver to reliably adjust marquee if user resizes window
    const ro = new ResizeObserver(() => {
      if (textDynamicRef && !expanded()) applyMarquee(textDynamicRef);
      if (expanded() && widgetRef) {
        widgetRef
          .querySelectorAll(".dropdown-scroll-text")
          .forEach((el) => applyMarquee(el as HTMLElement));
      }
    });
    if (widgetRef) ro.observe(widgetRef);

    const handleClickOutside = (e: MouseEvent) => {
      if (
        expanded() &&
        window.matchMedia("(max-width: 767px)").matches &&
        widgetRef &&
        !widgetRef.contains(e.target as Node)
      ) {
        toggleExpanded(false);
      }
    };

    document.addEventListener("click", handleClickOutside);
    onCleanup(() => {
      ro.disconnect();
      if (intervalId) clearInterval(intervalId);
      document.removeEventListener("click", handleClickOutside);
    });
  });

  return (
    <>
      <div
        class={`w-full max-w-full mb-6 pointer-events-auto md:mb-8 relative z-30 flex ${props.centered ? "justify-center" : "justify-start"}`}
      >
        <div
          ref={widgetRef}
          class="relative flex flex-col w-full max-w-sm"
          onMouseEnter={() => {
            if (window.matchMedia("(min-width: 768px)").matches)
              toggleExpanded(true);
          }}
          onMouseLeave={() => {
            if (window.matchMedia("(min-width: 768px)").matches)
              toggleExpanded(false);
          }}
        >
          {/* MAIN PILL */}
          <button
            class="relative z-20 w-full inline-flex items-center justify-between pl-4 pr-10 py-2 rounded-full border border-bg-2 bg-bg-1  cursor-pointer text-left group transition-all duration-300 animate-glow overflow-hidden"
            onClick={() => {
              if (window.matchMedia("(max-width: 767px)").matches)
                toggleExpanded(!expanded());
            }}
          >
            <div class="relative px-2 overflow-hidden flex-1 min-w-0 mr-2">
              <div class="grid grid-cols-1 grid-rows-1 items-center">
                <span
                  ref={textDynamicRef}
                  class="col-start-1 row-start-1 block whitespace-nowrap text-sm  font-medium font-sans text-fg-0 transition-opacity duration-500 ease-out"
                  style={{
                    opacity: textOpacity(),
                    visibility: expanded() ? "hidden" : "visible",
                  }}
                >
                  {sortedAnnouncements()[currentIndex()].title}
                </span>

                <span
                  class="col-start-1 row-start-1 block whitespace-nowrap text-xs md:text-sm font-bold font-sans text-primary transition-opacity duration-300 ease-out pointer-events-none"
                  style={{ visibility: expanded() ? "visible" : "hidden" }}
                  aria-hidden="true"
                >
                  Announcements
                </span>
              </div>
            </div>

            <div class="absolute right-1 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-full bg-bg-0/10 backdrop-blur-sm text-fg-0 z-20">
              <svg
                class="w-4 h-4 transition-transform duration-300"
                style={{
                  transform: expanded() ? "rotate(90deg)" : "rotate(0deg)",
                }}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                stroke-width="2"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
                />
              </svg>
            </div>
          </button>

          {/* DROPDOWN ITEMS */}
          <div
            class="grid transition-[grid-template-rows] duration-500 ease-[cubic-bezier(0.25,0.8,0.25,1)] w-full"
            style={{ "grid-template-rows": expanded() ? "1fr" : "0fr" }}
          >
            <div class="overflow-hidden w-full">
              {/* Changed flex layout to stretch its children to 100% full width */}
              <div
                class="pt-3 flex flex-col gap-2 items-stretch transition-opacity duration-300 delay-75 w-full"
                style={{ opacity: expanded() ? 1 : 0 }}
              >
                <For each={sortedAnnouncements()}>
                  {(item) => (
                    <a
                      href={item.link || "#"}
                      target="_blank"
                      class="group/item relative w-full inline-flex items-center pl-5 pr-12 py-2 rounded-full border border-bg-2 bg-bg-1/95 backdrop-blur-sm hover:border-fg-1 hover:bg-bg-1 text-xs md:text-sm font-medium font-sans text-fg-0 transition-all duration-200  overflow-hidden"
                    >
                      <div class="relative px-2 overflow-hidden flex-1 min-w-0">
                        <span class="dropdown-scroll-text block whitespace-nowrap">
                          {item.title}
                        </span>
                      </div>

                      <div class="absolute right-1 top-1/2 -translate-y-1/2 w-7 h-7 flex items-center justify-center rounded-full bg-bg-0/10 backdrop-blur-sm text-fg-1 group-hover/item:text-primary group-hover/item:bg-primary/10 transition-all group-hover/item:-rotate-45">
                        <svg
                          class="w-3 h-3"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          stroke-width="2"
                        >
                          <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
                          />
                        </svg>
                      </div>
                    </a>
                  )}
                </For>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes glow {
          0%, 100% {
            border-color: var(--bg-2);
            box-shadow: 0 0 0 0 rgba(var(--primary), 0);
          }
          50% {
            border-color: var(--primary);
            box-shadow: 0 0 12px -2px var(--color-bg-2);
          }
        }
        .animate-glow {
          animation: glow 3s infinite ease-in-out;
        }
        .animate-glow:hover,
        .animate-glow:focus-within {
          animation: none;
          border-color: var(--fg-1);
        }
        
        /* The calm auto-scroll keyframe */
        @keyframes yoyo-scroll {
          0%, 15% { transform: translateX(0); }
          85%, 100% { transform: translateX(var(--scroll-dist)); }
        }
      `}</style>
    </>
  );
}
