import { supabase } from "@/lib/integrations/supabase/client";
import { Order, OrderReview, Vendor } from "../types/orders";

export const orderService = {
  async fetchOrders(): Promise<Order[]> {
    const { data, error } = await supabase
      .from("orders")
      .select("*, products(name, vendor_id), vendors(business_name)")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return (data as unknown as Order[]) || [];
  },

  async fetchVendors(): Promise<Vendor[]> {
    const { data, error } = await supabase
      .from("vendors")
      .select("id, business_name, rating, total_jobs, verification_status");

    if (error) throw error;
    return (data as unknown as Vendor[]) || [];
  },

  async fetchReviews(): Promise<OrderReview[]> {
    const { data, error } = await supabase
      .from("order_reviews")
      .select("*");

    if (error) throw error;
    return (data as unknown as OrderReview[]) || [];
  },
};
