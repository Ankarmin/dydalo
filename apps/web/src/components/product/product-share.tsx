"use client";

import { useState } from "react";
import { Check, Copy, Link2, Share2 } from "lucide-react";
import { FaFacebook, FaTelegram, FaWhatsapp, FaXTwitter } from "react-icons/fa6";
import { Button } from "@/components/ui/button";
import {
  showShareErrorToast,
  showShareFailedToast,
  showShareSuccessToast,
} from "@/components/product/product-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ProductShareProps {
  productName: string;
}

function getShareData(productName: string) {
  const url = window.location.href;
  const encodedUrl = encodeURIComponent(url);
  const encodedText = encodeURIComponent(`Mira ${productName} en DYDALO`);

  return {
    url,
    text: `Mira ${productName} en DYDALO`,
    links: {
      whatsapp: `https://wa.me/?text=${encodedText}%20${encodedUrl}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      x: `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`,
      telegram: `https://t.me/share/url?url=${encodedUrl}&text=${encodedText}`,
    },
  };
}

export function ProductShare({ productName }: ProductShareProps) {
  const [copied, setCopied] = useState(false);

  const openShareLink = (url: string) => {
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const shareProduct = async () => {
    const { url, text } = getShareData(productName);

    if (navigator.share) {
      try {
        await navigator.share({ title: productName, text, url });
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
        showShareFailedToast();
      }
      return;
    }

    await copyLink();
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      showShareSuccessToast();
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      showShareErrorToast();
    }
  };

  const shareData = () => getShareData(productName);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="rounded-lg border border-border bg-background/80"
          aria-label={`Compartir ${productName}`}
        >
          <Share2 className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuItem onSelect={shareProduct}>
          <Share2 />
          Compartir dispositivo
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => openShareLink(shareData().links.whatsapp)}>
          <FaWhatsapp className="text-[#25D366]" />
          WhatsApp
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => openShareLink(shareData().links.facebook)}>
          <FaFacebook className="text-[#1877F2]" />
          Facebook
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => openShareLink(shareData().links.x)}>
          <FaXTwitter />
          X
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => openShareLink(shareData().links.telegram)}>
          <FaTelegram className="text-[#229ED9]" />
          Telegram
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={copyLink}>
          {copied ? <Check className="text-success" /> : <Copy />}
          {copied ? "Enlace copiado" : "Copiar enlace"}
          <Link2 className="ml-auto opacity-50" />
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
