import { createSignal, onMount, onCleanup, For, Show } from "solid-js";
import type { Event } from "../types";

interface Props {
  events: Event[];
}

export default function EventsIsland(props: Props) {
  const now = new Date();
  const sortedEvents = () =>
    [...props.events].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );

  const activeEvents = () => sortedEvents().filter((e) => !e.isArchived);
  const archivedEvents = () => sortedEvents().filter((e) => e.isArchived);
  const upcomingGroup = () =>
    activeEvents().filter((e) => new Date(e.date) >= now);
  const recentGroup = () =>
    activeEvents().filter((e) => new Date(e.date) < now);

  const sidebarEvents = () => [
    ...upcomingGroup(),
    ...recentGroup(),
    ...archivedEvents(),
  ];

  const [activeId, setActiveId] = createSignal<string>(
    sidebarEvents()[0]?.id || "",
  );
  const [mobileTitle, setMobileTitle] = createSignal<string>(
    sidebarEvents()[0]?.title || "",
  );

  const [canScrollLeft, setCanScrollLeft] = createSignal(false);
  const [canScrollRight, setCanScrollRight] = createSignal(true);

  let archiveContainerRef: HTMLDivElement | undefined;
  let mobileNavRef: HTMLDivElement | undefined;
  let desktopNavRef: HTMLDivElement | undefined;

  let isProgrammaticScroll = false;
  let scrollTimeout: any = null;

  const syncSidebar = (id: string) => {
    if (mobileNavRef) {
      const activeEl = mobileNavRef.querySelector(
        `[data-target="${id}"]`,
      ) as HTMLElement;
      if (activeEl) {
        const containerCenter = mobileNavRef.clientWidth / 2;
        const itemCenter = activeEl.offsetLeft + activeEl.offsetWidth / 2;
        console.log("d");
        mobileNavRef.scrollTo({
          left: itemCenter - containerCenter,
          behavior: "smooth",
        });
      }
    }

    if (desktopNavRef) {
      const activeEl = desktopNavRef.querySelector(
        `[data-target="${id}"]`,
      ) as HTMLElement;
      if (activeEl) {
        const topPos = activeEl.offsetTop;
        const containerHeight = desktopNavRef.clientHeight;
        const elementHeight = activeEl.clientHeight;
        const targetScroll = topPos - containerHeight / 2 + elementHeight / 2;

        desktopNavRef.scrollTo({
          top: targetScroll,
          behavior: "smooth",
        });
      }
    }
  };

  const updateButtonState = () => {
    if (!archiveContainerRef) return;
    const { scrollLeft, scrollWidth, clientWidth } = archiveContainerRef;
    setCanScrollLeft(scrollLeft > 5);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 5);
  };

  const scrollArchive = (direction: "left" | "right") => {
    if (!archiveContainerRef) return;
    const scrollAmount = archiveContainerRef.clientWidth * 0.9;

    archiveContainerRef.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
  };

  const handleNavClick = (
    e: MouseEvent,
    targetId: string,
    isArchiveItem: boolean,
  ) => {
    e.preventDefault();

    isProgrammaticScroll = true;
    if (scrollTimeout) clearTimeout(scrollTimeout);

    scrollTimeout = setTimeout(() => {
      isProgrammaticScroll = false;
      setActiveId(targetId);
    }, 1000);

    setActiveId(targetId);

    syncSidebar(targetId);

    const targetItem = props.events.find((ev) => ev.id === targetId);
    if (targetItem) setMobileTitle(targetItem.title);

    if (window.matchMedia("(min-width: 768px)").matches) {
      const el = document.getElementById(`event-${targetId}`);
      if (el) {
        const offset = 100;
        const elementPosition = el.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - offset;
        window.scrollTo({ top: offsetPosition, behavior: "smooth" });
      }

      if (isArchiveItem && archiveContainerRef) {
        const targetEl = document.getElementById(`event-${targetId}`);
        if (targetEl) {
          const leftPos =
            targetEl.offsetLeft -
            (archiveContainerRef.clientWidth - targetEl.clientWidth) / 2;
          archiveContainerRef.scrollTo({ left: leftPos, behavior: "smooth" });
        }
      }
    } else {
      if (isArchiveItem) {
        const sectionEl = document.getElementById("past-events-section");
        if (sectionEl) {
          const offset = 180;
          const elementPosition = sectionEl.getBoundingClientRect().top;
          const offsetPosition = elementPosition + window.pageYOffset - offset;
          window.scrollTo({ top: offsetPosition, behavior: "smooth" });
        }
        if (archiveContainerRef) {
          const targetEl = document.getElementById(`event-${targetId}`);
          if (targetEl) {
            const leftPos =
              targetEl.offsetLeft -
              (archiveContainerRef.clientWidth - targetEl.clientWidth) / 2;
            archiveContainerRef.scrollTo({ left: leftPos, behavior: "smooth" });
          }
        }
      } else {
        const el = document.getElementById(`event-${targetId}`);
        if (el) {
          const offset = 140;
          const elementPosition = el.getBoundingClientRect().top;
          const offsetPosition = elementPosition + window.pageYOffset - offset;
          window.scrollTo({ top: offsetPosition, behavior: "smooth" });
        }
      }
    }
  };

  const determineActiveArchiveItem = () => {
    if (!archiveContainerRef) return null;
    const containerCenter =
      archiveContainerRef.scrollLeft + archiveContainerRef.clientWidth / 2;
    let closestId = "";
    let minDiff = Infinity;
    let closestTitle = "";

    const items = archiveContainerRef.children;
    for (let i = 0; i < items.length; i++) {
      const el = items[i] as HTMLElement;
      const itemCenter = el.offsetLeft + el.offsetWidth / 2;
      const diff = Math.abs(containerCenter - itemCenter);
      if (diff < minDiff) {
        minDiff = diff;
        closestId = el.getAttribute("data-id") || "";
        closestTitle = el.getAttribute("data-title") || "";
      }
    }
    return { id: closestId, title: closestTitle };
  };

  onMount(() => {
    const verticalObserver = new IntersectionObserver(
      (entries) => {
        if (isProgrammaticScroll) return;
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const id = entry.target.getAttribute("data-id");
            const title = entry.target.getAttribute("data-title");
            if (id) {
              setActiveId(id);
              syncSidebar(id);
            }
            if (title) setMobileTitle(title);
          }
        });
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
          if (entry.isIntersecting) {
            const active = determineActiveArchiveItem();
            if (active && active.id) {
              setActiveId(active.id);
              setMobileTitle(active.title);
              syncSidebar(active.id);
            }
          }
        });
      },
      { rootMargin: "-40% 0px -50% 0px" },
    );

    const archiveSection = document.getElementById("past-events-section");
    if (archiveSection) archiveSectionObserver.observe(archiveSection);

    const handleHorizontalScroll = () => {
      if (!archiveContainerRef) return;
      updateButtonState();
      if (isProgrammaticScroll) return;

      if (archiveSection) {
        const rect = archiveSection.getBoundingClientRect();
        const isVisible =
          rect.top < window.innerHeight / 2 &&
          rect.bottom > window.innerHeight / 2;
        if (isVisible) {
          const active = determineActiveArchiveItem();
          if (active && active.id) {
            setActiveId(active.id);
            setMobileTitle(active.title);
          }
        }
      }
    };

    archiveContainerRef?.addEventListener("scroll", handleHorizontalScroll, {
      passive: true,
    });
    window.addEventListener("resize", updateButtonState);
    updateButtonState();

    onCleanup(() => {
      verticalObserver.disconnect();
      archiveSectionObserver.disconnect();
      archiveContainerRef?.removeEventListener(
        "scroll",
        handleHorizontalScroll,
      );
      window.removeEventListener("resize", updateButtonState);
      if (scrollTimeout) clearTimeout(scrollTimeout);
    });
  });

  return (
    <section
      id="events"
      class="bg-bg-0 transition-colors mt-16 duration-300 relative scroll-mt-20"
    >
      <div class="w-full md:px-4">
        <div
          id="mobile-header-wrapper"
          class="md:hidden sticky top-10 z-30 bg-bg-0/85 backdrop-blur-md border-b border-bg-2"
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
                <For each={sidebarEvents()}>
                  {(item, index) => (
                    <a
                      href={`#event-${item.id}`}
                      data-target={item.id}
                      onClick={(e) =>
                        handleNavClick(e, item.id, !!item.isArchived)
                      }
                      classList={{
                        "bg-fg-0 text-bg-0 font-bold": activeId() === item.id,
                        "text-fg-1 hover:text-fg-0": activeId() !== item.id,
                      }}
                      class="mobile-nav-item font-sans transition-colors duration-200 px-2 h full py-1 text-xs rounded-sm shrink-0"
                    >
                      {String(index() + 1).padStart(2, "0")}
                    </a>
                  )}
                </For>
              </div>
              <div class="flex flex-col items-end text-right pl-2 overflow-hidden">
                <h3
                  id="mobile-event-title"
                  class="font-semibold text-fg-0 truncate text-xs leading-tight w-full text-right"
                >
                  {mobileTitle()}
                </h3>
              </div>
            </div>
          </div>
        </div>

        <div class="md:grid md:grid-cols-6 gap-8">
          {/* --- DESKTOP SIDEBAR --- */}
          <div class="hidden md:block">
            <div
              class="sticky top-24 overflow-y-auto scrollbar-hide max-h-[calc(100vh-100px)]"
              ref={desktopNavRef}
            >
              <h1 class="text-4xl font-bold text-fg-0 mb-4 font-sans">
                EVENTS
              </h1>
              <div class="flex flex-col gap-2">
                <For
                  each={[
                    {
                      title: "Upcoming",
                      data: upcomingGroup(),
                      color: "bg-primary",
                    },
                    { title: "Recent", data: recentGroup(), color: "bg-fg-1" },
                    {
                      title: "Past Events",
                      data: archivedEvents(),
                      color: "bg-bg-2 border border-fg-0",
                      isArchive: true,
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
                            {(item) => {
                              const globalIndex = sidebarEvents().findIndex(
                                (e) => e.id === item.id,
                              );
                              return (
                                <li>
                                  <a
                                    href={`#event-${item.id}`}
                                    data-target={item.id}
                                    onClick={(e) =>
                                      handleNavClick(
                                        e,
                                        item.id,
                                        !!group.isArchive,
                                      )
                                    }
                                    classList={{
                                      "border-fg-0 pl-6 font-bold":
                                        activeId() === item.id,
                                      "border-transparent pl-4 hover:border-fg-0/30":
                                        activeId() !== item.id,
                                    }}
                                    class="desktop-nav-link block w-full truncate text-nowrap py-0.5 border-l-2 group transition-all duration-200"
                                  >
                                    <span
                                      classList={{
                                        "text-fg-0 font-bold":
                                          activeId() === item.id,
                                        "text-fg-1": activeId() !== item.id,
                                      }}
                                      class="nav-number font-mono text-[10px] group-hover:text-fg-0 transition-colors"
                                    >
                                      {String(globalIndex + 1).padStart(2, "0")}
                                    </span>
                                    <span
                                      classList={{
                                        "text-fg-0 font-bold":
                                          activeId() === item.id,
                                        "text-fg-1": activeId() !== item.id,
                                      }}
                                      class="nav-title text-xs font-medium group-hover:text-fg-0 truncate transition-colors ml-2"
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

          {/* --- CONTENT AREA --- */}
          <div class="md:col-span-5 md:mt-16 py-16 md:py-0 ">
            <div class="flex flex-col border-l border-r border-fg-0/20 gap-12">
              {/* 1. VERTICAL LIST */}
              <For each={[...upcomingGroup(), ...recentGroup()]}>
                {(event) => {
                  const isUpcoming = new Date(event.date) >= now;
                  const statusLabel = isUpcoming ? "Upcoming" : "Recent";
                  const statusColor = isUpcoming
                    ? "bg-primary text-primary-fg"
                    : "bg-bg-2 text-fg-1";

                  return (
                    <div
                      id={`event-${event.id}`}
                      data-id={event.id}
                      data-title={event.title}
                      data-status={statusLabel}
                      class="vertical-event-section w-full border-b border-t border-fg-0/20 justify-center grid md:grid-cols-2 gap-4 grid-rows-7 md:grid-rows-1 scroll-mt-32 md:scroll-mt-8"
                    >
                      <div class="col-span-1 row-span-3 md:row-span-1">
                        <img
                          src={event.img}
                          alt={event.title}
                          class="w-full h-full max-h-72 md:max-h-full md:h-auto object-cover md:aspect-square bg-bg-2"
                          loading="lazy"
                        />
                      </div>
                      <div class="col-span-1 row-span-4 md:row-span-1 h-full flex flex-col justify-between py-0 px-2 md:px-0 pb-2 md:pb-4 md:py-4">
                        <div>
                          <div
                            class={`w-max text-[0.6rem] font-bold uppercase tracking-widest mb-3 px-2 py-0.5 ${statusColor}`}
                          >
                            {statusLabel}
                          </div>
                          <h2 class="text-4xl md:text-6xl leading-none font-bold text-fg-0 font-sans">
                            {event.title}
                          </h2>
                          <p class="font-semibold text-fg-1 mt-3 mb-3 font-sans uppercase">
                            {event.date}
                          </p>
                          <div class="flex flex-wrap gap-1 mb-4">
                            <For each={event.tags}>
                              {(tag) => (
                                <span class="text-xs font-semibold bg-bg-2 text-fg-1 px-2 py-1 border border-bg-2">
                                  {tag}
                                </span>
                              )}
                            </For>
                          </div>
                        </div>
                        <div>
                          <p class="text-fg-0 font-bold font-sans text-md leading-relaxed">
                            {event.desc}
                          </p>
                          <Show when={event.link}>
                            <a
                              href={event.link}
                              class="inline-block mt-6 py-3 px-6 font-medium bg-primary text-primary-fg hover:opacity-90 transition-opacity"
                            >
                              {event.buttonText || "Register Now"}
                            </a>
                          </Show>
                        </div>
                      </div>
                    </div>
                  );
                }}
              </For>

              {/* 2. ARCHIVE SECTION */}
              <Show when={archivedEvents().length > 0}>
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
                        class="p-2 bg-bg-2 hover:bg-bg-2/80 text-fg-0 transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                        aria-label="Scroll Left"
                        disabled={!canScrollLeft()}
                        onClick={() => scrollArchive("left")}
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
                          ></path>
                        </svg>
                      </button>
                      <button
                        class="p-2 bg-bg-2 hover:bg-bg-2/80 text-fg-0 transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                        aria-label="Scroll Right"
                        disabled={!canScrollRight()}
                        onClick={() => scrollArchive("right")}
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
                          ></path>
                        </svg>
                      </button>
                    </div>
                  </div>

                  <div
                    ref={archiveContainerRef}
                    class="flex  flex-row overflow-x-auto snap-x snap-mandatory sm:gap-6 gap-[4vw] scrollbar-hide border-fg-0/20 border-t border-b"
                  >
                    <For each={archivedEvents()}>
                      {(event) => (
                        <div
                          id={`event-${event.id}`}
                          data-id={event.id}
                          data-title={event.title}
                          class="snap-start shrink-0 w-[92vw] sm:max-w-172 border-l border-r border-fg-0/20"
                        >
                          <div class="grid grid-cols-1 sm:grid-cols-2 items-center h-full">
                            <div class="h-full w-full overflow-hidden">
                              <img
                                src={event.img}
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
                                  {event.date}
                                </p>
                                <div class="flex flex-wrap gap-1 mb-2">
                                  <For each={event.tags}>
                                    {(tag) => (
                                      <span class="text-xs font-medium bg-bg-2 text-fg-1 px-1 py-0.5 border border-bg-2">
                                        {tag}
                                      </span>
                                    )}
                                  </For>
                                </div>
                              </div>

                              <div>
                                <p class="text-fg-0 text-sm mb-4 font-sans line-clamp-3 leading-relaxed">
                                  {event.desc}
                                </p>
                                <Show when={event.link}>
                                  <a
                                    href={event.link}
                                    class="inline-block py-1 px-2 mr-2 text-sm font-bold bg-fg-0 text-bg-0/80 hover:bg-fg-0/80 hover:text-bg-0 transition-colors"
                                  >
                                    {event.buttonText || "Visit"}
                                  </a>
                                </Show>
                                <a
                                  href={`/report/${event.relation}`}
                                  class="inline-block py-1 px-2 text-sm font-bold bg-bg-2 text-fg-0/80 hover:bg-bg-2/80 hover:text-fg-0 transition-colors"
                                >
                                  View Report
                                </a>
                              </div>
                            </div>
                          </div>
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

      <style>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </section>
  );
}
