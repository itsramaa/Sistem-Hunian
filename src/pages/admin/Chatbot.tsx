import { useAdminGuard } from "@/features/auth/hooks/useAdminGuard";
import { useChatbot } from "@/features/chatbot/hooks/useChatbot";
import { CHATBOT_CATEGORIES, KnowledgeEntry } from "@/features/chatbot/types";
import { AdminLayout } from "@/shared/components/layouts/AdminLayout";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/shared/components/ui/dialog";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";
import { Switch } from "@/shared/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/components/ui/table";
import { Textarea } from "@/shared/components/ui/textarea";
import { useDebounce } from "@/shared/hooks/useDebounce";
import { AlertTriangle, Bot, ChevronLeft, ChevronRight, HelpCircle, Loader2, MessageSquare, Plus, Search, Tag } from "lucide-react";
import { useState } from "react";

const MAX_ANSWER_LENGTH = 2000;
const MIN_QUESTION_LENGTH = 10;
const PAGE_SIZE = 20;

const AdminChatbot = () => {
  const { isLoading: guardLoading } = useAdminGuard();
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 500);
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<KnowledgeEntry | null>(null);
  const [page, setPage] = useState(1);
  const [formData, setFormData] = useState({
    question: "",
    answer: "",
    category: "general",
    keywords: "",
    is_active: true,
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const {
    knowledge,
    totalCount,
    stats,
    isLoading,
    error,
    refetch,
    createKnowledge,
    updateKnowledge,
    toggleActive,
    isCreating,
    isUpdating
  } = useChatbot(page, PAGE_SIZE, debouncedSearch, categoryFilter);

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

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
      updateKnowledge({ id: editingEntry.id, data: formData }, {
        onSuccess: () => resetForm()
      });
    } else {
      createKnowledge(formData, {
        onSuccess: () => resetForm()
      });
    }
  };

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
                        {CHATBOT_CATEGORIES.map((cat) => (
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
                <Button onClick={handleSubmit} disabled={isCreating || isUpdating}>
                  {(isCreating || isUpdating) && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
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
                  <p className="text-xl font-bold">{stats.total}</p>
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
                  <p className="text-xl font-bold">{stats.active}</p>
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
                  <p className="text-xl font-bold">{Object.keys(stats.categories).length}</p>
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
                  <p className="text-xl font-bold">{stats.inactive}</p>
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
                  {CHATBOT_CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat.charAt(0).toUpperCase() + cat.slice(1)} ({stats.categories[cat] || 0})
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
                <div className="rounded-md border">
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
                      {knowledge.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                            No entries found matching your criteria
                          </TableCell>
                        </TableRow>
                      ) : (
                        knowledge.map((entry) => (
                          <TableRow key={entry.id} className="cursor-pointer hover:bg-muted/50" onClick={() => handleEdit(entry)}>
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
                            <TableCell onClick={(e) => e.stopPropagation()}>
                              <Switch
                                checked={entry.is_active}
                                onCheckedChange={(checked) =>
                                  toggleActive({ id: entry.id, is_active: checked })
                                }
                              />
                            </TableCell>
                            <TableCell className="text-right">
                              {/* Add edit/delete buttons if needed, or keep row click for edit */}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
                
                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-end space-x-2 py-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </Button>
                    <div className="text-sm font-medium">
                      Page {page} of {totalPages}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminChatbot;
