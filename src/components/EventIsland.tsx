import {
  createSignal,
  onMount,
  onCleanup,
  For,
  Show,
  createMemo,
  createEffect,
} from "solid-js";
import type { Event } from "../types";
import { parseEventDate } from "../lib/date-utils";
import Dropdown from "./ui/Dropdown";

interface Props {
  events: Event[];
  isMinimal?: boolean;
}

export default function EventsIsland(props: Props) {
  const [filter, setFilter] = createSignal("all");
  const [sort, setSort] = createSignal("newest");
  const [searchQuery, setSearchQuery] = createSignal("");
  const [activeIndex, setActiveIndex] = createSignal(0);

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "TBA";
    const ts = parseEventDate(dateStr);
    if (ts === 0) return dateStr;
    return new Date(ts).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const processedData = createMemo(() => {
    const now = new Date().getTime();
    const oneYearAgo = now - 365 * 24 * 60 * 60 * 1000;

    const mappedEvents = props.events.map((e) => {
      const ts = parseEventDate(e.date);
      let status = "past";

      if (e.metadata?.hero_config) {
        const start = new Date(e.metadata.hero_config.start_date).getTime();
        if (now < start) status = "upcoming";
      } else if (ts >= now) {
        status = "upcoming";
      } else if (ts >= oneYearAgo) {
        status = "recent";
      }

      const meta = e.metadata || {};
      const hasDetails = !!(
        (meta.rounds && meta.rounds.length > 0) ||
        (meta.prizes && meta.prizes.length > 0) ||
        (meta.fees && meta.fees.length > 0) ||
        (meta.contacts && meta.contacts.length > 0) ||
        (meta.collaborators && meta.collaborators.length > 0)
      );

      return { ...e, computedStatus: status, ts, hasDetails };
    });

    let filtered = mappedEvents;

    if (!props.isMinimal) {
      if (filter() !== "all") {
        filtered = mappedEvents.filter((e) => e.computedStatus === filter());
      }

      if (searchQuery().trim()) {
        const q = searchQuery().trim().toLowerCase();
        filtered = filtered.filter(
          (e) =>
            e.title.toLowerCase().includes(q) ||
            e.description?.toLowerCase().includes(q) ||
            e.tags?.some((t) => t.toLowerCase().includes(q)) ||
            e.venue?.toLowerCase().includes(q),
        );
      }
    }

    const sorted = filtered.sort((a, b) => {
      if (sort() === "newest") return b.ts - a.ts;
      return a.ts - b.ts;
    });

    return props.isMinimal ? sorted.slice(0, 2) : sorted;
  });

  const groupOrder = createMemo(() => {
    return sort() === "newest"
      ? ["upcoming", "recent", "past"]
      : ["past", "recent", "upcoming"];
  });

  const activeItem = () =>
    processedData()[activeIndex()] || { title: "No Event", id: 0 };

  let isProgrammaticScroll = false;
  let scrollTimeout: any = null;
  let desktopNavRef: HTMLDivElement | undefined;
  let mobileNavRef: HTMLDivElement | undefined;

  createEffect(() => {
    const currentIdx = activeIndex();
    const currentItem = processedData()[currentIdx];

    if (!currentItem && currentIdx !== processedData().length) return;

    if (mobileNavRef) {
      const navId = currentItem ? currentItem.id : "view-all";
      const el = mobileNavRef.querySelector(
        `[data-nav="${navId}"]`,
      ) as HTMLElement;
      if (el) {
        const center =
          el.offsetLeft + el.offsetWidth / 2 - mobileNavRef.clientWidth / 2;
        mobileNavRef.scrollTo({ left: center, behavior: "smooth" });
      }
    }

    if (desktopNavRef && currentItem) {
      const el = desktopNavRef.querySelector(
        `[data-nav="${currentItem.id}"]`,
      ) as HTMLElement;
      if (el) {
        const center =
          el.offsetTop - desktopNavRef.clientHeight / 2 + el.clientHeight / 2;
        desktopNavRef.scrollTo({ top: center, behavior: "smooth" });
      }
    }

    if (isProgrammaticScroll) {
      const scrollId = currentItem
        ? `event-${currentItem.id}`
        : `event-view-all`;
      const el = document.getElementById(scrollId);
      if (el) {
        const isDesktop = window.matchMedia("(min-width: 1024px)").matches;
        let mobileOffset = 250;
        if (!isDesktop) {
          const headerEl = document.querySelector(".lg\\:hidden.sticky");
          if (headerEl) mobileOffset = headerEl.clientHeight + 40;
        }
        const offset = isDesktop ? 80 : mobileOffset;
        const top =
          el.getBoundingClientRect().top + window.pageYOffset - offset;
        window.scrollTo({ top, behavior: "smooth" });
      }
    }
  });

  const handleNavClick = (e: MouseEvent, index: number) => {
    e.preventDefault();
    isProgrammaticScroll = true;
    if (scrollTimeout) clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(() => {
      isProgrammaticScroll = false;
    }, 1000);
    setActiveIndex(index);
  };

  onMount(() => {
    const verticalObserver = new IntersectionObserver(
      (entries) => {
        if (isProgrammaticScroll) return;

        // Find the entry that is closest to the top of the viewport
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => {
            // Priority given to entries that are more visible and closer to viewport top
            return b.intersectionRatio - a.intersectionRatio;
          })[0];

        if (visible?.target) {
          const idx = parseInt(
            (visible.target as HTMLElement).dataset.index || "-1",
          );
          if (idx !== -1 && idx !== activeIndex()) {
            setActiveIndex(idx);
          }
        }
      },
      {
        threshold: [0, 0.1, 0.5, 1.0],
        rootMargin: "-15% 0px -75% 0px",
      },
    );

    let observedElements: Element[] = [];

    const observeElements = () => {
      observedElements.forEach((el) => verticalObserver.unobserve(el));
      observedElements = Array.from(
        document.querySelectorAll(".event-section-item"),
      );
      observedElements.forEach((el) => verticalObserver.observe(el));
    };

    observeElements();

    const interval = setInterval(observeElements, 1000);
    onCleanup(() => {
      clearInterval(interval);
      verticalObserver.disconnect();
    });
  });

  const dropdownButtonClass =
    "w-full flex items-center justify-between border border-fg-0/40 px-2 py-2 bg-bg-0 text-fg-0 text-xs font-bold uppercase tracking-widest hover:border-primary transition-colors cursor-pointer";
  const dropdownMenuClass =
    "absolute left-0 top-full mt-1 z-50 bg-bg-0 border border-fg-0/40 w-full shadow-xl text-[10px] font-bold uppercase tracking-widest";

  return (
    <div
      class={`bg-bg-0 md:pt-16 text-fg-0 font-sans ${props.isMinimal ? "min-h-0 py-12" : "min-h-screen"}`}
    >
      {/* Mobile Sticky Header */}
      <div class="lg:hidden sticky top-8 z-40 bg-bg-0/95 backdrop-blur-md border-b-2 border-fg-0 flex flex-col shadow-sm">
        <div class="flex flex-col gap-3 p-4 border-b border-fg-0/10">
          <div class="flex justify-between items-center">
            <h1 class="text-2xl font-bold uppercase tracking-tighter">
              {props.isMinimal ? "Featured Events" : "Events"}
            </h1>
            <Show when={!props.isMinimal}>
              <span class="text-[10px] font-bold uppercase tracking-widest text-primary">
                {processedData().length} Results
              </span>
            </Show>
          </div>

          {/* Search & Filters - Hidden in Minimal Mode */}
          <Show when={!props.isMinimal}>
            <div class="flex flex-col gap-2 relative z-50">
              <input
                type="text"
                placeholder="Search events..."
                class="bg-bg-1 border border-fg-0/10 text-xs font-bold uppercase tracking-widest p-2 w-full outline-none focus:border-primary transition-colors text-fg-0 placeholder:text-fg-1/50"
                value={searchQuery()}
                onInput={(e) => {
                  setSearchQuery(e.currentTarget.value);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
              />
              <div class="flex gap-2">
                <Dropdown
                  options={[
                    { id: "all", label: "All" },
                    { id: "upcoming", label: "Upcoming" },
                    { id: "recent", label: "Recent" },
                    { id: "past", label: "Past" },
                  ]}
                  selectedId={filter()}
                  onSelect={(id) => {
                    setFilter(id as string);
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  buttonClass={dropdownButtonClass}
                  menuClass={dropdownMenuClass}
                />
                <Dropdown
                  options={[
                    { id: "newest", label: "Newest" },
                    { id: "oldest", label: "Oldest" },
                  ]}
                  selectedId={sort()}
                  onSelect={(id) => {
                    setSort(id as string);
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  buttonClass={dropdownButtonClass}
                  menuClass={dropdownMenuClass}
                />
              </div>
            </div>
          </Show>
        </div>

        <div class="flex justify-between items-center h-[48px] px-2 bg-bg-0 w-full relative z-40">
          <div
            ref={mobileNavRef}
            class="flex gap-1 h-full text-sm overflow-x-auto scrollbar-hide py-2 max-w-[65%]"
          >
            <For each={processedData()}>
              {(item, index) => (
                <a
                  data-nav={item.id}
                  onClick={(e) => handleNavClick(e, index())}
                  class={`mobile-nav-item font-mono transition-colors duration-200 px-3 flex items-center justify-center text-[10px] border text-nowrap shrink-0 cursor-pointer ${
                    activeIndex() === index()
                      ? "bg-fg-0 text-bg-0 border-fg-0 font-bold"
                      : "bg-bg-0 text-fg-1 border-transparent hover:border-fg-0/30 hover:text-fg-0"
                  }`}
                >
                  {String(index() + 1).padStart(2, "0")}
                </a>
              )}
            </For>
            <Show when={props.isMinimal}>
              <a
                href="/events"
                data-nav="view-all"
                onClick={(e) => handleNavClick(e, processedData().length)}
                class={`mobile-nav-item font-mono transition-colors duration-200 px-3 flex items-center justify-center text-[10px] border shrink-0 cursor-pointer ${
                  activeIndex() === processedData().length
                    ? "bg-fg-0 text-bg-0 border-fg-0 font-bold"
                    : "bg-bg-0 text-primary border-transparent hover:border-fg-0/30"
                }`}
              >
                View All
              </a>
            </Show>
          </div>
          <div class="flex flex-col items-end justify-center text-right pl-3 overflow-hidden flex-1 border-l border-fg-0/10 h-full">
            <h3 class="font-bold text-fg-0 uppercase tracking-tight truncate w-full text-right text-xl">
              {activeIndex() === processedData().length
                ? "All Events"
                : processedData().length > 0
                  ? activeItem().title
                  : ""}
            </h3>
          </div>
        </div>
      </div>

      <section class=" bg-bg-0 transition-colors duration-300">
        <div class="container mx-auto px-4 sm:px-6 lg:px-8">
          <div class="grid grid-cols-1 lg:grid-cols-12 gap-12">
            {/* Desktop Sidebar */}
            <div class="hidden lg:block lg:col-span-3">
              <div class="sticky top-24 max-h-[calc(100vh-8rem)] flex flex-col">
                <h1 class="text-4xl md:text-5xl font-bold text-fg-0 uppercase tracking-tighter leading-tight mb-8">
                  {props.isMinimal ? "Featured Events" : "Events"}
                </h1>

                <Show when={!props.isMinimal}>
                  <div class="flex flex-col gap-4 mb-6 border-b-2 border-fg-0/10 pb-6 pr-2">
                    <div class="flex flex-col gap-1 w-full">
                      <label class="text-[9px] font-bold uppercase tracking-[0.2em] text-fg-1">
                        Search
                      </label>
                      <input
                        type="text"
                        placeholder="Title, venue, tags..."
                        class="bg-bg-0 border border-fg-0/40 text-xs font-bold uppercase tracking-widest p-2 outline-none focus:border focus:border-primary transition-all w-full placeholder:text-fg-1/40"
                        value={searchQuery()}
                        onInput={(e) => {
                          setSearchQuery(e.currentTarget.value);
                          window.scrollTo({ top: 0, behavior: "smooth" });
                        }}
                      />
                    </div>
                    <div class="flex flex-col gap-1 w-full">
                      <label class="text-[9px] font-bold uppercase tracking-[0.2em] text-fg-1">
                        Filter
                      </label>
                      <Dropdown
                        options={[
                          { id: "all", label: "All Events" },
                          { id: "upcoming", label: "Upcoming" },
                          { id: "recent", label: "Recent" },
                          { id: "past", label: "Past" },
                        ]}
                        selectedId={filter()}
                        onSelect={(id) => {
                          setFilter(id as string);
                          window.scrollTo({ top: 0, behavior: "smooth" });
                        }}
                        buttonClass={dropdownButtonClass}
                        menuClass={dropdownMenuClass}
                      />
                    </div>
                    <div class="flex flex-col gap-1 w-full">
                      <label class="text-[9px] font-bold uppercase tracking-[0.2em] text-fg-1">
                        Sort by
                      </label>
                      <Dropdown
                        options={[
                          { id: "newest", label: "Newest First" },
                          { id: "oldest", label: "Oldest First" },
                        ]}
                        selectedId={sort()}
                        onSelect={(id) => {
                          setSort(id as string);
                          window.scrollTo({ top: 0, behavior: "smooth" });
                        }}
                        buttonClass={dropdownButtonClass}
                        menuClass={dropdownMenuClass}
                      />
                    </div>
                  </div>
                </Show>

                <div
                  class="flex-1 overflow-y-auto scrollbar-hide pr-2 pb-8"
                  ref={desktopNavRef}
                >
                  <ul class="flex flex-col gap-4 border-l-2 border-bg-2">
                    <For each={groupOrder()}>
                      {(group) => {
                        const items = createMemo(() =>
                          processedData()
                            .map((item, index) => ({
                              item,
                              globalIndex: index,
                            }))
                            .filter((x) => x.item.computedStatus === group),
                        );

                        return (
                          <Show when={items().length > 0}>
                            <li>
                              <div class="py-1 pl-4 border-l-2 border-transparent -ml-[2px] text-[10px] font-bold uppercase tracking-[0.2em] text-fg-1/70 mb-2">
                                {group}
                              </div>
                              <ul class="flex flex-col">
                                <For each={items()}>
                                  {({ item, globalIndex }) => (
                                    <li>
                                      <a
                                        data-nav={item.id}
                                        onClick={(e) =>
                                          handleNavClick(e, globalIndex)
                                        }
                                        class={`desktop-nav-link flex items-center gap-3 py-1.5 pl-4 border-l-2 -ml-[2px] transition-all cursor-pointer group ${
                                          activeIndex() === globalIndex
                                            ? "border-fg-0 font-bold text-fg-0"
                                            : "border-transparent text-fg-1 hover:border-fg-0/30 hover:text-fg-0"
                                        }`}
                                      >
                                        <span
                                          class={`text-[9px] font-mono shrink-0 w-[20px] ${activeIndex() === globalIndex ? "text-primary" : "text-fg-1/40 group-hover:text-fg-1"}`}
                                        >
                                          {String(globalIndex + 1).padStart(
                                            2,
                                            "0",
                                          )}
                                        </span>
                                        <span
                                          class={`text-[10px] font-bold uppercase tracking-wider truncate ${activeIndex() === globalIndex ? "text-fg-0" : "text-fg-1/80 group-hover:text-fg-0"}`}
                                        >
                                          {item.title}
                                        </span>
                                      </a>
                                    </li>
                                  )}
                                </For>
                              </ul>
                            </li>
                          </Show>
                        );
                      }}
                    </For>
                  </ul>
                </div>

                <Show when={props.isMinimal}>
                  <div class="pt-6 border-t-2 border-fg-0/10">
                    <a
                      href="/events"
                      class="relative group w-max inline-block font-bold font-sans text-fg-1 hover:text-fg-0 transition-colors duration-200 text-xs uppercase tracking-widest"
                    >
                      <span>View All Events</span>
                      <span class="absolute bottom-0 right-0 h-[1px] w-full bg-fg-0 transform scale-x-0 origin-right transition-transform duration-300 ease-out group-hover:scale-x-100 group-hover:origin-left" />
                    </a>
                  </div>
                </Show>
              </div>
            </div>

            {/* Main Content Area */}
            <div class="lg:col-span-9 flex flex-col min-h-[50vh]">
              <Show when={!props.isMinimal}>
                <div class="w-full flex justify-between items-center mb-6 pt-2 md:pt-0">
                  <p class="text-[10px] font-mono font-bold uppercase tracking-widest text-fg-1">
                    Showing {processedData().length} results
                  </p>
                </div>
              </Show>

              <div class="flex flex-col">
                <For each={groupOrder()}>
                  {(group) => {
                    const groupEvents = createMemo(() =>
                      processedData().filter((e) => e.computedStatus === group),
                    );

                    return (
                      <Show when={groupEvents().length > 0}>
                        <div class="flex flex-col gap-6">
                          <Show when={!props.isMinimal}>
                            <div class="sticky top-[180px] lg:top-10 z-30 bg-bg-0 py-2">
                              <div class="flex items-center gap-4 border-b-2 border-fg-0/10">
                                <h2 class="text-2xl font-bold uppercase tracking-widest text-fg-0 pb-2">
                                  {group}
                                </h2>
                              </div>
                            </div>
                          </Show>

                          <div class="flex flex-col">
                            <For each={groupEvents()}>
                              {(event) => {
                                const index = createMemo(() =>
                                  processedData().findIndex(
                                    (e) => e.id === event.id,
                                  ),
                                );
                                const isPast = event.computedStatus === "past";
                                const isUpcoming =
                                  event.computedStatus === "upcoming";

                                return (
                                  <div
                                    class={`event-section-item flex flex-col border-1 border-fg-0/40 rounded w-full relative mb-8 z-10 transition-all overflow-hidden ${isPast ? "opacity-90 grayscale-[15%]" : ""} bg-bg-0`}
                                    id={`event-${event.id}`}
                                    data-index={index()}
                                  >
                                    <Show
                                      when={!event.custom_html}
                                      fallback={
                                        <div
                                          class="relative z-10 w-full"
                                          innerHTML={event.custom_html!}
                                        />
                                      }
                                    >
                                      <Show when={event.image_url}>
                                        <div class="absolute inset-0 z-0 overflow-hidden pointer-events-none opacity-50 flex items-center justify-center">
                                          <img
                                            src={event.image_url as string}
                                            class={`w-[150%] h-[150%] max-w-none object-cover blur-[60px] saturate-300 ${isUpcoming && "animate-spin-slow"} rounded-full`}
                                            alt=""
                                          />
                                        </div>
                                      </Show>
                                      <div
                                        class={`absolute inset-0 backdrop-blur-[30px] ${isUpcoming ? "bg-bg-0/10" : "bg-bg-0/70"} z-0 pointer-events-none`}
                                      />
                                      <div class="grid md:grid-cols-2 relative z-10">
                                        <div class="p-4 md:pr-0 overflow-hidden aspect-square">
                                          <Show
                                            when={event.image_url}
                                            fallback={
                                              <div class="w-full h-full flex items-center justify-center text-fg-1/20 font-sans font-bold text-6xl uppercase tracking-tighter">
                                                NSDC
                                              </div>
                                            }
                                          >
                                            <img
                                              src={event.image_url as string}
                                              alt={event.title}
                                              class="w-full h-full transition-transform duration-700"
                                            />
                                          </Show>
                                        </div>

                                        <div class="flex flex-col p-6">
                                          <div class="flex items-center gap-3 mb-6 flex-wrap">
                                            <span
                                              class={`text-xs font-mono font-bold uppercase tracking-widest ${event.computedStatus === "upcoming" ? "text-primary" : "text-fg-1"}`}
                                            >
                                              {formatDate(event.date)}
                                            </span>
                                            <span class="w-[4px] h-[4px] bg-fg-0/20 rounded-full"></span>
                                            {event.venue && (
                                              <span class="text-xs font-mono font-bold text-fg-1 uppercase tracking-widest">
                                                {event.venue}
                                              </span>
                                            )}
                                            {event.event_type && (
                                              <span class="text-[9px] font-bold bg-primary text-primary-fg px-2 py-[2px] rounded-sm uppercase tracking-wider ml-auto">
                                                {event.event_type}
                                              </span>
                                            )}
                                          </div>

                                          <h3 class="font-bold text-fg-0 uppercase tracking-tighter mb-4 text-3xl xl:text-4xl leading-[1.1]">
                                            {event.title}
                                          </h3>

                                          <Show when={event.description}>
                                            <p class="text-sm xl:text-base text-fg-1 font-sans leading-relaxed mb-8 line-clamp-4 opacity-80">
                                              {event.description}
                                            </p>
                                          </Show>

                                          <div class="flex gap-4 mt-auto border-t-2 border-fg-0/10 pt-6">
                                            <a
                                              href={`/event/${event.id}`}
                                              class="relative group text-xs font-bold uppercase tracking-widest text-fg-0 hover:text-primary transition-colors py-2"
                                            >
                                              <span>
                                                {event.button_text ||
                                                  "View Details"}
                                              </span>
                                              <span class="absolute bottom-0 right-0 h-[2px] w-full bg-primary transform scale-x-0 origin-right transition-transform duration-300 ease-out group-hover:scale-x-100 group-hover:origin-left" />
                                            </a>
                                            <Show when={event.report_url}>
                                              <a
                                                href={`/report/${event.id}`}
                                                class="relative group text-xs font-bold uppercase tracking-widest text-fg-1 hover:text-fg-0 transition-colors py-2 pl-4 border-l-2 border-bg-2"
                                              >
                                                <span>Read Report</span>
                                                <span class="absolute bottom-0 right-0 h-[2px] w-full bg-fg-0 transform scale-x-0 origin-right transition-transform duration-300 ease-out group-hover:scale-x-100 group-hover:origin-left" />
                                              </a>
                                            </Show>
                                          </div>
                                        </div>
                                      </div>
                                    </Show>
                                  </div>
                                );
                              }}
                            </For>

                            {/* Custom View All Card for Minimal Mode */}
                            <Show
                              when={
                                props.isMinimal &&
                                group === groupOrder()[groupOrder().length - 1]
                              }
                            >
                              <a
                                id="event-view-all"
                                data-index={processedData().length}
                                href="/events"
                                class="event-section-item flex flex-col items-center justify-center w-full h-32 md:h-40 bg-primary text-primary-fg hover:bg-fg-0 transition-colors mb-8 rounded-sm shadow-lg shadow-primary/10 group px-4 relative z-10"
                              >
                                <span class="text-xl md:text-2xl font-black uppercase tracking-widest text-center">
                                  View All Events
                                </span>
                                <div class="flex items-center gap-2 mt-2 opacity-80 group-hover:opacity-100 transition-opacity">
                                  <span class="text-[9px] md:text-[10px] font-bold uppercase tracking-[0.15em] text-center">
                                    Explore all events conducted by NSDC
                                  </span>
                                  <svg
                                    class="w-4 h-4 md:w-5 md:h-5 transition-transform duration-300 group-hover:translate-x-2 shrink-0"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                  >
                                    <path
                                      stroke-linecap="round"
                                      stroke-linejoin="round"
                                      stroke-width="2.5"
                                      d="M17 8l4 4m0 0l-4 4m4-4H3"
                                    />
                                  </svg>
                                </div>
                              </a>
                            </Show>
                          </div>
                        </div>
                      </Show>
                    );
                  }}
                </For>

                <Show when={processedData().length === 0 && !props.isMinimal}>
                  <div class="w-full flex items-center justify-center p-12 border-2 border-fg-0 bg-bg-1">
                    <p class="font-bold uppercase tracking-widest text-fg-1">
                      No events found matching your filter.
                    </p>
                  </div>
                </Show>
              </div>
            </div>
          </div>
        </div>
      </section>
      <style>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
        select { -webkit-appearance: none; -moz-appearance: none; text-indent: 1px; text-overflow: ''; }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spin 30s linear infinite;
        }
      `}</style>
    </div>
  );
}
