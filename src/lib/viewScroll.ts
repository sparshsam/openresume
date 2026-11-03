const WORKSPACE_SCROLL_CONTAINERS = '.editor, .preview-region';

/**
 * Puts the viewport and the workspace's own scroll areas back at the top.
 *
 * A single-page view swap does not reset the document scroll position, so
 * entering the workspace from a scrolled preparation screen would leave it
 * part-way down. Called from a layout effect, before the browser paints.
 *
 * Any focus outside the workspace is released first; a focused element can
 * scroll itself into view after the reset and silently undo it.
 */
export function resetViewScroll(workspace: HTMLElement | null): void {
  const active = document.activeElement;
  if (active instanceof HTMLElement && !workspace?.contains(active)) {
    active.blur();
  }

  window.scrollTo(0, 0);

  const page = document.scrollingElement ?? document.documentElement;
  if (page) page.scrollTop = 0;
  if (document.body) document.body.scrollTop = 0;

  for (const element of workspace?.querySelectorAll<HTMLElement>(WORKSPACE_SCROLL_CONTAINERS) ??
    []) {
    element.scrollTop = 0;
  }
}
