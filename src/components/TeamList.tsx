import {
  createSignal,
  createMemo,
  For,
  Show,
  onMount,
  onCleanup,
  createEffect,
} from "solid-js";
import type { TeamMember } from "../types";

interface TeamListProps {
  members: TeamMember[];
  allYears: { id: number; title: string }[];
  currentYear: number;
}

export default function TeamList(props: TeamListProps) {
  const [activeRole, setActiveRole] = createSignal("all");
  const [isYearOpen, setIsYearOpen] = createSignal(false);

  let yearSelectorRef: HTMLDivElement | undefined;

  const roles = createMemo(() => {
    const r = new Set(["all"]);
    const sortedMembers = [...props.members].sort(
      (a, b) => (a.priority || 0) - (b.priority || 0),
    );
    sortedMembers.forEach((m) => {
      if (m.role) r.add(m.role);
    });
    return Array.from(r);
  });

  const filteredGroups = createMemo(() => {
    const groups: Record<string, TeamMember[]> = {};
    const membersToFilter =
      activeRole() === "all"
        ? props.members
        : props.members.filter((m) => m.role === activeRole());

    membersToFilter.forEach((m) => {
      const role = m.role || "Other";
      if (!groups[role]) groups[role] = [];
      groups[role].push(m);
    });

    return Object.keys(groups)
      .sort((a, b) => {
        const firstA = groups[a][0]?.priority || 99;
        const firstB = groups[b][0]?.priority || 99;
        return firstA - firstB;
      })
      .map((role) => ({
        name: role,
        members: groups[role].sort(
          (a, b) => (a.priority || 0) - (b.priority || 0),
        ),
      }));
  });

  // Reset scroll on filter change
  createEffect(() => {
    activeRole();
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  });

  onMount(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (isYearOpen() && yearSelectorRef && !yearSelectorRef.contains(target))
        setIsYearOpen(false);
    };
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsYearOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEsc);
    onCleanup(() => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEsc);
    });
  });

  return (
    <div class="bg-bg-0 min-h-screen text-fg-0 font-sans">
      {/* Mobile Sticky Header */}
      <div class="lg:hidden sticky top-10 z-40 bg-bg-0/95 backdrop-blur-md border-b-2 border-fg-0 h-[114px] flex flex-col">
        <div class="flex justify-between items-center px-4 h-[56px] border-b-2 border-fg-0/10 box-border">
          <h1 class="text-2xl font-bold uppercase tracking-tighter">Team</h1>
          <div class="relative" ref={yearSelectorRef}>
            <button
              onClick={() => setIsYearOpen(!isYearOpen())}
              class="border-2 border-fg-0 px-3 py-1 flex items-center gap-2 font-mono font-bold text-sm"
            >
              {props.currentYear}
              <svg
                class={`w-4 h-4 transition-transform ${isYearOpen() ? "rotate-180" : ""}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path stroke-width="3" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            <Show when={isYearOpen()}>
              <div class="absolute right-0 top-full mt-[-2px] z-50 bg-bg-0 border-2 border-fg-0 w-32">
                <For each={props.allYears}>
                  {(year) => (
                    <button
                      onClick={() =>
                        (window.location.href = `/teams/${year.id}`)
                      }
                      class={`w-full px-4 py-2 text-right font-mono text-lg border-b-2 border-fg-0 last:border-b-0 ${year.id === props.currentYear ? "bg-fg-0 text-bg-0" : "hover:bg-primary hover:text-primary-fg"}`}
                    >
                      {year.title}
                    </button>
                  )}
                </For>
              </div>
            </Show>
          </div>
        </div>
        <div class="w-full overflow-x-auto scrollbar-hide h-13 flex items-center box-border">
          <div class="flex items-center -ml-0.5 px-2 w-max">
            <For each={roles()}>
              {(role) => (
                <button
                  onClick={() => setActiveRole(role)}
                  class={`px-4 py-1.5 border-1 border-fg-0 text-xs font-bold uppercase transition-colors whitespace-nowrap ${
                    activeRole() === role
                      ? "bg-fg-0 text-bg-0"
                      : "bg-bg-0 text-fg-0 hover:bg-fg-0 hover:text-bg-0"
                  }`}
                >
                  {role}
                </button>
              )}
            </For>
          </div>
        </div>
      </div>

      <section class="py-16 lg:py-24 bg-bg-0 transition-colors duration-300">
        <div class="container mx-auto px-4 sm:px-6 lg:px-8">
          <div class="grid grid-cols-1 lg:grid-cols-12 gap-12">
            {/* Desktop Sidebar */}
            <div class="hidden lg:block lg:col-span-3">
              <div class="lg:sticky lg:top-24 space-y-8">
                <h1 class="text-4xl md:text-6xl font-bold text-fg-0 uppercase tracking-tighter leading-tight">
                  Team
                </h1>
                <div class="relative w-full" ref={yearSelectorRef}>
                  <button
                    onClick={() => setIsYearOpen(!isYearOpen())}
                    class="w-full flex items-center justify-between border-2 border-fg-0 px-4 py-2 hover:bg-fg-0 hover:text-bg-0 transition-colors uppercase font-mono font-bold"
                  >
                    <div class="flex flex-col items-start text-left">
                      <span class="text-[10px] tracking-[0.3em] opacity-60">
                        YEAR
                      </span>
                      <span class="text-2xl tracking-tighter">
                        {props.currentYear}
                      </span>
                    </div>
                    <svg
                      class={`w-6 h-6 transition-transform ${isYearOpen() ? "rotate-180" : ""}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path stroke-width="3" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  <Show when={isYearOpen()}>
                    <div class="absolute left-0 top-full mt-[-2px] z-50 bg-bg-0 border-2 border-fg-0 w-full">
                      <For each={props.allYears}>
                        {(year) => (
                          <button
                            onClick={() =>
                              (window.location.href = `/teams/${year.id}`)
                            }
                            class={`w-full px-6 py-4 text-left font-mono text-2xl border-b-2 border-fg-0 last:border-b-0 hover:bg-primary hover:text-primary-fg transition-colors ${year.id === props.currentYear ? "bg-fg-0 text-bg-0" : "text-fg-0"}`}
                          >
                            {year.title}
                          </button>
                        )}
                      </For>
                    </div>
                  </Show>
                </div>
                <div class="space-y-4">
                  <p class="text-[10px] font-bold uppercase tracking-[0.3em] opacity-60">
                    Filter by Role
                  </p>
                  <nav class="flex flex-col border-l-2 border-bg-2">
                    <For each={roles()}>
                      {(role) => (
                        <button
                          onClick={() => setActiveRole(role)}
                          class={`group flex items-center gap-3 py-2 pl-4 border-l-2 -ml-[2px] transition-all ${activeRole() === role ? "border-fg-0 font-bold text-fg-0" : "border-transparent text-fg-1 hover:border-fg-0/30 hover:text-fg-0"}`}
                        >
                          <span
                            class={`text-xs uppercase tracking-widest ${activeRole() === role ? "text-fg-0" : "text-fg-1 group-hover:text-fg-0"}`}
                          >
                            {role}
                          </span>
                        </button>
                      )}
                    </For>
                  </nav>
                </div>
              </div>
            </div>

            {/* Main Content Area */}
            <div class="lg:col-span-9 flex flex-col">
              <For each={filteredGroups()}>
                {(group) => (
                  <div class="flex flex-col ">
                    {/* Sticky Boundary Start */}
                    <div class="sticky top-[154px] lg:top-10 z-30 bg-bg-0 py-2">
                      <div class="flex items-center gap-4 border-b-2 border-fg-0/10">
                        <h2 class="text-2xl font-bold uppercase tracking-widest text-fg-0 pb-2">
                          {group.name}
                        </h2>
                        <div class="flex-grow"></div>
                      </div>
                    </div>

                    {/* Container with padding to hold the borders exactly in place */}
                    <div class="mt-8 mx-2 pb-16">
                      <div class="flex flex-wrap justify-center -ml-[2px] -mt-[2px]">
                        <For each={group.members}>
                          {(member) => {
                            const socials =
                              member.social_links &&
                              member.social_links.length > 0
                                ? member.social_links
                                : [
                                    {
                                      name: "LinkedIn",
                                      url: "https://linkedin.com",
                                    },
                                    {
                                      name: "GitHub",
                                      url: "https://github.com",
                                    },
                                  ];

                            return (
                              <div class="flex flex-col border-2 border-fg-0 p-6 bg-bg-0 rounded-none w-full sm:w-1/2 lg:w-1/3 max-w-[340px] sm:max-w-none -ml-[2px] -mt-[2px] box-border relative z-10">
                                <div class="aspect-[3/4] overflow-hidden bg-bg-1">
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
                                <div class="pt-6 flex flex-col flex-grow">
                                  <div class="mb-4">
                                    <h3 class="text-xl font-bold text-fg-0 uppercase leading-tight mb-1">
                                      {member.name}
                                    </h3>
                                    <p class="text-[10px] font-mono text-primary font-bold tracking-[0.2em] uppercase">
                                      {member.position}
                                    </p>
                                  </div>
                                  <Show when={member.description}>
                                    <p class="text-xs text-fg-1 leading-relaxed mb-6 line-clamp-3 italic opacity-70">
                                      {member.description}
                                    </p>
                                  </Show>

                                  <div class="flex justify-between items-center pt-4 border-t-2 border-fg-0/10 mt-auto">
                                    <For each={socials.slice(0, 2)}>
                                      {(link) => (
                                        <a
                                          href={link.url}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          class="relative group py-1 text-[10px] font-bold font-mono uppercase tracking-widest text-fg-1 hover:text-fg-0 transition-colors"
                                        >
                                          <span>{link.name}</span>
                                          <span class="absolute bottom-0 right-0 h-[1px] w-full bg-fg-0 transform scale-x-0 origin-right transition-transform duration-300 ease-out group-hover:scale-x-100 group-hover:origin-left" />
                                        </a>
                                      )}
                                    </For>
                                  </div>
                                </div>
                              </div>
                            );
                          }}
                        </For>
                      </div>
                    </div>
                  </div>
                )}
              </For>
              <Show when={filteredGroups().length === 0}>
                <div class="py-32 text-center border-2 border-fg-0">
                  <p class="text-fg-1 font-mono uppercase tracking-[0.2em] text-sm">
                    No members matching selection.
                  </p>
                </div>
              </Show>
            </div>
          </div>
        </div>
      </section>
      <style>{`.scrollbar-hide::-webkit-scrollbar { display: none; } .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }`}</style>
    </div>
  );
}
