/**
 * DealLakay REVIEWS API (mobile) — currently used only for rating a Moto
 * Driver after a completed trip. Reuses the EXISTING POST /reviews
 * endpoint (already used by the website for seller/technician reviews),
 * extended server-side to accept target_type: "driver" — no new review
 * system.
 */
import { apiClient } from "./client";

export const reviewsApi = {
  rateDriver: (driverId: string, tripId: string, rating: number, comment: string = "") =>
    apiClient.post<{ message: string }>("/reviews", {
      seller_id: driverId,
      target_type: "driver",
      trip_id: tripId,
      rating,
      comment,
    }),
};
