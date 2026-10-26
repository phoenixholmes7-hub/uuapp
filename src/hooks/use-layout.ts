import { useWindowDimensions } from 'react-native';

/** Width at which the app switches to a side-by-side, two-pane layout. */
const TWO_PANE_MIN = 600;
/**
 * Up to this width the window is most likely an unfolded book-style foldable
 * (Galaxy Z Fold, Pixel Fold, ...), whose hinge sits in the middle. Splitting
 * exactly at half keeps both panes clear of the crease.
 */
const FOLDABLE_MAX = 1000;
const LIST_PANE_WIDE = 400;

export type LayoutInfo = {
  width: number;
  height: number;
  twoPane: boolean;
  /** Width of the list pane when the page pane is open. */
  listWidth: number;
  /** Width of the page pane when open in two-pane mode. */
  pageWidth: number;
};

/**
 * Derived from the live window size, so it updates the moment a device is
 * folded, unfolded, rotated or resized in split-screen.
 */
export function useLayout(): LayoutInfo {
  const { width, height } = useWindowDimensions();
  const twoPane = width >= TWO_PANE_MIN;
  const listWidth = !twoPane
    ? width
    : width <= FOLDABLE_MAX
      ? Math.round(width / 2)
      : LIST_PANE_WIDE;
  return {
    width,
    height,
    twoPane,
    listWidth,
    pageWidth: width - listWidth,
  };
}

/** Width available to the main screens, given whether the page pane is open. */
export function useContentWidth(pageOpen: boolean) {
  const layout = useLayout();
  return layout.twoPane && pageOpen ? layout.listWidth : layout.width;
}

/** Grid columns for a pane of the given width. */
export function columnsFor(paneWidth: number) {
  if (paneWidth < 540) return 2;
  if (paneWidth < 820) return 3;
  return 4;
}
