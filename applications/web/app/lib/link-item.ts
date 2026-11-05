/**
 * Shape of a shortened link as the UI sees it.
 * Kept independent from the storage layer so the UI does not change
 * when the in-memory Map is replaced by a database.
 */
export type LinkItem = {
  code: string;
  url: string;
  shortUrl: string;
  clicks: number;
  createdAt: string; // ISO date
};
