import { createSignal, createMemo, For, Show } from "solid-js";
import type { TeamMember } from "../types";

interface TeamListProps {
  members: TeamMember[];
  allYears: { id: number; title: string }[];
  currentYear: number;
}

export default function TeamList(props: TeamListProps) {
  const [activeRole, setActiveRole] = createSignal("all");
  const [isYearOpen, setIsYearOpen] = createSignal(false);

  const roles = createMemo(() => {
    const r = new Set(["all"]);
    props.members.forEach((m) => {
      if (m.role) r.add(m.role);
    });
    return Array.from(r);
  });

  const filteredMembers = createMemo(() => {
    if (activeRole() === "all") return props.members;
    return props.members.filter((member) => member.role === activeRole());
  });

  const handleYearChange = (year: number) => {
    window.location.href = `/teams/${year}`;
  };

  return (
    <div class="bg-bg-0 min-h-screen text-fg-0">
      <section class="py-20 px-4 md:px-8 max-w-7xl mx-auto">
        {/* Header Area */}
        <div class="flex flex-col md:flex-row justify-between items-center mb-12 gap-8 pb-8 border-b border-fg-0/10">
          <h1 class="text-6xl lg:text-8xl font-sans font-bold text-fg-0 uppercase tracking-tighter">
            Team
          </h1>

          {/* Brutalist Year Selector - Inline Right */}
          <div class="relative inline-block">
            <button
              onClick={() => setIsYearOpen(!isYearOpen())}
              class="flex items-center gap-6 border-2 border-fg-0 px-6 py-3 hover:bg-fg-0 hover:text-bg-0 transition-colors uppercase font-mono font-bold"
            >
              <div class="flex flex-col items-start">
                <span class="text-[10px] tracking-[0.3em] opacity-60">
                  SELECT
                </span>
                <span class="text-3xl tracking-tighter">
                  {props.currentYear}
                </span>
              </div>
              <svg
                class={`w-5 h-5 transition-transform duration-200 ${isYearOpen() ? "rotate-180" : ""}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path stroke-width="3" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            <Show when={isYearOpen()}>
              <div class="absolute right-0 top-full mt-0 z-50 bg-bg-0 border-2 border-fg-0 min-w-[200px]">
                <div class="flex flex-col">
                  <For each={props.allYears}>
                    {(year) => (
                      <button
                        onClick={() => handleYearChange(year.id)}
                        class={`px-6 py-4 text-right font-mono text-xl border-b border-fg-0/10 last:border-0 hover:bg-primary hover:text-primary-fg transition-colors ${year.id === props.currentYear ? "bg-fg-0 text-bg-0" : "text-fg-0"}`}
                      >
                        {year.title}
                      </button>
                    )}
                  </For>
                </div>
              </div>
            </Show>
          </div>
        </div>

        {/* Roles Filter - Centered with Flex Wrap */}
        <div class="flex justify-center flex-wrap gap-2 mb-16">
          <For each={roles()}>
            {(role) => (
              <button
                onClick={() => setActiveRole(role)}
                class={`px-5 py-2 border-2 text-[10px] font-bold uppercase tracking-[0.2em] transition-colors ${
                  activeRole() === role
                    ? "bg-fg-0 text-bg-0 border-fg-0"
                    : "border-fg-0/10 text-fg-1 hover:border-fg-0 hover:text-fg-0"
                }`}
              >
                {role}
              </button>
            )}
          </For>
        </div>

        {/* Members - Centered Flex Layout */}
        <div class="flex flex-wrap justify-center items-start ">
          <For each={filteredMembers()}>
            {(member) => (
              <div class="relative flex flex-col border-2 border-fg-0 p-8 bg-bg-0 w-full sm:w-[320px] md:w-[340px]">
                {/* 1:1 Aspect Ratio Image */}
                <div class="aspect-square overflow-hidden bg-bg-1 mb-8 border border-fg-0/10">
                  <Show
                    when={member.image_url}
                    fallback={
                      <div class="w-full h-full flex items-center justify-center text-fg-1/5 font-sans font-bold text-6xl uppercase tracking-tighter">
                        NSDC
                      </div>
                    }
                  >
                    <img
                      src={member.image_url as string}
                      alt={member.name}
                      class="w-full h-full object-cover"
                    />
                  </Show>
                </div>

                <div class="flex flex-col h-full overflow-hidden">
                  <div class="mb-4">
                    <h3 class="text-2xl font-bold font-sans text-fg-0 uppercase leading-none mb-2 truncate">
                      {member.name}
                    </h3>
                    <p class="text-[10px] font-mono text-primary font-bold tracking-[0.2em] uppercase truncate">
                      {member.position}
                    </p>
                  </div>

                  <Show when={member.description}>
                    <p class="text-xs text-fg-1 font-sans leading-relaxed mb-6 line-clamp-4">
                      {member.description}
                    </p>
                  </Show>

                  <div class="flex gap-4 pt-4 border-t border-fg-0/5 mt-auto">
                    <Show when={member.social_links.linkedin}>
                      <a
                        href={member.social_links.linkedin}
                        target="_blank"
                        class="text-fg-1 hover:text-fg-0 transition-colors uppercase font-mono text-[10px] font-bold tracking-widest"
                      >
                        In
                      </a>
                    </Show>
                    <Show when={member.social_links.github}>
                      <a
                        href={member.social_links.github}
                        target="_blank"
                        class="text-fg-1 hover:text-fg-0 transition-colors uppercase font-mono text-[10px] font-bold tracking-widest"
                      >
                        Git
                      </a>
                    </Show>
                    <Show when={member.social_links.website}>
                      <a
                        href={member.social_links.website}
                        target="_blank"
                        class="text-fg-1 hover:text-fg-0 transition-colors uppercase font-mono text-[10px] font-bold tracking-widest"
                      >
                        Web
                      </a>
                    </Show>
                  </div>
                </div>
              </div>
            )}
          </For>
        </div>

        {/* Empty State */}
        <Show when={filteredMembers().length === 0}>
          <div class="py-32 text-center border border-fg-0/10">
            <p class="text-fg-1 font-mono uppercase tracking-[0.2em] text-sm">
              No members matching selection.
            </p>
          </div>
        </Show>
      </section>
      <style>{`.scrollbar-hide::-webkit-scrollbar { display: none; } .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }`}</style>
    </div>
  );
}
