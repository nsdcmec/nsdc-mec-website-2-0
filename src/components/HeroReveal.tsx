
/**
 * HeroReveal.tsx
 *
 * Single-step, ultra-premium Framer-style typography reveal.
 * Removes the blur and secondary sway entirely. Uses a pure 3D perspective 
 * transform (translating Y and Z while rotating X) with a spring-like 
 * bezier curve to create a crisp, flawless "fly in and settle" effect.
 */

import { type JSX, splitProps, mergeProps, For } from "solid-js";
import { Dynamic } from "solid-js/web";

interface HeroRevealProps {
  index?: number;
  staggerMs?: number;
  durationMs?: number;
  delayMs?: number;
  as?: string;
  class?: string;
  style?: JSX.CSSProperties | string;
  children?: JSX.Element;
}

interface HeroTextSplitProps extends Omit<HeroRevealProps, "children"> {
  text: string;
  wordStaggerMs?: number;
}

// Inject the premium cinematic keyframes into the document <head>
function ensureKeyframes() {
  if (typeof document === "undefined") return; // SSR guard
  const id = "__hero-framer-reveal-kf__";
  if (document.getElementById(id)) return;

  const style = document.createElement("style");
  style.id = id;
  style.textContent = `
    /* 
      1. Framer Premium Fly-In:
      A crisp, 3D swooping entrance. It starts pushed down (Y), pushed back (Z), 
      and folded backward (rotateX). The perspective gives it physical depth.
      Once it hits 100%, it stays perfectly static.
    */
    @keyframes framer-premium-fly {
      0% {
        opacity: 0;
        transform: perspective(1200px) translateY(60px) translateZ(-60px) rotateX(-60deg);
      }
      100% {
        opacity: 1;
        transform: perspective(1200px) translateY(0px) translateZ(0px) rotateX(0deg);
      }
    }

    /* 
      2. Framer Fade-Up (For descriptions/buttons):
      A clean, pure 2D upward slide to contrast the 3D title reveal.
    */
    @keyframes framer-premium-fade {
      0% {
        opacity: 0;
        transform: translateY(30px);
      }
      100% {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .framer-word {
      will-change: transform, opacity;
      transform-style: preserve-3d;
      transform-origin: bottom center;
      /* 'both' ensures it remains hidden before the delay starts, and stays exactly at 100% after */
      animation: framer-premium-fly var(--reveal-duration) var(--reveal-easing) var(--reveal-delay) both;
    }

    .framer-fade {
      will-change: transform, opacity;
      animation: framer-premium-fade var(--reveal-duration) var(--reveal-easing) var(--reveal-delay) both;
    }
  `;
  document.head.appendChild(style);
}

// The core of the Framer aesthetic: The Spring Bezier.
// It accelerates sharply and then glides to a stop over a long tail.
const FRAMER_SPRING_EASING = "cubic-bezier(0.16, 1, 0.3, 1)";

/**
 * HeroTextSplit
 * Splits a string into words and applies the 3D staggered fly-in.
 */
export function HeroTextSplit(props: HeroTextSplitProps) {
  const merged = mergeProps(
    {
      index: 0,
      staggerMs: 200,      // Delay before the entire text block starts
      wordStaggerMs: 60,   // Rapid stagger between each individual word for a fast wave
      durationMs: 1200,    // 1.2s gives the spring easing enough time to look buttery smooth
      delayMs: 100,
      as: "div",
    },
    props
  );

  const [local, rest] = splitProps(merged,[
    "text",
    "index",
    "staggerMs",
    "wordStaggerMs",
    "durationMs",
    "delayMs",
    "as",
    "class",
    "style"
  ]);

  ensureKeyframes();

  const words = () => local.text.split(/\s+/);
  const baseDelayMs = () => local.delayMs + local.index * local.staggerMs;

  return (
    <Dynamic component={local.as} class={local.class} style={local.style} {...rest}>
      <For each={words()}>
        {(word, i) => {
          const wordDelay = baseDelayMs() + (i() * local.wordStaggerMs);
          return (
            <>
              <span
                class="inline-block framer-word"
                style={{
                  "--reveal-duration": `${local.durationMs}ms`,
                  "--reveal-easing": FRAMER_SPRING_EASING,
                  "--reveal-delay": `${wordDelay}ms`,
                }}
              >
                {word}
              </span>
              {" "}
            </>
          );
        }}
      </For>
    </Dynamic>
  );
}

/**
 * HeroRevealFade
 * A simple, crisp fade-up for descriptions and secondary text.
 */
export function HeroRevealFade(props: HeroRevealProps) {
  const merged = mergeProps(
    {
      index: 0,
      staggerMs: 200,
      durationMs: 1000,
      delayMs: 100,
      as: "div",
    },
    props
  );

  const [local, rest] = splitProps(merged,[
    "index",
    "staggerMs",
    "durationMs",
    "delayMs",
    "as",
    "class",
    "style",
    "children",
  ]);

  ensureKeyframes();
  const totalDelayMs = () => local.delayMs + local.index * local.staggerMs;

  const inlineStyle = (): JSX.CSSProperties => {
    const base: JSX.CSSProperties = {
      "--reveal-duration": `${local.durationMs}ms`,
      "--reveal-easing": FRAMER_SPRING_EASING,
      "--reveal-delay": `${totalDelayMs()}ms`,
    } as JSX.CSSProperties;

    if (typeof local.style === "object") {
      return { ...base, ...local.style };
    }
    return base;
  };

  return (
    <Dynamic
      component={local.as}
      class={`framer-fade${local.class ? ` ${local.class}` : ""}`}
      style={inlineStyle()}
      {...rest}
    >
      {local.children}
    </Dynamic>
  );
}

// Keeping the original HeroReveal as a fallback wrapper
export default HeroRevealFade;
