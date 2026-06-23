import { apiRequest } from "./api";
import type { Feedback } from "../types";

export type CreateFeedbackData = {
  subject: string;
  message: string;
  screenshot?: File | null;
};

type FeedbackResponse = {
  message: string;
  feedback: Feedback;
};

type FeedbacksResponse = {
  message: string;
  feedbacks: Feedback[];
};

export function createFeedback(data: CreateFeedbackData) {
  const formData = new FormData();
  formData.append("subject", data.subject);
  formData.append("message", data.message);
  if (data.screenshot) formData.append("screenshot", data.screenshot);

  return apiRequest<FeedbackResponse>("/feedback", {
    method: "POST",
    body: formData,
  });
}

export function getFeedbacks() {
  return apiRequest<FeedbacksResponse>("/feedback");
}

export function deleteFeedback(id: string) {
  return apiRequest<{ message: string }>(`/feedback/${id}`, {
    method: "DELETE",
  });
}
