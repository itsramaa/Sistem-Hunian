import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AdminLayout } from "@/components/layouts/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Bot, Plus, Pencil, Trash2, Search, Loader2, MessageSquare, Tag, HelpCircle, AlertTriangle } from "lucide-react";
import { useAdminGuard } from "@/hooks/useAdminGuard";
import { createAuditLog } from "@/lib/auditLog";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";

interface KnowledgeEntry {
  id: string;
  question: string;
  answer: string;
  category: string;
  keywords: string[] | null;
  is_active: boolean;
  created_at: string;
}

const CATEGORIES = [
  "general",
  "payment",
  "maintenance",
  "contract",
  "marketplace",
  "account",
  "vendor",
];

const MAX_ANSWER_LENGTH = 2000;
const MIN_QUESTION_LENGTH = 10;
const PAGE_SIZE = 20;

const AdminChatbot = () => {
  const { isLoading: guardLoading, isAdmin } = useAdminGuard();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<KnowledgeEntry | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [formData, setFormData] = useState({
    question: "",
    answer: "",
    category: "general",
    keywords: "",
    is_active: true,
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const { data: knowledgeData, isLoading, error, refetch } = useQuery({
    queryKey: ["chatbot-knowledge", page],
    queryFn: async () => {
      const { data, error, count } = await supabase
        .from("chatbot_knowledge")
        .select("*", { count: 'exact' })
        .order("created_at", { ascending: false })
        .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);
      if (error) throw error;
      return { entries: data as KnowledgeEntry[], total: count || 0 };
    },
    enabled: isAdmin,
  });

  const knowledge = knowledgeData?.entries || [];
  const totalCount = knowledgeData?.total || 0;
  const hasMore = page * PAGE_SIZE < totalCount;

  const validateForm = () => {
    const errors: Record<string, string> = {};
    
    if (formData.question.trim().length < MIN_QUESTION_LENGTH) {
      errors.question = `Question must be at least ${MIN_QUESTION_LENGTH} characters`;
    }
    
    if (formData.answer.trim().length === 0) {
      errors.answer = "Answer is required";
    } else if (formData.answer.length > MAX_ANSWER_LENGTH) {
      errors.answer = `Answer must be less than ${MAX_ANSWER_LENGTH} characters`;
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const checkDuplicate = async (question: string, excludeId?: string) => {
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
  };

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const isDuplicate = await checkDuplicate(data.question);
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
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chatbot-knowledge"] });
      toast.success("Knowledge entry created");
      resetForm();
    },
    onError: (err: Error) => toast.error(err.message || "Failed to create entry"),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof formData }) => {
      const isDuplicate = await checkDuplicate(data.question, id);
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chatbot-knowledge"] });
      toast.success("Knowledge entry updated");
      resetForm();
    },
    onError: (err: Error) => toast.error(err.message || "Failed to update entry"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("chatbot_knowledge").delete().eq("id", id);
      if (error) throw error;

      await createAuditLog({
        action: "delete",
        entityType: "chatbot_knowledge",
        entityId: id,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chatbot-knowledge"] });
      toast.success("Knowledge entry deleted");
      setDeleteConfirmId(null);
    },
    onError: () => toast.error("Failed to delete entry"),
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from("chatbot_knowledge")
        .update({ is_active })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chatbot-knowledge"] });
      toast.success("Status updated");
    },
    onError: () => toast.error("Failed to update status"),
  });

  const resetForm = () => {
    setFormData({
      question: "",
      answer: "",
      category: "general",
      keywords: "",
      is_active: true,
    });
    setFormErrors({});
    setEditingEntry(null);
    setIsDialogOpen(false);
  };

  const handleEdit = (entry: KnowledgeEntry) => {
    setEditingEntry(entry);
    setFormData({
      question: entry.question,
      answer: entry.answer,
      category: entry.category,
      keywords: entry.keywords?.join(", ") || "",
      is_active: entry.is_active,
    });
    setFormErrors({});
    setIsDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!validateForm()) return;

    if (editingEntry) {
      updateMutation.mutate({ id: editingEntry.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const filteredKnowledge = knowledge.filter((entry) => {
    const matchesSearch =
      entry.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.answer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.keywords?.some((k) => k.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = categoryFilter === "all" || entry.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const categoryCounts = knowledge.reduce((acc, entry) => {
    acc[entry.category] = (acc[entry.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  if (guardLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
              <Bot className="h-8 w-8 text-primary" />
              Chatbot Knowledge Base
            </h1>
            <p className="text-muted-foreground">Manage FAQ entries and AI chatbot responses</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Entry
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{editingEntry ? "Edit Knowledge Entry" : "Add Knowledge Entry"}</DialogTitle>
                <DialogDescription>
                  Create FAQ entries that the AI chatbot can use to answer user questions.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Question <span className="text-destructive">*</span></Label>
                  <Input
                    placeholder="e.g., How do I pay my rent?"
                    value={formData.question}
                    onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                  />
                  {formErrors.question && (
                    <p className="text-xs text-destructive">{formErrors.question}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Answer <span className="text-destructive">*</span></Label>
                  <Textarea
                    placeholder="Provide a detailed answer..."
                    rows={4}
                    value={formData.answer}
                    onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
                    maxLength={MAX_ANSWER_LENGTH}
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    {formErrors.answer ? (
                      <span className="text-destructive">{formErrors.answer}</span>
                    ) : (
                      <span>Max {MAX_ANSWER_LENGTH} characters</span>
                    )}
                    <span>{formData.answer.length}/{MAX_ANSWER_LENGTH}</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Category</Label>
                    <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CATEGORIES.map((cat) => (
                          <SelectItem key={cat} value={cat}>
                            {cat.charAt(0).toUpperCase() + cat.slice(1)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Keywords (comma-separated)</Label>
                    <Input
                      placeholder="rent, payment, billing"
                      value={formData.keywords}
                      onChange={(e) => setFormData({ ...formData, keywords: e.target.value })}
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                  />
                  <Label>Active</Label>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={resetForm}>Cancel</Button>
                <Button onClick={handleSubmit} disabled={createMutation.isPending || updateMutation.isPending}>
                  {(createMutation.isPending || updateMutation.isPending) && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  {editingEntry ? "Update" : "Create"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <MessageSquare className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Entries</p>
                  <p className="text-xl font-bold">{totalCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-success/10">
                  <HelpCircle className="h-5 w-5 text-success" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Active</p>
                  <p className="text-xl font-bold">{knowledge.filter((k) => k.is_active).length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-info/10">
                  <Tag className="h-5 w-5 text-info" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Categories</p>
                  <p className="text-xl font-bold">{Object.keys(categoryCounts).length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-warning/10">
                  <Bot className="h-5 w-5 text-warning" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Inactive</p>
                  <p className="text-xl font-bold">{knowledge.filter((k) => !k.is_active).length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search questions, answers, or keywords..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Filter by category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat.charAt(0).toUpperCase() + cat.slice(1)} ({categoryCounts[cat] || 0})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Knowledge Table */}
        <Card>
          <CardHeader>
            <CardTitle>Knowledge Entries</CardTitle>
            <CardDescription>Manage FAQ entries for the AI chatbot</CardDescription>
          </CardHeader>
          <CardContent>
            {error ? (
              <div className="text-center py-8">
                <AlertTriangle className="h-12 w-12 mx-auto text-destructive mb-4" />
                <p className="text-destructive mb-4">Failed to load knowledge entries</p>
                <Button variant="outline" onClick={() => refetch()}>Retry</Button>
              </div>
            ) : isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Question</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Keywords</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredKnowledge.map((entry) => (
                      <TableRow key={entry.id}>
                        <TableCell>
                          <div className="max-w-md">
                            <p className="font-medium truncate">{entry.question}</p>
                            <p className="text-sm text-muted-foreground line-clamp-1">{entry.answer}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{entry.category}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1 max-w-48">
                            {entry.keywords?.slice(0, 3).map((kw, i) => (
                              <Badge key={i} variant="secondary" className="text-xs">
                                {kw}
                              </Badge>
                            ))}
                            {(entry.keywords?.length || 0) > 3 && (
                              <Badge variant="secondary" className="text-xs">+{entry.keywords!.length - 3}</Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Switch
                            checked={entry.is_active}
                            onCheckedChange={(checked) =>
                              toggleActiveMutation.mutate({ id: entry.id, is_active: checked })
                            }
                          />
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="icon" onClick={() => handleEdit(entry)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-destructive"
                              onClick={() => setDeleteConfirmId(entry.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {filteredKnowledge.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                          No knowledge entries found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>

                {/* Pagination */}
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-muted-foreground">
                    Showing {(page - 1) * PAGE_SIZE + 1} - {Math.min(page * PAGE_SIZE, totalCount)} of {totalCount}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page === 1}
                      onClick={() => setPage(p => p - 1)}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={!hasMore}
                      onClick={() => setPage(p => p + 1)}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={!!deleteConfirmId}
        onOpenChange={(open) => !open && setDeleteConfirmId(null)}
        title="Delete Knowledge Entry"
        description="Are you sure you want to delete this knowledge entry? This action cannot be undone."
        confirmLabel="Delete"
        variant="destructive"
        isLoading={deleteMutation.isPending}
        onConfirm={() => deleteConfirmId && deleteMutation.mutate(deleteConfirmId)}
      />
    </AdminLayout>
  );
};

export default AdminChatbot;
