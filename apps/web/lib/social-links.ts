import { configStore } from "@/lib/data-store.config";

export type SocialLink = {
  key: string;
  label: string;
  href: string;
};

export function getSocialLinks(): SocialLink[] {
  const config = configStore.get();
  const links: SocialLink[] = [];

  if (config.socialLinks.instagram) links.push({ key: "instagram", label: "Instagram", href: config.socialLinks.instagram });
  if (config.socialLinks.tiktok) links.push({ key: "tiktok", label: "TikTok", href: config.socialLinks.tiktok });
  if (config.socialLinks.youtube) links.push({ key: "youtube", label: "YouTube", href: config.socialLinks.youtube });
  if (config.socialLinks.twitter) links.push({ key: "twitter", label: "Twitter", href: config.socialLinks.twitter });
  if (config.socialLinks.facebook) links.push({ key: "facebook", label: "Facebook", href: config.socialLinks.facebook });

  if (links.length === 0) {
    return [
      { key: "instagram", label: "Instagram", href: "https://www.instagram.com/dydalo.oficial/" },
      { key: "tiktok", label: "TikTok", href: "https://www.tiktok.com/@dydalo" },
      { key: "facebook", label: "Facebook", href: "https://www.facebook.com/dydalo.oficial/" },
    ];
  }

  return links;
}

export const socialLinks = getSocialLinks();

export type SocialKey = string;
