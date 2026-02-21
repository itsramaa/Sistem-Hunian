
import { Button } from "@/shared/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from "@/shared/components/ui/form";
import { Input } from "@/shared/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { Switch } from "@/shared/components/ui/switch";
import { Textarea } from "@/shared/components/ui/textarea";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { CHATBOT_CATEGORIES, KnowledgeEntry, KnowledgeFormData } from "../../types";

interface KnowledgeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: KnowledgeFormData) => void;
  initialData?: KnowledgeEntry | null;
  isLoading?: boolean;
}

const MAX_ANSWER_LENGTH = 2000;
const MIN_QUESTION_LENGTH = 10;

const formSchema = z.object({
  question: z.string().min(MIN_QUESTION_LENGTH, {
    message: `Question must be at least ${MIN_QUESTION_LENGTH} characters`,
  }),
  answer: z
    .string()
    .min(1, { message: "Answer is required" })
    .max(MAX_ANSWER_LENGTH, {
      message: `Answer must be less than ${MAX_ANSWER_LENGTH} characters`,
    }),
  category: z.string().min(1, { message: "Category is required" }),
  keywords: z.string(),
  is_active: z.boolean().default(true),
});

type FormValues = z.infer<typeof formSchema>;

export function KnowledgeDialog({
  open,
  onOpenChange,
  onSubmit,
  initialData,
  isLoading,
}: KnowledgeDialogProps) {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      question: "",
      answer: "",
      category: "general",
      keywords: "",
      is_active: true,
    },
  });

  useEffect(() => {
    if (open) {
      if (initialData) {
        form.reset({
          question: initialData.question,
          answer: initialData.answer,
          category: initialData.category,
          keywords: initialData.keywords?.join(", ") || "",
          is_active: initialData.is_active,
        });
      } else {
        form.reset({
          question: "",
          answer: "",
          category: "general",
          keywords: "",
          is_active: true,
        });
      }
    }
  }, [open, initialData, form]);

  const handleSubmit = (data: FormValues) => {
    onSubmit(data as KnowledgeFormData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {initialData ? "Edit Knowledge Entry" : "Add Knowledge Entry"}
          </DialogTitle>
          <DialogDescription>
            Create FAQ entries that the AI chatbot can use to answer user questions.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="question"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Question <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., How do I pay my rent?" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="answer"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Answer <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Provide a detailed answer..."
                      rows={4}
                      maxLength={MAX_ANSWER_LENGTH}
                      {...field}
                    />
                  </FormControl>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <FormMessage />
                    <span>
                      {field.value?.length || 0}/{MAX_ANSWER_LENGTH}
                    </span>
                  </div>
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {CHATBOT_CATEGORIES.map((cat) => (
                          <SelectItem key={cat} value={cat}>
                            {cat.charAt(0).toUpperCase() + cat.slice(1)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="keywords"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Keywords (comma-separated)</FormLabel>
                    <FormControl>
                      <Input placeholder="rent, payment, billing" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="is_active"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <FormLabel className="font-normal">
                    Active (visible to users)
                  </FormLabel>
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {initialData ? "Update" : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
