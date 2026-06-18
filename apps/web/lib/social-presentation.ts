import {
  FaFacebook,
  FaInstagram,
  FaTiktok,
} from "react-icons/fa";
import type { IconType } from "react-icons";
import type { SocialKey } from "./social-links";

export const socialPresentation: Record<
  SocialKey,
  { icon: IconType; gradient: string }
> = {
  facebook: {
    icon: FaFacebook,
    gradient: "from-[#1877F2] to-[#0C5DC7]",
  },
  instagram: {
    icon: FaInstagram,
    gradient: "from-[#833AB4] via-[#E1306C] to-[#F77737]",
  },
  tiktok: {
    icon: FaTiktok,
    gradient: "from-[#111111] to-[#444444]",
  },
};
