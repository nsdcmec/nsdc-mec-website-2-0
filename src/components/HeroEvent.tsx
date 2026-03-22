import {
  createSignal,
  onMount,
  onCleanup,
  Show,
  createMemo,
  createEffect,
} from "solid-js";
import type {
  Event,
  HeroEventConfig,
  BgConfig,
  HeroStateConfig,
} from "../types";
import { parseEventDate } from "../lib/date-utils";
import { getTarget, getRel } from "../lib/link-utils";

interface Props {
  event: Event;
}

const calculateTimeLeft = (targetDate: string, currentNow: number) => {
  const targetTs = parseEventDate(targetDate);
  const difference = targetTs - currentNow;
  let timeLeft = {
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  };

  if (targetTs > 0 && difference > 0) {
    timeLeft = {
      days: Math.floor(difference / (1000 * 60 * 60 * 24)),
      hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
      minutes: Math.floor((difference / 1000 / 60) % 60),
      seconds: Math.floor((difference / 1000) % 60),
    };
  }
  return timeLeft;
};

export default function HeroEvent(props: Props) {
  const [now, setNow] = createSignal(new Date().getTime());
  const config = props.event.metadata.hero_config as HeroEventConfig;

  let htmlContainer: HTMLDivElement | undefined;

  let timer: NodeJS.Timeout;
  onMount(() => {
    setNow(new Date().getTime());
    timer = setInterval(() => {
      setNow(new Date().getTime());
    }, 1000);
  });

  onCleanup(() => {
    clearInterval(timer);
  });

  const state = createMemo(() => {
    const start = parseEventDate(config.start_date);
    const end = parseEventDate(config.end_date);
    const current = now();

    if (current < start) return "upcoming";
    if (current >= start && current <= end) return "ongoing";
    return "ended";
  });

  const timeLeft = createMemo(() => {
    const current = now();
    if (state() === "upcoming") {
      return calculateTimeLeft(config.start_date, current);
    }
    return null;
  });

  const activeConfig = createMemo((): HeroStateConfig | undefined => {
    const s = state();
    if (s === "upcoming") return config.before_config;
    if (s === "ongoing") return config.ongoing_config;
    return config.after_config;
  });

  const buttonText = createMemo(() => {
    const conf = activeConfig();
    const s = state();
    if (conf?.buttontext) return conf.buttontext;
    return s === "upcoming"
      ? "Register Now"
      : s === "ongoing"
        ? "Join Now"
        : "Check it out";
  });

  const currentLink = createMemo(() => {
    const conf = activeConfig();
    const s = state();

    if (conf?.link) return conf.link;

    // Fallback logic
    if (s === "upcoming" || s === "ongoing")
      return props.event.link || undefined;
    return props.event.report_url || undefined;
  });

  const activeBg = createMemo((): BgConfig => {
    const conf = activeConfig();

    // 1. Try state specific BG
    if (conf?.bg?.type) {
      return conf.bg;
    }

    // 2. Try generic hero BG config
    if (config.bg_value) {
      return {
        type: config.bg_type || "image",
        value: config.bg_value,
      };
    }

    // 3. Fallback to event image
    return {
      type: "image",
      value: props.event.image_url || "",
    };
  });

  const hideDetails = createMemo(() => activeConfig()?.hide_details);

  // Effect to safely execute scripts in HTML content
  createEffect(() => {
    const bg = activeBg();
    if (bg.type === "html" && htmlContainer) {
      htmlContainer.innerHTML = "";
      const range = document.createRange();
      range.selectNode(htmlContainer);
      const fragment = range.createContextualFragment(bg.value);
      htmlContainer.appendChild(fragment);
    }
  });

  return (
    <div class="relative w-full h-full overflow-hidden flex flex-col justify-end p-6 md:p-8 bg-bg-2">
      {/* Background Rendering */}
      <Show when={activeBg().type === "image"}>
        <img
          src={activeBg().value}
          alt={props.event.title}
          class="absolute inset-0 w-full h-full object-cover z-0"
        />
      </Show>

      <Show when={activeBg().type === "html"}>
        <div ref={htmlContainer} class="absolute inset-0 w-full h-full z-0" />
      </Show>

      <Show when={activeBg().type === "iframe"}>
        <iframe
          src={activeBg().value}
          title={`Background for ${props.event.title}`}
          class="absolute inset-0 w-full h-full border-0 z-0 bg-bg-2"
          allow="autoplay; encrypted-media"
        />
      </Show>

      <Show when={!hideDetails()}>
        <div class="absolute inset-0 bg-gradient-to-t from-bg-0 via-bg-0/60 to-transparent z-10 pointer-events-none" />

        <div class="relative z-20 flex flex-col gap-4">
          {/* Status Badge */}
          <div class="flex items-center gap-2">
            <span
              class={`px-3 py-1 text-xs font-bold uppercase tracking-widest rounded-sm ${
                state() === "ongoing"
                  ? "bg-red-500 text-white animate-pulse"
                  : state() === "upcoming"
                    ? "bg-primary text-primary-fg"
                    : "bg-bg-1 text-fg-1"
              }`}
            >
              {state() === "upcoming"
                ? "Upcoming Event"
                : state() === "ongoing"
                  ? "Live Now"
                  : "Event Ended"}
            </span>
          </div>

          {/* Title */}
          <h2 class="text-3xl md:text-5xl font-bold font-sans text-fg-0 leading-tight">
            {props.event.title}
          </h2>

          {/* Countdown for Upcoming */}
          <Show when={state() === "upcoming"}>
            <div class="flex gap-4 my-2 text-fg-0">
              <div class="flex flex-col items-center">
                <span class="text-2xl md:text-3xl font-mono font-bold">
                  {String(timeLeft()?.days).padStart(2, "0")}
                </span>
                <span class="text-[10px] uppercase tracking-wider text-fg-1">
                  Days
                </span>
              </div>
              <div class="text-2xl font-bold">:</div>
              <div class="flex flex-col items-center">
                <span class="text-2xl md:text-3xl font-mono font-bold">
                  {String(timeLeft()?.hours).padStart(2, "0")}
                </span>
                <span class="text-[10px] uppercase tracking-wider text-fg-1">
                  Hours
                </span>
              </div>
              <div class="text-2xl font-bold">:</div>
              <div class="flex flex-col items-center">
                <span class="text-2xl md:text-3xl font-mono font-bold">
                  {String(timeLeft()?.minutes).padStart(2, "0")}
                </span>
                <span class="text-[10px] uppercase tracking-wider text-fg-1">
                  Mins
                </span>
              </div>
              <div class="text-2xl font-bold">:</div>
              <div class="flex flex-col items-center">
                <span class="text-2xl md:text-3xl font-mono font-bold">
                  {String(timeLeft()?.seconds).padStart(2, "0")}
                </span>
                <span class="text-[10px] uppercase tracking-wider text-fg-1">
                  Secs
                </span>
              </div>
            </div>
          </Show>

          <Show when={state() === "ongoing"}>
            <p class="text-fg-1 font-sans text-lg">Happening now!</p>
          </Show>

          {/* Action Button */}
          <Show when={currentLink() !== undefined}>
            <a
              href={currentLink()!}
              target={getTarget(currentLink())}
              rel={getRel(currentLink())}
              class="w-fit mt-2 px-6 py-3 bg-fg-0 text-bg-0 font-bold font-sans hover:opacity-90 transition-opacity pointer-events-auto"
            >
              {buttonText()}
            </a>
          </Show>
        </div>
      </Show>
    </div>
  );
}
