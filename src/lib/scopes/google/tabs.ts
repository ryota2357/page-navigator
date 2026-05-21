import { defineAction } from "@/lib/action";

// Sub-tab nav lives in two places depending on viewport / experiment bucket:
// the inline tab bar near the search box, or the overflow "more" menu. Google
// has also been migrating `tbm=` query params to `udm=`, so each tab keeps
// fallbacks across both schemes. First match wins.
export const SUB_TAB_SELECTORS = {
  search: [
    // "All" tab — a /search link with neither a tab-mode param nor a domain
    // hop. The `:not(...)` filters exclude image/video/maps variants.
    'a[href*="/search?"]:not([href*="tbm="]):not([href*="udm="]):not([href*="maps.google."])',
  ],
  images: ['a[href*="tbm=isch"]', 'a[href*="udm=2"]'],
  videos: ['a[href*="tbm=vid"]', 'a[href*="udm=7"]'],
  maps: ['a[href*="maps.google."]'],
  news: ['a[href*="tbm=nws"]', 'a[href*="udm=12"]'],
  shopping: ['a[href*="tbm=shop"]', 'a[href*="udm=28"]'],
  books: ['a[href*="tbm=bks"]', 'a[href*="udm=36"]'],
  flights: ['a[href*="tbm=flm"]'],
  financial: ['a[href*="/finance?"]', 'a[href*="/finance/"]'],
} as const;

type SubTabId = keyof typeof SUB_TAB_SELECTORS;

function defineSubTabAction<Id extends `google.${string}`>(
  id: Id,
  description: string,
  tab: SubTabId,
) {
  return defineAction(id, {
    description,
    optionSchema: {},
    defaults: {},
    run: () => {
      for (const sel of SUB_TAB_SELECTORS[tab]) {
        const link = document.querySelector<HTMLAnchorElement>(sel);
        if (link != null) {
          link.click();
          return;
        }
      }
    },
  });
}

export const navigateSearchTabAction = defineSubTabAction(
  "google.navigateSearchTab",
  "Switch to the All (Web) search tab.",
  "search",
);

export const navigateImagesTabAction = defineSubTabAction(
  "google.navigateImagesTab",
  "Switch to the Images tab.",
  "images",
);

export const navigateVideosTabAction = defineSubTabAction(
  "google.navigateVideosTab",
  "Switch to the Videos tab.",
  "videos",
);

export const navigateMapsTabAction = defineSubTabAction(
  "google.navigateMapsTab",
  "Switch to the Maps tab.",
  "maps",
);

export const navigateNewsTabAction = defineSubTabAction(
  "google.navigateNewsTab",
  "Switch to the News tab.",
  "news",
);

export const navigateShoppingTabAction = defineSubTabAction(
  "google.navigateShoppingTab",
  "Switch to the Shopping tab.",
  "shopping",
);

export const navigateBooksTabAction = defineSubTabAction(
  "google.navigateBooksTab",
  "Switch to the Books tab.",
  "books",
);

export const navigateFlightsTabAction = defineSubTabAction(
  "google.navigateFlightsTab",
  "Switch to the Flights tab.",
  "flights",
);

export const navigateFinancialTabAction = defineSubTabAction(
  "google.navigateFinancialTab",
  "Switch to the Finance tab.",
  "financial",
);
