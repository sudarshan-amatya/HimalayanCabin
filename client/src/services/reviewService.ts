import { apiRequest } from "./api";
import type { Cabin, Review } from "../types";

type ReviewsResponse = {
  message: string;
  reviews: Review[];
  rating: number;
  reviewCount: number;
};

type MyReviewResponse = {
  message: string;
  review: Review | null;
};

type ReviewResponse = {
  message: string;
  review: Review | null;
  cabin: Cabin;
};

export type ReviewFormData = {
  rating: number;
  comment: string;
};

export function getCabinReviews(cabinId: string) {
  return apiRequest<ReviewsResponse>(`/reviews/cabins/${cabinId}`);
}

export function getMyCabinReview(cabinId: string) {
  return apiRequest<MyReviewResponse>(`/reviews/cabins/${cabinId}/my`);
}

export function saveCabinReview(cabinId: string, data: ReviewFormData) {
  return apiRequest<ReviewResponse>(`/reviews/cabins/${cabinId}`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function deleteMyCabinReview(cabinId: string) {
  return apiRequest<ReviewResponse>(`/reviews/cabins/${cabinId}/my`, {
    method: "DELETE",
  });
}
