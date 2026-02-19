import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { chatbotService } from "../services/chatbotService";
import { KnowledgeFormData } from "../types/chatbot";

export function useChatbot(
  page: number = 1,
  pageSize: number = 20,
  search?: string,
  category?: string
) {
  const queryClient = useQueryClient();

  const { data: knowledgeData, isLoading, error, refetch } = useQuery({
    queryKey: ["chatbot-knowledge", page, pageSize, search, category],
    queryFn: () => chatbotService.fetchKnowledge(page, pageSize, search, category),
  });

  const { data: statsData } = useQuery({
    queryKey: ["chatbot-stats"],
    queryFn: () => chatbotService.fetchStats(),
  });

  const createMutation = useMutation({
    mutationFn: (data: KnowledgeFormData) => chatbotService.createKnowledge(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chatbot-knowledge"] });
      queryClient.invalidateQueries({ queryKey: ["chatbot-stats"] });
      toast.success("Knowledge entry created");
    },
    onError: (err: Error) => toast.error(err.message || "Failed to create entry"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: KnowledgeFormData }) => 
      chatbotService.updateKnowledge(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chatbot-knowledge"] });
      queryClient.invalidateQueries({ queryKey: ["chatbot-stats"] });
      toast.success("Knowledge entry updated");
    },
    onError: (err: Error) => toast.error(err.message || "Failed to update entry"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => chatbotService.deleteKnowledge(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chatbot-knowledge"] });
      queryClient.invalidateQueries({ queryKey: ["chatbot-stats"] });
      toast.success("Knowledge entry deleted");
    },
    onError: () => toast.error("Failed to delete entry"),
  });

  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, is_active }: { id: string; is_active: boolean }) => 
      chatbotService.toggleActive(id, is_active),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chatbot-knowledge"] });
      queryClient.invalidateQueries({ queryKey: ["chatbot-stats"] });
      toast.success("Status updated");
    },
    onError: () => toast.error("Failed to update status"),
  });

  return {
    knowledge: knowledgeData?.entries || [],
    totalCount: knowledgeData?.total || 0,
    stats: statsData || { total: 0, active: 0, inactive: 0, categories: {} },
    isLoading,
    error,
    refetch,
    createKnowledge: createMutation.mutate,
    updateKnowledge: updateMutation.mutate,
    deleteKnowledge: deleteMutation.mutate,
    toggleActive: toggleActiveMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
