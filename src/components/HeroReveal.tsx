/**
 * HeroReveal.tsx
 *
 * Single-step, ultra-premium Framer-style typography reveal.
 * Removes the blur and secondary sway entirely. Uses a pure 3D perspective 
 * transform (translating Y and Z while rotating X) with a spring-like 
 * bezier curve to create a crisp, flawless "fly in and settle" effect.
 *
 * NOTE: Styles are defined in src/styles/global.css to prevent FOUC.
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

  const [local, rest] = splitProps(merged, [
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

  const [local, rest] = splitProps(merged, [
    "index",
    "staggerMs",
    "durationMs",
    "delayMs",
    "as",
    "class",
    "style",
    "children",
  ]);

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
