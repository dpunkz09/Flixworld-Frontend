"use client";

import { useMemo, type ReactNode } from "react";
import { SiteConfigContext } from "@/hooks/useSiteConfig";
import type { SiteConfig } from "@/lib/site-config";

interface Props {
  initialConfig?: SiteConfig;
  children: ReactNode;
}

export default function SiteConfigProvider({ initialConfig, children }: Props) {
  // Use the server-fetched config directly — no client-side re-fetch needed
  const value = useMemo(() => initialConfig ?? null, [initialConfig]);
  return (
    <SiteConfigContext.Provider value={value!}>
      {children}
    </SiteConfigContext.Provider>
  );
}
