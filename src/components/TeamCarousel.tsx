import { createSignal, onMount, onCleanup, For } from "solid-js";

interface TeamCarouselProps {
  images: string[];
  title?: string;
  subtitle?: string;
}

export default function TeamCarousel(props: TeamCarouselProps) {
  const [currentIndex, setCurrentIndex] = createSignal(0);

  const images = () =>
    props.images && props.images.length > 0
      ? props.images
      : ["/placeholder-team.jpg"];

  const goTo = (index: number) => {
    setCurrentIndex(index);
  };

  const next = () => {
    setCurrentIndex((prev) => (prev + 1) % images().length);
  };

  onMount(() => {
    if (images().length > 1) {
      // Increased interval to 7 seconds for a calmer pace
      const interval = setInterval(next, 7000);
      onCleanup(() => clearInterval(interval));
    }
  });

  return (
    <section class="py-16 lg:py-24 bg-bg-0">
      <div class="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        <div class="mb-12">
          <p class="text-sm font-bold font-mono tracking-[0.2em] text-fg-1 uppercase mb-2">
            {props.subtitle || "NSDC CORE"}
          </p>
          <h2 class="text-5xl lg:text-7xl font-sans font-bold text-fg-0 uppercase tracking-tighter">
            {props.title || "OUR TEAM"}
          </h2>
        </div>

        {/* Carousel Frame */}
        <div class="w-full max-w-5xl mx-auto relative aspect-[16/9] overflow-hidden rounded-sm bg-bg-1 shadow-sm border border-fg-0/5">
          <For each={images()}>
            {(image, index) => (
              <div
                class="absolute inset-0 w-full h-full bg-cover bg-center will-change-[opacity,filter,transform]"
                style={{
                  "background-image": `url(${image})`,
                  // 2000ms transition for opacity and filter = very slow, smooth fade
                  transition:
                    "opacity 2000ms ease-in-out, filter 2000ms ease-in-out, transform 4000ms linear",

                  // Active: Fully visible, Color, Drifting scale
                  // Inactive: Invisible, Grayscale, Reset scale
                  opacity: index() === currentIndex() ? 1 : 0,
                  filter:
                    index() === currentIndex()
                      ? "grayscale(0%) brightness(1)"
                      : "grayscale(100%) brightness(0.6)",
                  transform:
                    index() === currentIndex() ? "scale(1.05)" : "scale(1)",
                  "z-index": index() === currentIndex() ? 10 : 0,
                }}
              >
                {/* Overlay for text readability / aesthetics */}
                <div class="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />
              </div>
            )}
          </For>

          {/* Navigation Dots */}
          {images().length > 1 && (
            <div class="absolute bottom-6 left-6 flex gap-3 z-20">
              <For each={images()}>
                {(_, i) => (
                  <button
                    onClick={() => goTo(i())}
                    aria-label={`Go to slide ${i() + 1}`}
                    class="h-1 cursor-pointer transition-all duration-500 ease-out rounded-full"
                    style={{
                      width: i() === currentIndex() ? "3rem" : "1rem",
                      "background-color":
                        i() === currentIndex()
                          ? "var(--color-fg-0, #fff)"
                          : "rgba(255,255,255,0.2)",
                    }}
                  />
                )}
              </For>
            </div>
          )}
        </div>

        <div class="mt-8 text-center">
          <a
            href="/teams"
            class="inline-block py-4 px-10 text-xs font-bold font-mono tracking-widest uppercase bg-fg-0 text-bg-0 hover:bg-primary transition-colors duration-200"
          >
            Explore Members
          </a>
        </div>
      </div>
    </section>
  );
}

