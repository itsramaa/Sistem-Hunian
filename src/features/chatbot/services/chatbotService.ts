import { supabase } from "@/lib/integrations/supabase/client";
import { createAuditLog } from "@/shared/utils/auditLog";
import { KnowledgeEntry, KnowledgeFormData } from "../types/chatbot";

export const chatbotService = {
  async fetchKnowledge(page: number, pageSize: number, search?: string, category?: string) {
    let query = supabase
      .from("chatbot_knowledge")
      .select("*", { count: 'exact' });

    if (search) {
      query = query.or(`question.ilike.%${search}%,answer.ilike.%${search}%`);
    }

    if (category && category !== "all") {
      query = query.eq("category", category);
    }

    const { data, error, count } = await query
      .order("created_at", { ascending: false })
      .range((page - 1) * pageSize, page * pageSize - 1);
    
    if (error) throw error;
    return { entries: data as KnowledgeEntry[], total: count || 0 };
  },

  async fetchStats() {
    const { data, error } = await supabase
      .from("chatbot_knowledge")
      .select("category, is_active");
    
    if (error) throw error;

    const stats = {
      total: data.length,
      active: data.filter(k => k.is_active).length,
      inactive: data.filter(k => !k.is_active).length,
      categories: data.reduce((acc, curr) => {
        acc[curr.category] = (acc[curr.category] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    };

    return stats;
  },

  async checkDuplicate(question: string, excludeId?: string) {
    const { data } = await supabase
      .from("chatbot_knowledge")
      .select("id")
      .ilike("question", question.trim())
      .limit(1);
    
    if (data && data.length > 0) {
      if (excludeId && data[0].id === excludeId) {
        return false;
      }
      return true;
    }
    return false;
  },

  async createKnowledge(data: KnowledgeFormData) {
    const isDuplicate = await this.checkDuplicate(data.question);
    if (isDuplicate) {
      throw new Error("A similar question already exists");
    }

    const { data: insertedData, error } = await supabase.from("chatbot_knowledge").insert({
      question: data.question.trim(),
      answer: data.answer.trim(),
      category: data.category,
      keywords: data.keywords.split(",").map((k) => k.trim()).filter(Boolean),
      is_active: data.is_active,
    }).select().single();

    if (error) throw error;

    await createAuditLog({
      action: "create",
      entityType: "chatbot_knowledge",
      entityId: insertedData.id,
      newData: { question: data.question, category: data.category },
    });

    return insertedData;
  },

  async updateKnowledge(id: string, data: KnowledgeFormData) {
    const isDuplicate = await this.checkDuplicate(data.question, id);
    if (isDuplicate) {
      throw new Error("A similar question already exists");
    }

    const { error } = await supabase
      .from("chatbot_knowledge")
      .update({
        question: data.question.trim(),
        answer: data.answer.trim(),
        category: data.category,
        keywords: data.keywords.split(",").map((k) => k.trim()).filter(Boolean),
        is_active: data.is_active,
      })
      .eq("id", id);
    
    if (error) throw error;

    await createAuditLog({
      action: "update",
      entityType: "chatbot_knowledge",
      entityId: id,
      newData: { question: data.question, category: data.category },
    });
  },

  async deleteKnowledge(id: string) {
    const { error } = await supabase.from("chatbot_knowledge").delete().eq("id", id);
    if (error) throw error;

    await createAuditLog({
      action: "delete",
      entityType: "chatbot_knowledge",
      entityId: id,
    });
  },

  async toggleActive(id: string, is_active: boolean) {
    const { error } = await supabase
      .from("chatbot_knowledge")
      .update({ is_active })
      .eq("id", id);
    
    if (error) throw error;

    await createAuditLog({
      action: "update",
      entityType: "chatbot_knowledge",
      entityId: id,
      newData: { is_active },
    });
  }
};
