import { useState } from "react";
import { MessageSquare, Star, Send, Loader2, Clock, CheckCircle2, AlertCircle } from "lucide-react";
import { PageHeader } from "@/shared/components/ui/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { Textarea } from "@/shared/components/ui/textarea";
import { Label } from "@/shared/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";
import { Badge } from "@/shared/components/ui/badge";
import { toast } from "sonner";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { FileUpload } from "@/shared/components/FileUpload";
import { cn } from "@/shared/utils/utils";

const categories = [
  { value: "feature", label: "Permintaan Fitur", emoji: "💡" },
  { value: "bug", label: "Laporan Bug", emoji: "🐛" },
  { value: "ux", label: "Pengalaman Pengguna", emoji: "🎨" },
  { value: "other", label: "Lainnya", emoji: "📝" },
];

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "outline"; icon: React.ElementType }> = {
  pending: { label: "Menunggu", variant: "secondary", icon: Clock },
  reviewed: { label: "Ditinjau", variant: "default", icon: AlertCircle },
  resolved: { label: "Selesai", variant: "outline", icon: CheckCircle2 },
};

export default function Feedback() {
  const { user, merchant } = useAuth();
  const queryClient = useQueryClient();
  const [category, setCategory] = useState("");
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [message, setMessage] = useState("");
  const [screenshotUrl, setScreenshotUrl] = useState<string | null>(null);

  const { data: feedbackList = [], isLoading } = useQuery({
    queryKey: ["merchant-feedback", user?.id],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("merchant_feedback")
        .select("*")
        .eq("user_id", user?.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  const submitMutation = useMutation({
    mutationFn: async () => {
      const { error } = await (supabase as any)
        .from("merchant_feedback")
        .insert({
          merchant_id: merchant?.id,
          user_id: user?.id,
          category,
          rating: rating || null,
          message,
          screenshot_url: screenshotUrl,
        });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Feedback berhasil dikirim! Terima kasih atas masukan Anda.");
      setCategory("");
      setRating(0);
      setMessage("");
      setScreenshotUrl(null);
      queryClient.invalidateQueries({ queryKey: ["merchant-feedback"] });
    },
    onError: () => {
      toast.error("Gagal mengirim feedback. Silakan coba lagi.");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!category || !message.trim()) {
      toast.error("Mohon pilih kategori dan tulis pesan feedback.");
      return;
    }
    submitMutation.mutate();
  };

  return (
    <div className="space-y-6">
      <PageHeader
        icon={MessageSquare}
        title="Kirim Feedback"
        description="Bantu kami meningkatkan layanan dengan masukan Anda"
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Feedback Form */}
        <div className="lg:col-span-2">
          <Card className="bg-card/90 backdrop-blur-sm rounded-2xl border border-border/40">
            <CardHeader>
              <CardTitle className="text-lg">Tulis Feedback</CardTitle>
              <CardDescription>Ceritakan pengalaman atau ide Anda untuk SiHuni</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Category */}
                <div className="space-y-2">
                  <Label>Kategori <span className="text-destructive">*</span></Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger className="rounded-xl bg-background/60 border-border/50">
                      <SelectValue placeholder="Pilih kategori..." />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl backdrop-blur-xl bg-popover/95 border border-border/40">
                      {categories.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value} className="rounded-lg">
                          {cat.emoji} {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Star Rating */}
                <div className="space-y-2">
                  <Label>Kepuasan (opsional)</Label>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        className="p-1 transition-transform hover:scale-110"
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        onClick={() => setRating(star === rating ? 0 : star)}
                      >
                        <Star
                          className={cn(
                            "h-6 w-6 transition-colors",
                            (hoverRating || rating) >= star
                              ? "fill-warning text-warning"
                              : "text-muted-foreground/30"
                          )}
                        />
                      </button>
                    ))}
                    {rating > 0 && (
                      <span className="text-sm text-muted-foreground ml-2 self-center">
                        {rating}/5
                      </span>
                    )}
                  </div>
                </div>

                {/* Message */}
                <div className="space-y-2">
                  <Label>Pesan <span className="text-destructive">*</span></Label>
                  <Textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Jelaskan feedback Anda secara detail..."
                    className="rounded-xl bg-background/60 border-border/50 min-h-[140px]"
                  />
                </div>

                {/* Screenshot */}
                <div className="space-y-2">
                  <Label>Screenshot (opsional)</Label>
                  {screenshotUrl ? (
                    <div className="relative">
                      <img src={screenshotUrl} alt="Screenshot" className="rounded-xl max-h-40 object-cover border" />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="mt-2 rounded-xl"
                        onClick={() => setScreenshotUrl(null)}
                      >
                        Hapus Screenshot
                      </Button>
                    </div>
                  ) : (
                    <FileUpload
                      bucket="verification-documents"
                      folder={`${user?.id}/feedback`}
                      accept="image/*"
                      onUploadComplete={(url) => {
                        setScreenshotUrl(url);
                        toast.success("Screenshot berhasil diunggah");
                      }}
                    />
                  )}
                </div>

                <Button
                  type="submit"
                  disabled={submitMutation.isPending}
                  className="gradient-cta rounded-xl w-full sm:w-auto"
                >
                  {submitMutation.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4 mr-2" />
                  )}
                  Kirim Feedback
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Feedback History */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Riwayat Feedback</h3>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : feedbackList.length === 0 ? (
            <Card className="bg-card/90 backdrop-blur-sm rounded-2xl border border-border/40">
              <CardContent className="py-8 text-center text-sm text-muted-foreground">
                Belum ada feedback yang dikirim.
              </CardContent>
            </Card>
          ) : (
            feedbackList.map((fb: any) => {
              const statusInfo = statusConfig[fb.status] || statusConfig.pending;
              const catInfo = categories.find((c) => c.value === fb.category);
              return (
                <Card key={fb.id} className="bg-card/90 backdrop-blur-sm rounded-2xl border border-border/40">
                  <CardContent className="py-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(fb.created_at), "dd MMM yyyy HH:mm", { locale: localeId })}
                      </span>
                      <Badge variant={statusInfo.variant} className="text-xs">
                        {statusInfo.label}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{catInfo?.emoji}</span>
                      <span className="text-sm font-medium">{catInfo?.label || fb.category}</span>
                      {fb.rating && (
                        <div className="flex items-center gap-0.5 ml-auto">
                          {Array.from({ length: fb.rating }).map((_, i) => (
                            <Star key={i} className="h-3 w-3 fill-warning text-warning" />
                          ))}
                        </div>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-3">{fb.message}</p>
                    {fb.admin_response && (
                      <div className="bg-primary/5 rounded-xl p-3 text-sm border border-primary/10">
                        <p className="text-xs font-medium text-primary mb-1">Respons Admin:</p>
                        <p className="text-muted-foreground">{fb.admin_response}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
