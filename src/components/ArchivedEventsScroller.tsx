import type { Event } from "../types";
import { useCallback, useEffect, useRef } from "react";

const ArrowLeftIcon = () => (
  <svg
    className="w-6 h-6"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.5}
      d="M15 19l-7-7 7-7"
    />
  </svg>
);
const ArrowRightIcon = () => (
  <svg
    className="w-6 h-6"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.5}
      d="M9 5l7 7-7 7"
    />
  </svg>
);

interface ArchivedEventsScrollerProps {
  events: Event[];
  onVisibleEventChange: (id: string) => void;
  scrollToEventId: string | null;
  isVerticallyVisible: boolean;
}
const ArchivedEventsScroller = ({
  events,
  onVisibleEventChange,
  scrollToEventId,
  isVerticallyVisible,
}: ArchivedEventsScrollerProps) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const observerPaused = useRef(false);

  const updateActiveCard = useCallback(() => {
    if (!scrollContainerRef.current) return;
    const container = scrollContainerRef.current;
    const containerCenter = container.scrollLeft + container.offsetWidth / 2;
    let closestCardId = "";
    let smallestDistance = Infinity;

    for (const event of events) {
      const el = cardRefs.current[event.id];
      if (el) {
        const cardCenter = el.offsetLeft + el.offsetWidth / 2;
        const distance = Math.abs(containerCenter - cardCenter);
        if (distance < smallestDistance) {
          smallestDistance = distance;
          closestCardId = event.id;
        }
      }
    }

    if (closestCardId) {
      onVisibleEventChange(closestCardId);
    }
  }, [events, onVisibleEventChange]);

  useEffect(() => {
    if (isVerticallyVisible) {
      updateActiveCard();
    }
  }, [isVerticallyVisible, updateActiveCard]);

  useEffect(() => {
    if (scrollToEventId && cardRefs.current[scrollToEventId]) {
      observerPaused.current = true;
      cardRefs.current[scrollToEventId]?.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "center",
      });
      setTimeout(() => {
        observerPaused.current = false;
      }, 1000);
    }
  }, [scrollToEventId]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (observerPaused.current) return;
        const mostVisible = entries.reduce((prev, current) =>
          prev.intersectionRatio > current.intersectionRatio ? prev : current,
        );

        if (mostVisible && mostVisible.intersectionRatio > 0.5) {
          onVisibleEventChange(mostVisible.target.id);
        }
      },
      {
        root: scrollContainerRef.current,
        threshold: [0.5, 0.75, 1.0],
      },
    );

    const currentCardRefs = cardRefs.current;
    Object.values(currentCardRefs).forEach((el) => {
      if (el) observer.observe(el);
    });

    return () => {
      Object.values(currentCardRefs).forEach((el) => {
        if (el) observer.unobserve(el);
      });
    };
  }, [events, onVisibleEventChange]);

  const scroll = (direction: "left" | "right") => {
    if (!scrollContainerRef.current) return;
    const container = scrollContainerRef.current;
    const containerCenter = container.scrollLeft + container.offsetWidth / 2;

    let currentCardId = "";
    let smallestDistance = Infinity;
    Object.entries(cardRefs.current).forEach(([id, el]) => {
      if (el) {
        const cardCenter = el.offsetLeft + el.offsetWidth / 2;
        const distance = Math.abs(containerCenter - cardCenter);
        if (distance < smallestDistance) {
          smallestDistance = distance;
          currentCardId = id;
        }
      }
    });

    const currentIndex = events.findIndex((e) => e.id === currentCardId);
    if (currentIndex === -1) return;

    const targetIndex =
      direction === "right"
        ? Math.min(events.length - 1, currentIndex + 1)
        : Math.max(0, currentIndex - 1);

    const targetEvent = events[targetIndex];
    const targetCard = cardRefs.current[targetEvent.id];

    if (targetEvent && targetCard) {
      observerPaused.current = true;
      targetCard.scrollIntoView({
        behavior: "smooth",
        inline: "center",
        block: "nearest",
      });
      setTimeout(() => {
        observerPaused.current = false;
      }, 1000);
    }
  };

  return (
    <div className="h-full flex flex-col justify-center">
      <div className="flex justify-between items-center mb-4">
        <h2 className="font-bold text-2xl">Past Events</h2>
        <div className="flex items-center gap-4">
          <button
            onClick={() => scroll("left")}
            className="p-2 rounded-xs bg-gray-100 hover:bg-gray-200 transition-colors"
          >
            <ArrowLeftIcon />
          </button>
          <button
            onClick={() => scroll("right")}
            className="p-2 rounded-xs bg-gray-100 hover:bg-gray-200 transition-colors"
          >
            <ArrowRightIcon />
          </button>
        </div>
      </div>
      <div
        ref={scrollContainerRef}
        className="flex gap-4 lg:gap-8 overflow-x-auto snap-x snap-mandatory scrollbar-hide"
      >
        {events.map((event) => (
          <div
            key={event.id}
            id={event.id}
            ref={(el) => {
              cardRefs.current[event.id] = el;
            }}
            className="snap-start h-full flex-shrink-0 w-full sm:w-[90%] grid grid-cols-1 md:grid-cols-7 gap-4 items-center"
          >
            <div className="h-max col-span-1 md:col-span-4">
              <img
                src={event.img}
                alt={event.title}
                className="w-full h-auto aspect-square object-cover "
              />
            </div>
            <div className="flex flex-col justify-between h-full md:col-span-3">
              <div>
                <h3 className="md:text-4xl text-3xl font-bold text-gray-900">
                  {event.title}
                </h3>
                <p className="text-sm font-semibold text-gray-500 my-2">
                  {event.date}
                </p>
              </div>
              <div>
                <p className="text-black text-sm mb-4 font-bold">
                  {event.desc}
                </p>
                <a
                  href={`/report/${event.relation}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block py-1 px-2 text-sm font-bold bg-gray-200 text-black/60 rounded-md hover:bg-gray-300 hover:text-black/80 transition-colors"
                >
                  View Report
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
ArchivedEventsScroller.displayName = "ArchivedEventsScroller";

export default ArchivedEventsScroller;
