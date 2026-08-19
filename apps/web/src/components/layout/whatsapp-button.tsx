"use client";

import { FaWhatsapp } from "react-icons/fa";

const PHONE = "51983107242";
const MESSAGE = encodeURIComponent("Hola DYDALO, quisiera informacion");
const WHATSAPP_URL = `https://wa.me/${PHONE}?text=${MESSAGE}`;

export function WhatsAppButton() {
  return (
    <a
      href={WHATSAPP_URL}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chatear por WhatsApp"
      className="group fixed bottom-[max(1.5rem,env(safe-area-inset-bottom))] right-[max(1.5rem,env(safe-area-inset-right))] z-40 flex h-14 w-14 items-center overflow-hidden rounded-full bg-gradient-to-br from-[#25D366] to-[#128C7E] text-white shadow-lg shadow-black/20 transition-all duration-300 hover:w-56 motion-safe:animate-bounce"
    >
      <span className="inline-flex size-14 shrink-0 items-center justify-center">
        <FaWhatsapp className="size-6" />
      </span>
      <span className="whitespace-nowrap pr-4 text-sm font-bold">
        Chatear por WhatsApp
      </span>
    </a>
  );
}
