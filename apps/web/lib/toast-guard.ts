export function ignoreToastClicks(e: Event) {
  const target = e.target as HTMLElement;
  if (target.closest("[data-toast-notification]")) {
    e.preventDefault();
  }
}
