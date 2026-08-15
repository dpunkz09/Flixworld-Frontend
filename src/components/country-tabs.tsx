"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";

interface CountryTabsProps {
  activeTab: "movies" | "tv";
}

export default function CountryTabs({ activeTab }: CountryTabsProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function switchTab(tab: "movies" | "tv") {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", tab);
    params.delete("page");
    params.delete("genres"); // reset genre filter on tab switch
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  }

  return (
    <div className="px-4 md:px-12 lg:px-20 pb-2 flex gap-1">
      {(["movies", "tv"] as const).map((tab) => (
        <button
          key={tab}
          onClick={() => switchTab(tab)}
          aria-pressed={activeTab === tab}
          className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
            activeTab === tab
              ? "bg-red-600 text-white"
              : "text-zinc-400 hover:text-white hover:bg-white/5 border border-white/10"
          }`}
        >
          {tab === "movies" ? "Movies" : "TV Shows"}
        </button>
      ))}
    </div>
  );
}
