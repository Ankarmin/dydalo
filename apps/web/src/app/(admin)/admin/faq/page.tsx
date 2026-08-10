import type { Metadata } from "next";
import { FaqClient } from "./faq-client";

export const metadata: Metadata = {
  title: "FAQ",
};

export default function FaqAdminPage() {
  return <FaqClient />;
}
