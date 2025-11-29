"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

interface TenantBranding {
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  fontFamily?: string;
  faviconUrl?: string;
  customCss?: string;
}

export function TenantBrandingProvider({ branding }: { branding: TenantBranding | null }) {
  const pathname = usePathname();

  useEffect(() => {
    if (!branding) return;

    // Apply CSS variables for colors
    const root = document.documentElement;
    if (branding.primaryColor) {
      root.style.setProperty("--primary", branding.primaryColor);
    }
    if (branding.secondaryColor) {
      root.style.setProperty("--secondary", branding.secondaryColor);
    }
    if (branding.accentColor) {
      root.style.setProperty("--accent", branding.accentColor);
    }
    if (branding.fontFamily) {
      root.style.setProperty("--font-family", branding.fontFamily);
    }

    // Apply favicon
    if (branding.faviconUrl) {
      const link = document.querySelector("link[rel='icon']") as HTMLLinkElement;
      if (link) {
        link.href = branding.faviconUrl;
      } else {
        const newLink = document.createElement("link");
        newLink.rel = "icon";
        newLink.href = branding.faviconUrl;
        document.head.appendChild(newLink);
      }
    }

    // Apply custom CSS
    if (branding.customCss) {
      const styleId = "tenant-custom-css";
      let style = document.getElementById(styleId) as HTMLStyleElement;
      if (!style) {
        style = document.createElement("style");
        style.id = styleId;
        document.head.appendChild(style);
      }
      style.textContent = branding.customCss;
    }
  }, [branding, pathname]);

  return null;
}

