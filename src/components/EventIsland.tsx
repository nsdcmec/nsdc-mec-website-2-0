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

interface Props {
  events: Event[];
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

    const sorted = filtered.sort((a, b) => {
      if (sort() === "newest") return b.ts - a.ts;
      return a.ts - b.ts;
    });

    return sorted;
  });

  const activeItem = () =>
    processedData()[activeIndex()] || { title: "No Event", id: 0 };

  let isProgrammaticScroll = false;
  let scrollTimeout: any = null;
  let desktopNavRef: HTMLDivElement | undefined;
  let mobileNavRef: HTMLDivElement | undefined;

  createEffect((prevIdx: number | undefined) => {
    const currentIdx = activeIndex();
    const currentItem = processedData()[currentIdx];

    if (!currentItem) return currentIdx;

    if (mobileNavRef) {
      const el = mobileNavRef.querySelector(
        `[data-nav="${currentItem.id}"]`,
      ) as HTMLElement;
      if (el) {
        const center =
          el.offsetLeft + el.offsetWidth / 2 - mobileNavRef.clientWidth / 2;
        mobileNavRef.scrollTo({ left: center, behavior: "smooth" });
      }
    }

    if (desktopNavRef) {
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
      const el = document.getElementById(`event-${currentItem.id}`);
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

    return currentIdx;
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
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

        if (visible?.target) {
          const idx = parseInt(
            (visible.target as HTMLElement).dataset.index || "-1",
          );
          if (idx !== -1 && idx !== activeIndex()) setActiveIndex(idx);
        }
      },
      { rootMargin: "-30% 0px -40% 0px" },
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

    // Quick hack to re-observe when solid renders new elements
    const interval = setInterval(observeElements, 1000);
    onCleanup(() => clearInterval(interval));
  });

  return (
    <div class="bg-bg-0 md:pt-16 min-h-screen text-fg-0 font-sans">
      {/* Mobile Sticky Header */}
      <div class="lg:hidden sticky top-8 z-40 bg-bg-0/95 backdrop-blur-md border-b-2 border-fg-0 flex flex-col shadow-sm">
        <div class="flex flex-col gap-3 p-4 border-b border-fg-0/10">
          <div class="flex justify-between items-center">
            <h1 class="text-2xl font-bold uppercase tracking-tighter">
              Events
            </h1>
            <span class="text-[10px] font-bold uppercase tracking-widest text-primary">
              {processedData().length} Results
            </span>
          </div>

          {/* Search & Filters */}
          <div class="flex flex-col gap-2 relative z-50">
            <input
              type="text"
              placeholder="Search events..."
              class="bg-bg-1 border border-fg-0/10 text-xs font-bold uppercase tracking-widest p-2 w-full outline-none focus:border-primary transition-colors text-fg-0 placeholder:text-fg-1/50"
              value={searchQuery()}
              onInput={(e) => {
                setSearchQuery(e.target.value);
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
            />
            <div class="flex gap-2">
              <select
                class="bg-bg-1 border border-fg-0/10 text-xs font-bold uppercase p-2 flex-1 outline-none focus:border-primary appearance-none transition-colors text-fg-0"
                value={filter()}
                onChange={(e) => {
                  setFilter(e.target.value);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
              >
                <option value="all">All</option>
                <option value="upcoming">Upcoming</option>
                <option value="recent">Recent</option>
                <option value="past">Past</option>
              </select>
              <select
                class="bg-bg-1 border border-fg-0/10 text-xs font-bold uppercase p-2 flex-1 outline-none focus:border-primary appearance-none transition-colors text-fg-0"
                value={sort()}
                onChange={(e) => {
                  setSort(e.target.value);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
              >
                <option value="newest">Newest</option>
                <option value="oldest">Oldest</option>
              </select>
            </div>
          </div>
        </div>

        {/* Mobile Nav Scroll (spy index) */}
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
            <Show when={processedData().length === 0}>
              <span class="text-[10px] font-bold uppercase text-fg-1 tracking-widest py-1 flex items-center">
                No Events
              </span>
            </Show>
          </div>
          <div class="flex flex-col items-end justify-center text-right pl-3 overflow-hidden flex-1 border-l border-fg-0/10 h-full">
            <h3 class="font-bold text-fg-0 uppercase tracking-tight truncate w-full text-right text-xl">
              {processedData().length > 0 ? activeItem().title : ""}
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
                <h1 class="text-4xl md:text-6xl font-bold text-fg-0 uppercase tracking-tighter leading-tight mb-8">
                  Events
                </h1>

                {/* Search & Sort Area */}
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
                        setSearchQuery(e.target.value);
                        window.scrollTo({ top: 0, behavior: "smooth" });
                      }}
                    />
                  </div>
                  <div class="flex flex-col gap-1 w-full">
                    <label class="text-[9px] font-bold uppercase tracking-[0.2em] text-fg-1">
                      Filter
                    </label>
                    <select
                      class="bg-bg-0 border border-fg-0/40 text-xs font-bold uppercase tracking-widest p-2 outline-none focus:border focus:border-primary transition-all cursor-pointer appearance-none"
                      value={filter()}
                      onChange={(e) => {
                        setFilter(e.target.value);
                        window.scrollTo({ top: 0, behavior: "smooth" });
                      }}
                    >
                      <option value="all">All Events</option>
                      <option value="upcoming">Upcoming</option>
                      <option value="recent">Recent</option>
                      <option value="past">Past</option>
                    </select>
                  </div>
                  <div class="flex flex-col gap-1 w-full">
                    <label class="text-[9px] font-bold uppercase tracking-[0.2em] text-fg-1">
                      Sort by
                    </label>
                    <select
                      class="bg-bg-0 border-[1px] border-fg-0/40 text-xs font-bold uppercase tracking-widest p-2 outline-none focus:border focus:border-primary transition-all cursor-pointer appearance-none"
                      value={sort()}
                      onChange={(e) => {
                        setSort(e.target.value);
                        window.scrollTo({ top: 0, behavior: "smooth" });
                      }}
                    >
                      <option value="newest">Newest First</option>
                      <option value="oldest">Oldest First</option>
                    </select>
                  </div>
                </div>

                {/* Sidebar Navigation grouped by status */}
                <div
                  class="flex-1 overflow-y-auto scrollbar-hide pr-2 pb-8"
                  ref={desktopNavRef}
                >
                  <ul class="flex flex-col gap-4 border-l-2 border-bg-2">
                    <For each={["upcoming", "recent", "past"]}>
                      {(group) => {
                        const items = () =>
                          processedData()
                            .map((item, index) => ({
                              item,
                              globalIndex: index,
                            }))
                            .filter((x) => x.item.computedStatus === group);

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
                                            ? "border-fg-0 font-bold text-fg-0 bg-bg-1"
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
                    <Show when={processedData().length === 0}>
                      <li class="pl-4 py-2 text-xs font-bold uppercase tracking-widest text-fg-1">
                        No items match criteria
                      </li>
                    </Show>
                  </ul>
                </div>
              </div>
            </div>

            {/* Main Content Area */}
            <div class="lg:col-span-9 flex flex-col min-h-[50vh]">
              <div class="w-full flex justify-between items-center mb-6 pt-2 md:pt-0">
                <p class="text-[10px] font-mono font-bold uppercase tracking-widest text-fg-1">
                  Showing {processedData().length} results
                </p>
                <Show when={filter() !== "all"}>
                  <span class="text-[10px] font-bold uppercase bg-fg-0 text-bg-0 px-2 py-1 tracking-widest">
                    {filter()}
                  </span>
                </Show>
              </div>

              <div class="flex flex-col  ">
                <For each={["upcoming", "recent", "past"]}>
                  {(group) => {
                    const groupEvents = () =>
                      processedData().filter((e) => e.computedStatus === group);

                    return (
                      <Show when={groupEvents().length > 0}>
                        <div class="flex flex-col gap-6">
                          {/* Sticky Header for Group */}
                          <div class="sticky top-[180px] lg:top-10 z-30 bg-bg-0 py-2 ">
                            <div class="flex items-center gap-4 border-b-2 border-fg-0/10">
                              <h2 class="text-2xl font-bold uppercase tracking-widest text-fg-0 pb-2">
                                {group}
                              </h2>
                            </div>
                          </div>

                          <div class="flex flex-col ">
                            <For each={groupEvents()}>
                              {(event) => {
                                const index = () =>
                                  processedData().findIndex(
                                    (e) => e.id === event.id,
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
                                    {/* Consistent 1:1 image area with grid md:grid-cols-2 for every card */}
                                    <div class="grid md:grid-cols-2 relative z-10">
                                      {/* Image Section */}
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

                                      {/* Content Section */}
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
                                          <Show when={event.link}>
                                            <a
                                              href={event.link || "#"}
                                              target="_blank"
                                              class="relative group text-xs font-bold uppercase tracking-widest text-fg-0 hover:text-primary transition-colors py-2"
                                            >
                                              <span>
                                                {event.button_text || "Visit"}
                                              </span>
                                              <span class="absolute bottom-0 right-0 h-[2px] w-full bg-primary transform scale-x-0 origin-right transition-transform duration-300 ease-out group-hover:scale-x-100 group-hover:origin-left" />
                                            </a>
                                          </Show>

                                          <Show when={event.report_url}>
                                            <a
                                              href={event.report_url || "#"}
                                              class="relative group text-xs font-bold uppercase tracking-widest text-fg-1 hover:text-fg-0 transition-colors py-2 pl-4 border-l-2 border-bg-2"
                                            >
                                              <span>Read Report</span>
                                              <span class="absolute bottom-0 right-0 h-[2px] w-full bg-fg-0 transform scale-x-0 origin-right transition-transform duration-300 ease-out group-hover:scale-x-100 group-hover:origin-left" />
                                            </a>
                                          </Show>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                );
                              }}
                            </For>
                          </div>
                        </div>
                      </Show>
                    );
                  }}
                </For>

                <Show when={processedData().length === 0}>
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
