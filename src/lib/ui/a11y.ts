// Keyboard activation for elements styled as buttons via role="button". Keeps
// the onkeydown attribute present (so the a11y lint stays satisfied) while
// sharing the Enter/Space-to-click logic across such elements.
export function onActivate(handler: () => void): (e: KeyboardEvent) => void {
  return (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handler();
    }
  };
}
