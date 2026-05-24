import { createAuditLog } from "@/shared/utils/auditLog";
import { KnowledgeEntry, KnowledgeFormData } from "../types/chatbot";

// TODO: Go endpoint not yet implemented for chatbot domain
// All methods below are stubbed — was: supabase.from('chatbot_knowledge')...

export const chatbotService = {
  async fetchKnowledge(_page: number, _pageSize: number, _search?: string, _category?: string) {
    // TODO: Go endpoint not yet implemented — was: supabase.from('chatbot_knowledge').select(...)
    return { entries: [] as KnowledgeEntry[], total: 0 };
  },

  async fetchStats() {
    // TODO: Go endpoint not yet implemented — was: supabase.from('chatbot_knowledge').select('category, is_active')
    return {
      total: 0,
      active: 0,
      inactive: 0,
      categories: {} as Record<string, number>,
    };
  },

  async checkDuplicate(_question: string, _excludeId?: string) {
    // TODO: Go endpoint not yet implemented — was: supabase.from('chatbot_knowledge').select('id').ilike(...)
    return false;
  },

  async createKnowledge(data: KnowledgeFormData) {
    // TODO: Go endpoint not yet implemented — was: supabase.from('chatbot_knowledge').insert(...)
    await createAuditLog({
      action: "create",
      entityType: "chatbot_knowledge",
      entityId: "stub",
      newData: { question: data.question, category: data.category },
    });
    throw new Error("Chatbot knowledge creation not yet available");
  },

  async updateKnowledge(id: string, data: KnowledgeFormData) {
    // TODO: Go endpoint not yet implemented — was: supabase.from('chatbot_knowledge').update(...).eq('id', id)
    await createAuditLog({
      action: "update",
      entityType: "chatbot_knowledge",
      entityId: id,
      newData: { question: data.question, category: data.category },
    });
    throw new Error("Chatbot knowledge update not yet available");
  },

  async deleteKnowledge(id: string) {
    // TODO: Go endpoint not yet implemented — was: supabase.from('chatbot_knowledge').delete().eq('id', id)
    await createAuditLog({
      action: "delete",
      entityType: "chatbot_knowledge",
      entityId: id,
    });
    throw new Error("Chatbot knowledge deletion not yet available");
  },

  async toggleActive(id: string, is_active: boolean) {
    // TODO: Go endpoint not yet implemented — was: supabase.from('chatbot_knowledge').update({ is_active }).eq('id', id)
    await createAuditLog({
      action: "update",
      entityType: "chatbot_knowledge",
      entityId: id,
      newData: { is_active },
    });
    throw new Error("Chatbot knowledge toggle not yet available");
  },
};
