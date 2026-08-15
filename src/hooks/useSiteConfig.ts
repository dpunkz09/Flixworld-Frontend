"use client";

import { createContext, useContext, useEffect, useState } from "react";
import {
  type SiteConfig,
  SITE_CONFIG_DEFAULT as DEFAULT,
  fetchSiteConfig,
} from "@/lib/site-config";

export type { SiteConfig };
export { fetchSiteConfig };

const SiteConfigContext = createContext<SiteConfig>(DEFAULT);

export function useSiteConfig(): SiteConfig {
  return useContext(SiteConfigContext);
}

export function useSiteConfigProvider(): SiteConfig {
  const [config, setConfig] = useState<SiteConfig>(DEFAULT);
  useEffect(() => {
    fetchSiteConfig().then(setConfig).catch(() => setConfig(DEFAULT));
  }, []);
  return config;
}

export { SiteConfigContext };
