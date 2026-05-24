import { apiClient } from "@/lib/axios";
import { Order, OrderReview, Vendor } from "../types/orders";

export const orderService = {
  async fetchOrders(): Promise<Order[]> {
    try {
      const r = await apiClient.get('/orders');
      return (r.data as Order[]) || [];
    } catch (err) {
      throw err;
    }
  },

  async fetchVendors(): Promise<Vendor[]> {
    try {
      const r = await apiClient.get('/vendors', { params: { fields: 'id,business_name,rating,total_jobs,verification_status' } });
      return (r.data as Vendor[]) || [];
    } catch (err) {
      throw err;
    }
  },

  async fetchReviews(): Promise<OrderReview[]> {
    try {
      const r = await apiClient.get('/order-reviews');
      return (r.data as OrderReview[]) || [];
    } catch (err) {
      throw err;
    }
  },
};
