import { socialLinks } from "@/config/social-links";
import { socialPresentation } from "@/config/social-presentation";
import { cn } from "@/lib/utils/utils";

export function SocialWidget() {
  return (
    <nav
      aria-label="Redes sociales"
      className="fixed right-0 top-1/2 -translate-y-1/2 z-30 hidden sm:flex flex-col gap-2.5 p-2.5 rounded-l-2xl backdrop-blur-xl bg-background/60 border-l border-t border-b border-accent/30 shadow-lg shadow-black/10"
    >
      {socialLinks.map((link) => {
        const { icon: Icon, gradient } = socialPresentation[link.key];
        return (
          <a
            key={link.key}
            href={link.href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={link.label}
            className={cn(
              "flex items-center justify-center size-10 rounded-xl transition-all duration-300",
              "hover:scale-110 hover:shadow-md",
              "bg-gradient-to-br",
              gradient
            )}
          >
            <Icon className="size-[18px] text-white" />
          </a>
        );
      })}
    </nav>
  );
}
