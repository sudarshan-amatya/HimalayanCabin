import { apiRequest } from "./api";
import type { Bookmark } from "../types";

type BookmarksResponse = {
  message: string;
  bookmarks: Bookmark[];
};

type BookmarkStatusResponse = {
  message: string;
  bookmarked: boolean;
};

type BookmarkActionResponse = {
  message: string;
  bookmark?: Bookmark;
  bookmarked: boolean;
};

export function getMyBookmarks() {
  return apiRequest<BookmarksResponse>("/bookmarks");
}

export function getBookmarkStatus(cabinId: string) {
  return apiRequest<BookmarkStatusResponse>(`/bookmarks/${cabinId}/status`);
}

export function addBookmark(cabinId: string) {
  return apiRequest<BookmarkActionResponse>(`/bookmarks/${cabinId}`, {
    method: "POST",
  });
}

export function removeBookmark(cabinId: string) {
  return apiRequest<BookmarkActionResponse>(`/bookmarks/${cabinId}`, {
    method: "DELETE",
  });
}
