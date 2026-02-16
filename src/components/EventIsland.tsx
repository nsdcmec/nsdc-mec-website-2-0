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

interface Props {
  events: Event[];
}

export default function EventsIsland(props: Props) {
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "TBA";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const processedData = createMemo(() => {
    const now = new Date().getTime();

    // Map events to include dynamic status and details check
    const mappedEvents = props.events.map((e) => {
      let status = e.status;
      // Dynamic status override from hero_config
      if (e.metadata?.hero_config) {
        const start = new Date(e.metadata.hero_config.start_date).getTime();
        if (now < start) status = "upcoming";
        else status = "past";
      }

      const meta = e.metadata || {};
      const hasDetails = !!(
        (meta.rounds && meta.rounds.length > 0) ||
        (meta.prizes && meta.prizes.length > 0) ||
        (meta.fees && meta.fees.length > 0) ||
        (meta.contacts && meta.contacts.length > 0) ||
        (meta.collaborators && meta.collaborators.length > 0)
      );

      return { ...e, status, hasDetails };
    });

    const sorted = mappedEvents.sort((a, b) => b.priority - a.priority);
    // .sort((a, b) => {
    //   const dateA = a.date ? new Date(a.date).getTime() : 0;
    //   const dateB = b.date ? new Date(b.date).getTime() : 0;
    //   return dateB - dateA;
    // });

    const archived = sorted.filter((e) => e.status === "past");
    const active = sorted.filter((e) => e.status !== "past");

    // Re-filter upcoming/recent based on dynamic status if possible,
    // or strictly by date relative to now if status is generic?
    // The previous logic used date comparison. Let's stick to date comparison for sorting/grouping
    // but use the computed status for display/filtering 'past'.

    const upcoming = active.filter(
      (e) =>
        e.status === "upcoming" ||
        (e.status !== "recent" && e.date && new Date(e.date).getTime() >= now),
    );
    const recent = active.filter(
      (e) =>
        e.status === "recent" ||
        (e.status !== "upcoming" && e.date && new Date(e.date).getTime() < now),
    );

    // De-dupe if logic overlaps (simple fallback: if in upcoming, don't put in recent)
    // Actually simpler:
    // Any active event that is 'upcoming' OR (not 'recent' AND future date) -> upcoming list
    // Rest of active -> recent list

    const sidebarList = [...upcoming, ...recent, ...archived];

    const recentStart = upcoming.length;
    const archivedStart = upcoming.length + recent.length;
    console.log(archived);

    return {
      upcoming,
      recent,
      archived,
      sidebarList,
      offsets: {
        recent: recentStart,
        archived: archivedStart,
      },
    };
  });

  const [activeIndex, setActiveIndex] = createSignal(0);

  const activeItem = () =>
    processedData().sidebarList[activeIndex()] || { title: "No Event", id: 0 };

  const archiveStatus = createMemo(() => {
    const current = activeIndex();
    const { archived: archivedStart } = processedData().offsets;
    const total = processedData().sidebarList.length;

    const isArchiveActive = current >= archivedStart;

    return {
      isActive: isArchiveActive,
      hasPrev: isArchiveActive && current > archivedStart,
      hasNext: isArchiveActive && current < total - 1,
    };
  });

  let archiveContainerRef: HTMLDivElement | undefined;
  let mobileNavRef: HTMLDivElement | undefined;
  let desktopNavRef: HTMLDivElement | undefined;

  let isProgrammaticScroll = false;
  let scrollTimeout: any = null;

  createEffect((prevIndex: number | undefined) => {
    const currentIdx = activeIndex();
    const currentItem = processedData().sidebarList[currentIdx];

    if (!currentItem) return currentIdx;

    if (mobileNavRef) {
      const el = mobileNavRef.querySelector(
        `[data-target="${currentItem.id}"]`,
      ) as HTMLElement;
      if (el) {
        const center =
          el.offsetLeft + el.offsetWidth / 2 - mobileNavRef.clientWidth / 2;
        mobileNavRef.scrollTo({ left: center, behavior: "smooth" });
      }
    }

    if (desktopNavRef) {
      const el = desktopNavRef.querySelector(
        `[data-target="${currentItem.id}"]`,
      ) as HTMLElement;
      if (el) {
        const center =
          el.offsetTop - desktopNavRef.clientHeight / 2 + el.clientHeight / 2;
        desktopNavRef.scrollTo({ top: center, behavior: "smooth" });
      }
    }

    if (isProgrammaticScroll) {
      const isDesktop = window.matchMedia("(min-width: 768px)").matches;
      const { archived: archivedStart } = processedData().offsets;

      const isArchive = currentIdx >= archivedStart;
      const wasArchive =
        prevIndex !== undefined ? prevIndex >= archivedStart : false;

      const shouldScrollVertical = !(isArchive && wasArchive);

      if (shouldScrollVertical) {
        if (isDesktop) {
          const el = document.getElementById(`event-${currentItem.id}`);
          if (el) {
            const offset = isArchive ? 176 : 88;
            const top =
              el.getBoundingClientRect().top + window.pageYOffset - offset;
            window.scrollTo({ top, behavior: "smooth" });
          }
        } else {
          if (isArchive) {
            const sectionEl = document.getElementById("past-events-section");
            if (sectionEl) {
              const offset = 178;
              const top =
                sectionEl.getBoundingClientRect().top +
                window.pageYOffset -
                offset;
              window.scrollTo({ top, behavior: "smooth" });
            }
          } else {
            const el = document.getElementById(`event-${currentItem.id}`);
            if (el) {
              const offset = 130;
              const top =
                el.getBoundingClientRect().top + window.pageYOffset - offset;
              window.scrollTo({ top, behavior: "smooth" });
            }
          }
        }
      }

      if (isArchive && archiveContainerRef) {
        const targetEl = document.getElementById(`event-${currentItem.id}`);
        if (targetEl) {
          const left =
            targetEl.offsetLeft -
            (archiveContainerRef.clientWidth - targetEl.clientWidth) / 2;
          archiveContainerRef.scrollTo({ left, behavior: "smooth" });
        }
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

  const cycleArchive = (direction: -1 | 1) => {
    const nextIndex = activeIndex() + direction;
    const { sidebarList } = processedData();

    if (nextIndex >= 0 && nextIndex < sidebarList.length) {
      isProgrammaticScroll = true;
      if (scrollTimeout) clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        isProgrammaticScroll = false;
      }, 1000);
      setActiveIndex(nextIndex);
    }
  };

  const getCenteredArchiveIndex = (container: HTMLDivElement): number => {
    const center = container.scrollLeft + container.clientWidth / 2;
    let closestIndex = -1;
    let minDiff = Infinity;

    for (let i = 0; i < container.children.length; i++) {
      const el = container.children[i] as HTMLElement;
      const itemCenter = el.offsetLeft + el.offsetWidth / 2;
      const diff = Math.abs(center - itemCenter);
      if (diff < minDiff) {
        minDiff = diff;
        closestIndex = parseInt(el.dataset.index || "-1");
      }
    }
    return closestIndex;
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
      { rootMargin: "-40% 0px -50% 0px" },
    );

    document
      .querySelectorAll(".vertical-event-section")
      .forEach((el) => verticalObserver.observe(el));

    const archiveSectionObserver = new IntersectionObserver(
      (entries) => {
        if (isProgrammaticScroll) return;
        entries.forEach((entry) => {
          if (entry.isIntersecting && archiveContainerRef) {
            const idx = getCenteredArchiveIndex(archiveContainerRef);
            if (idx !== -1 && idx !== activeIndex()) setActiveIndex(idx);
          }
        });
      },
      { rootMargin: "-40% 0px -50% 0px" },
    );
    const archiveSection = document.getElementById("past-events-section");
    if (archiveSection) archiveSectionObserver.observe(archiveSection);

    const handleHorizontalScroll = () => {
      if (isProgrammaticScroll || !archiveContainerRef || !archiveSection)
        return;
      const rect = archiveSection.getBoundingClientRect();
      if (
        rect.top < window.innerHeight / 2 &&
        rect.bottom > window.innerHeight / 2
      ) {
        const idx = getCenteredArchiveIndex(archiveContainerRef);
        if (idx !== -1 && idx !== activeIndex()) setActiveIndex(idx);
      }
    };
    archiveContainerRef?.addEventListener("scroll", handleHorizontalScroll, {
      passive: true,
    });

    onCleanup(() => {
      verticalObserver.disconnect();
      archiveSectionObserver.disconnect();
      archiveContainerRef?.removeEventListener(
        "scroll",
        handleHorizontalScroll,
      );
      if (scrollTimeout) clearTimeout(scrollTimeout);
    });
  });

  return (
    <section
      id="events"
      class="bg-bg-0 transition-colors mt-26 duration-300 relative scroll-mt-20"
    >
      <div class="w-full md:px-4 ">
        <div
          id="mobile-header-wrapper"
          class="md:hidden sticky top-10  z-30 bg-bg-0/85 backdrop-blur-md border-b border-bg-2"
        >
          <div class="flex flex-col border-b border-fg-0/20">
            <h1 class="font-bold font-sans tracking-wide text-fg-0 text-2xl py-2 bg-bg-0/75 backdrop-blur-sm w-full border-b md:border-none border-bg-2/50 px-4">
              EVENTS
            </h1>
            <div class="flex justify-between items-center h-full px-2">
              <div
                ref={mobileNavRef}
                class="flex gap-1 h-full text-sm overflow-x-auto scrollbar-hide py-2 max-w-64"
              >
                <For each={processedData().sidebarList}>
                  {(item, index) => (
                    <a
                      data-target={item.id}
                      onClick={(e) => handleNavClick(e, index())}
                      classList={{
                        "bg-fg-0 text-bg-0 font-bold":
                          activeIndex() === index(),
                        "text-fg-1 hover:text-fg-0": activeIndex() !== index(),
                      }}
                      class="mobile-nav-item font-sans transition-colors duration-200 px-2 h full py-1 text-xs rounded-sm shrink-0"
                    >
                      {String(index() + 1).padStart(2, "0")}
                    </a>
                  )}
                </For>
              </div>
              <div class="flex flex-col items-end text-right pl-2 overflow-hidden">
                <h3 class="font-semibold text-fg-0 truncate text-xs leading-tight w-full text-right">
                  {activeItem().title}
                </h3>
              </div>
            </div>
          </div>
        </div>

        <div class="md:grid md:grid-cols-6 gap-8">
          <div class="hidden md:block relative h-full">
            <div class="sticky top-24 flex flex-col max-h-[calc(100vh-6rem)]">
              <h1 class="text-4xl font-bold text-fg-0 mb-4 font-sans shrink-0">
                EVENTS
              </h1>
              <div
                ref={desktopNavRef}
                class="flex-1 min-h-0 overflow-y-auto scrollbar-hide pb-4"
              >
                <div class="flex flex-col gap-2">
                  <For
                    each={[
                      {
                        title: "Upcoming",
                        data: processedData().upcoming,
                        offset: 0,
                        color: "bg-primary",
                      },
                      {
                        title: "Recent",
                        data: processedData().recent,
                        offset: processedData().offsets.recent,
                        color: "bg-fg-1",
                      },
                      {
                        title: "Past Events",
                        data: processedData().archived,
                        offset: processedData().offsets.archived,
                        color: "bg-bg-2 border border-fg-0",
                      },
                    ]}
                  >
                    {(group) => (
                      <Show when={group.data.length > 0}>
                        <div>
                          <div class="flex items-center gap-2 mb-2 opacity-60">
                            <span class={`w-1.5 h-1.5 ${group.color}`} />
                            <h4 class="text-xs font-bold text-fg-1 uppercase tracking-wider">
                              {group.title}
                            </h4>
                          </div>
                          <ul class="flex flex-col gap-1 border-l border-bg-2">
                            <For each={group.data}>
                              {(item, i) => {
                                const globalIndex = group.offset + i();
                                return (
                                  <li>
                                    <a
                                      data-target={item.id}
                                      onClick={(e) =>
                                        handleNavClick(e, globalIndex)
                                      }
                                      classList={{
                                        "border-fg-0 pl-6 font-bold":
                                          activeIndex() === globalIndex,
                                        "border-transparent pl-4 hover:border-fg-0/30":
                                          activeIndex() !== globalIndex,
                                      }}
                                      class="desktop-nav-link block w-full truncate text-nowrap py-0.5 border-l-2 group transition-all duration-200"
                                    >
                                      <span
                                        class={`nav-number font-mono text-[10px] transition-colors ${activeIndex() === globalIndex ? "text-fg-0 font-bold" : "text-fg-1 group-hover:text-fg-0"}`}
                                      >
                                        {String(globalIndex + 1).padStart(
                                          2,
                                          "0",
                                        )}
                                      </span>
                                      <span
                                        class={`nav-title text-xs font-medium transition-colors ml-2 ${activeIndex() === globalIndex ? "text-fg-0 font-bold" : "text-fg-1 group-hover:text-fg-0"}`}
                                      >
                                        {item.title}
                                      </span>
                                    </a>
                                  </li>
                                );
                              }}
                            </For>
                          </ul>
                        </div>
                      </Show>
                    )}
                  </For>
                </div>
              </div>
            </div>
          </div>

          <div class="md:col-span-5 md:mt-16 py-16 md:py-0">
            <div class="flex flex-col border-l border-r border-fg-0/20 gap-12">
              <For
                each={[...processedData().upcoming, ...processedData().recent]}
              >
                {(event, index) => {
                  const statusLabel =
                    event.status === "upcoming" ? "Upcoming" : "Recent";
                  const statusColor =
                    event.status === "upcoming"
                      ? "bg-primary text-primary-fg"
                      : "bg-bg-2 text-fg-1";

                  return (
                    <div
                      id={`event-${event.id}`}
                      data-index={index()}
                      class="vertical-event-section w-full border-b border-t border-fg-0/20 justify-center scroll-mt-32 md:scroll-mt-8"
                    >
                      <Show
                        when={!event.custom_html}
                        fallback={
                          <div
                            innerHTML={event.custom_html || ""}
                            class="w-full"
                          />
                        }
                      >
                        <div class="grid md:grid-cols-2 gap-4 grid-rows-7 md:grid-rows-1 h-full">
                          <div class="col-span-1 row-span-3 md:row-span-1">
                            <img
                              src={event.image_url || ""}
                              alt={event.title}
                              class="w-full h-full max-h-72 md:max-h-full md:h-auto object-cover md:aspect-square bg-bg-2"
                              loading="lazy"
                            />
                          </div>
                          <div class="col-span-1 row-span-4 md:row-span-1 h-full flex flex-col justify-between py-0 px-2 md:px-0 pb-2 md:pb-4 md:py-4">
                            <div>
                              <div class="flex flex-wrap gap-2 mb-3">
                                <div
                                  class={`w-max text-[0.6rem] font-bold uppercase tracking-widest px-2 py-0.5 ${statusColor}`}
                                >
                                  {statusLabel}
                                </div>
                                {event.event_type && (
                                  <span class="text-[0.6rem] font-bold uppercase tracking-widest bg-primary text-primary-fg px-2 py-0.5">
                                    {event.event_type}
                                  </span>
                                )}
                              </div>
                              <h2 class="text-4xl md:text-5xl lg:text-6xl leading-none font-bold text-fg-0 font-sans mb-3">
                                {event.title}
                              </h2>
                              <p class="font-semibold text-fg-1 mb-4 font-sans uppercase">
                                {formatDate(event.date)}
                              </p>
                              {event.tags && (
                                <div class="flex flex-wrap gap-1 mb-4">
                                  <For each={event.tags}>
                                    {(tag) => (
                                      <span class="text-[10px] font-bold uppercase tracking-tight bg-bg-2 text-fg-1 px-2 py-0.5 border border-fg-0/5 rounded-sm">
                                        {tag}
                                      </span>
                                    )}
                                  </For>
                                </div>
                              )}
                            </div>
                            <div>
                              <p class="text-fg-0 font-bold font-sans text-md leading-relaxed">
                                {event.description}
                              </p>
                              <div class="mt-6">
                                <Show
                                  when={event.hasDetails}
                                  fallback={
                                    <Show when={event.link}>
                                      <a
                                        href={event.link || "#"}
                                        target="_blank"
                                        class="inline-block py-3 px-6 font-medium bg-primary text-primary-fg hover:opacity-90 transition-opacity"
                                      >
                                        {event.button_text || "Register Now"}
                                      </a>
                                    </Show>
                                  }
                                >
                                  <a
                                    href={`/event/${event.id}`}
                                    class="inline-block py-3 px-6 font-medium bg-fg-0 text-bg-0 hover:opacity-90 transition-opacity"
                                  >
                                    {event.button_text || "View Details"}
                                  </a>
                                </Show>
                              </div>
                            </div>
                          </div>
                        </div>
                      </Show>
                    </div>
                  );
                }}
              </For>

              <Show when={processedData().archived.length > 0}>
                <div
                  id="past-events-section"
                  class="relative group/scroller h-full w-full scroll-mt-32 md:scroll-mt-8"
                >
                  <div class="flex justify-between left-0 items-center mb-4 bg-bg-0/85 backdrop-blur-sm py-2 px-2">
                    <h2 class="mt-2 text-4xl sm:text-5xl font-serif font-medium text-fg-0">
                      Past Events
                    </h2>
                    <div class="flex items-center gap-1">
                      <button
                        class="p-2 bg-bg-2 hover:bg-bg-2/80 text-fg-0 transition-colors cursor-pointer disabled:opacity-30"
                        disabled={!archiveStatus().hasPrev}
                        onClick={() => cycleArchive(-1)}
                      >
                        <svg
                          class="w-6 h-6"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="1.5"
                            d="M15 19l-7-7 7-7"
                          />
                        </svg>
                      </button>
                      <button
                        class="p-2 bg-bg-2 hover:bg-bg-2/80 text-fg-0 transition-colors cursor-pointer disabled:opacity-30"
                        disabled={!archiveStatus().hasNext}
                        onClick={() => cycleArchive(1)}
                      >
                        <svg
                          class="w-6 h-6"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="1.5"
                            d="M9 5l7 7-7 7"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>

                  <div
                    ref={archiveContainerRef}
                    class="flex flex-row overflow-x-auto snap-x snap-mandatory sm:gap-6 gap-[4vw] scrollbar-hide border-fg-0/20 border-t border-b"
                  >
                    <For each={processedData().archived}>
                      {(event, i) => (
                        <div
                          id={`event-${event.id}`}
                          data-index={processedData().offsets.archived + i()}
                          class="snap-start shrink-0 w-[92vw] sm:max-w-172 border-l border-r border-fg-0/20"
                        >
                          <Show
                            when={!event.custom_html}
                            fallback={
                              <div
                                innerHTML={event.custom_html || ""}
                                class="w-full h-full"
                              />
                            }
                          >
                            <div class="grid grid-cols-1 sm:grid-cols-2 items-center h-full">
                              <div class="h-full w-full overflow-hidden">
                                <img
                                  src={event.image_url || ""}
                                  alt={event.title}
                                  class="w-full h-full object-cover"
                                />
                              </div>
                              <div class="flex flex-col justify-between h-full p-2">
                                <div>
                                  <h3 class="text-3xl sm:text-4xl font-sans text-fg-0 font-semibold leading-tight">
                                    {event.title}
                                  </h3>
                                  <p class="text-sm font-bold text-fg-1 mt-1 mb-3 font-sans uppercase">
                                    {formatDate(event.date)}
                                  </p>
                                  <div class="flex flex-wrap gap-1 mb-2">
                                    {event.event_type && (
                                      <span class="text-[10px] font-bold uppercase bg-primary text-primary-fg px-1.5 py-0.5">
                                        {event.event_type}
                                      </span>
                                    )}
                                    {event.tags && (
                                      <For each={event.tags}>
                                        {(tag) => (
                                          <span class="text-[10px] font-bold uppercase bg-bg-2 text-fg-1 px-1.5 py-0.5 border border-fg-0/5 rounded-sm">
                                            {tag}
                                          </span>
                                        )}
                                      </For>
                                    )}
                                  </div>
                                </div>
                                <div>
                                  <p class="text-fg-0 text-sm mb-4 font-sans line-clamp-3 leading-relaxed">
                                    {event.description}
                                  </p>
                                  <div class="flex gap-2">
                                    <Show
                                      when={event.hasDetails}
                                      fallback={
                                        <Show when={event.link}>
                                          <a
                                            href={event.link || "#"}
                                            target="_blank"
                                            class="inline-block py-1 px-2 text-sm font-bold bg-fg-0 text-bg-0/80 hover:bg-fg-0/80 hover:text-bg-0 transition-colors"
                                          >
                                            Visit
                                          </a>
                                        </Show>
                                      }
                                    >
                                      <a
                                        href={`/event/${event.id}`}
                                        class="inline-block py-1 px-2 text-sm font-bold bg-fg-0 text-bg-0/80 hover:bg-fg-0/80 hover:text-bg-0 transition-colors"
                                      >
                                        View Details
                                      </a>
                                    </Show>

                                    <Show when={event.report_url}>
                                      <a
                                        href={event.report_url || "#"}
                                        class="inline-block py-1 px-2 text-sm font-bold bg-bg-2 text-fg-0/80 hover:bg-bg-2/80 hover:text-fg-0 transition-colors"
                                      >
                                        View Report
                                      </a>
                                    </Show>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </Show>
                        </div>
                      )}
                    </For>
                  </div>
                </div>
              </Show>
            </div>
          </div>
        </div>
      </div>
      <style>{`.scrollbar-hide::-webkit-scrollbar { display: none; } .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }`}</style>
    </section>
  );
}
