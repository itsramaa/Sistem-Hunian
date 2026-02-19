export interface KnowledgeEntry {
  id: string;
  question: string;
  answer: string;
  category: string;
  keywords: string[] | null;
  is_active: boolean;
  created_at: string;
}

export interface KnowledgeFormData {
  question: string;
  answer: string;
  category: string;
  keywords: string;
  is_active: boolean;
}

export type KnowledgeCategory = 
  | "general"
  | "payment"
  | "maintenance"
  | "contract"
  | "marketplace"
  | "account"
  | "vendor";

export const CHATBOT_CATEGORIES: KnowledgeCategory[] = [
  "general",
  "payment",
  "maintenance",
  "contract",
  "marketplace",
  "account",
  "vendor",
];
