export const socialLinks = [
  {
    key: "instagram",
    label: "Instagram",
    href: "https://www.instagram.com/dydalo.oficial/",
  },
  {
    key: "tiktok",
    label: "TikTok",
    href: "https://www.tiktok.com/@dydalo",
  },
  {
    key: "facebook",
    label: "Facebook",
    href: "https://www.facebook.com/dydalo.oficial/",
  },
] as const;

export type SocialKey = (typeof socialLinks)[number]["key"];
