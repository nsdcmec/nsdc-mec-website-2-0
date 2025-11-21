import { createSignal, onMount } from "solid-js";

type Theme = "light" | "dark" | "system";

const SunIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    class="h-5 w-5"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    stroke-width="2"
  >
    <path
      stroke-linecap="round"
      stroke-linejoin="round"
      d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707"
    />
  </svg>
);
const MoonIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    class="h-5 w-5"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    stroke-width="2"
  >
    <path
      stroke-linecap="round"
      stroke-linejoin="round"
      d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
    />
  </svg>
);
const SystemIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    class="h-5 w-5"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    stroke-width="2"
  >
    <path
      stroke-linecap="round"
      stroke-linejoin="round"
      d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
    />
  </svg>
);

export default function ThemeToggle() {
  const [theme, setTheme] = createSignal<Theme>("system");

  onMount(() => {
    const stored = localStorage.getItem("theme") as Theme | null;
    if (stored) setTheme(stored);
  });

  const updateTheme = (newTheme: Theme) => {
    setTheme(newTheme);
    const root = document.documentElement;

    root.classList.remove("light", "dark");

    if (newTheme === "system") {
      localStorage.removeItem("theme");
    } else {
      root.classList.add(newTheme);
      localStorage.setItem("theme", newTheme);
    }
  };

  const btnClass = (btnType: Theme) =>
    `p-1.5 rounded-full transition-colors ${
      theme() === btnType
        ? "bg-bg-1 text-fg-0 shadow-sm"
        : "text-fg-1 hover:text-fg-0"
    }`;

  return (
    <div class="flex items-center space-x-2 rounded-full bg-bg-2 p-1">
      <button
        onClick={() => updateTheme("light")}
        class={btnClass("light")}
        aria-label="Switch to light theme"
      >
        <SunIcon />
      </button>

      <button
        onClick={() => updateTheme("dark")}
        class={btnClass("dark")}
        aria-label="Switch to dark theme"
      >
        <MoonIcon />
      </button>

      <button
        onClick={() => updateTheme("system")}
        class={btnClass("system")}
        aria-label="Switch to system theme"
      >
        <SystemIcon />
      </button>
    </div>
  );
}
