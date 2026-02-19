import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/integrations/supabase/client";
import { TenantLayout } from "@/shared/components/layouts/TenantLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Textarea } from "@/shared/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/shared/components/ui/avatar";
import { Alert, AlertDescription } from "@/shared/components/ui/alert";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/shared/components/ui/dialog";
import { useToast } from "@/shared/hooks/use-toast";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { ArrowLeft, Heart, MessageSquare, Loader2, Send, Trash2, Flag, AlertTriangle, RefreshCw } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface ForumPost {
  id: string;
  title: string;
  content: string;
  tags: string[] | null;
  photos: string[] | null;
  view_count: number;
  comment_count: number;
  like_count: number;
  created_at: string;
  author_id: string;
}

interface Comment {
  id: string;
  content: string;
  like_count: number;
  created_at: string;
  author_id: string;
}

interface AuthorProfile {
  user_id: string;
  full_name: string | null;
  email: string;
}

// XSS protection - escape HTML entities
const escapeHtml = (text: string): string => {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
};

const MAX_COMMENT_LENGTH = 2000;

export default function TenantForumPost() {
  const { postId } = useParams<{ postId: string }>();
  const navigate = useNavigate();
  const { user, role } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [newComment, setNewComment] = useState("");
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [deleteCommentDialogOpen, setDeleteCommentDialogOpen] = useState(false);
  const [commentToDelete, setCommentToDelete] = useState<string | null>(null);
  const viewCountUpdated = useRef(false);

  // Tenant role verification
  const isTenant = role === 'tenant';

  // Fetch post with author profile
  const { data: postData, isLoading, error, refetch } = useQuery({
    queryKey: ["forum-post", postId],
    queryFn: async () => {
      const { data: post, error } = await supabase
        .from("forum_posts")
        .select("*")
        .eq("id", postId)
        .maybeSingle();
      if (error) throw error;
      if (!post) return null;

      // Fetch author profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("user_id, full_name, email")
        .eq("user_id", post.author_id)
        .maybeSingle();

      return { post: post as ForumPost, authorProfile: profile as AuthorProfile | null };
    },
    enabled: !!postId,
  });

  const post = postData?.post;
  const authorProfile = postData?.authorProfile;

  // Increment view count on mount - only once
  useEffect(() => {
    if (postId && post && !viewCountUpdated.current) {
      viewCountUpdated.current = true;
      supabase
        .from("forum_posts")
        .update({ view_count: (post.view_count || 0) + 1 })
        .eq("id", postId)
        .then(() => {
          queryClient.invalidateQueries({ queryKey: ["forum-post", postId] });
        });
    }
  }, [postId, post?.id]);

  // Fetch comments with author profiles
  const { data: commentsData } = useQuery({
    queryKey: ["forum-comments", postId],
    queryFn: async () => {
      const { data: comments, error } = await supabase
        .from("forum_comments")
        .select("*")
        .eq("post_id", postId)
        .eq("is_visible", true)
        .order("created_at", { ascending: true });
      if (error) throw error;

      // Fetch author profiles
      const authorIds = [...new Set(comments.map(c => c.author_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name, email")
        .in("user_id", authorIds);

      const profilesMap = new Map(profiles?.map(p => [p.user_id, p]) || []);
      
      return comments.map(comment => ({
        ...comment as Comment,
        authorProfile: profilesMap.get(comment.author_id) as AuthorProfile | null,
      }));
    },
    enabled: !!postId,
  });

  // Check user's likes
  const { data: userLikes } = useQuery({
    queryKey: ["user-likes", user?.id, postId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("forum_likes")
        .select("post_id, comment_id")
        .eq("user_id", user?.id);
      if (error) throw error;
      return {
        posts: data.filter((l) => l.post_id).map((l) => l.post_id),
        comments: data.filter((l) => l.comment_id).map((l) => l.comment_id),
      };
    },
    enabled: !!user?.id,
  });

  // Add comment mutation with validation
  const addCommentMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id || !postId) throw new Error("Invalid");
      
      const trimmedComment = newComment.trim();
      if (trimmedComment.length > MAX_COMMENT_LENGTH) {
        throw new Error(`Komentar maksimal ${MAX_COMMENT_LENGTH} karakter`);
      }
      
      const { error } = await supabase.from("forum_comments").insert({
        post_id: postId,
        author_id: user.id,
        content: trimmedComment,
      });
      if (error) throw error;
      
      // Update comment count
      await supabase
        .from("forum_posts")
        .update({ comment_count: (post?.comment_count || 0) + 1 })
        .eq("id", postId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["forum-comments", postId] });
      queryClient.invalidateQueries({ queryKey: ["forum-post", postId] });
      setNewComment("");
      toast({ title: "Komentar berhasil ditambahkan" });
    },
    onError: (error) => {
      toast({ title: "Gagal menambah komentar", description: error.message, variant: "destructive" });
    },
  });

  // Like post mutation with optimistic update
  const likePostMutation = useMutation({
    mutationFn: async () => {
      const isLiked = userLikes?.posts?.includes(postId!);
      if (isLiked) {
        await supabase.from("forum_likes").delete().eq("user_id", user?.id).eq("post_id", postId);
        await supabase
          .from("forum_posts")
          .update({ like_count: Math.max((post?.like_count || 0) - 1, 0) })
          .eq("id", postId);
      } else {
        await supabase.from("forum_likes").insert({ user_id: user?.id, post_id: postId });
        await supabase
          .from("forum_posts")
          .update({ like_count: (post?.like_count || 0) + 1 })
          .eq("id", postId);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["forum-post", postId] });
      queryClient.invalidateQueries({ queryKey: ["user-likes", user?.id] });
    },
    onError: () => {
      toast({ title: "Gagal memproses like", variant: "destructive" });
    },
  });

  // Delete comment mutation
  const deleteCommentMutation = useMutation({
    mutationFn: async (commentId: string) => {
      await supabase.from("forum_comments").delete().eq("id", commentId).eq("author_id", user?.id);
      await supabase
        .from("forum_posts")
        .update({ comment_count: Math.max((post?.comment_count || 0) - 1, 0) })
        .eq("id", postId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["forum-comments", postId] });
      queryClient.invalidateQueries({ queryKey: ["forum-post", postId] });
      toast({ title: "Komentar dihapus" });
      setDeleteCommentDialogOpen(false);
      setCommentToDelete(null);
    },
    onError: () => {
      toast({ title: "Gagal menghapus komentar", variant: "destructive" });
    },
  });

  // Report mutation
  const reportMutation = useMutation({
    mutationFn: async () => {
      if (!post?.id || !user?.id) throw new Error("Invalid");
      const { error } = await supabase.from("forum_reports").insert({
        post_id: post.id,
        reporter_id: user.id,
        reason: "inappropriate",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Post dilaporkan", description: "Kami akan meninjau laporan Anda" });
      setReportDialogOpen(false);
    },
    onError: () => {
      toast({ title: "Gagal melaporkan", variant: "destructive" });
    },
  });

  const getInitials = (name: string | null | undefined, email: string | undefined) => {
    if (name) {
      return name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
    }
    return email?.[0]?.toUpperCase() || "U";
  };

  // Not a tenant
  if (!isTenant) {
    return (
      <TenantLayout title="Forum">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>Akses ditolak. Halaman ini hanya untuk tenant.</AlertDescription>
        </Alert>
      </TenantLayout>
    );
  }

  if (isLoading) {
    return (
      <TenantLayout title="Loading...">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </TenantLayout>
    );
  }

  if (error) {
    return (
      <TenantLayout title="Error">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>Gagal memuat post.</span>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Coba Lagi
            </Button>
          </AlertDescription>
        </Alert>
      </TenantLayout>
    );
  }

  if (!post) {
    return (
      <TenantLayout title="Post not found">
        <Card>
          <CardContent className="py-12 text-center">
            <p>Post tidak ditemukan atau sudah dihapus.</p>
            <Button className="mt-4" onClick={() => navigate("/tenant/forum")}>
              Kembali ke Forum
            </Button>
          </CardContent>
        </Card>
      </TenantLayout>
    );
  }

  return (
    <TenantLayout
      title="Forum"
      actions={
        <Button variant="outline" onClick={() => navigate("/tenant/forum")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Kembali
        </Button>
      }
    >
      {/* Report Dialog */}
      <Dialog open={reportDialogOpen} onOpenChange={setReportDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Laporkan Post?</DialogTitle>
            <DialogDescription>
              Anda akan melaporkan post ini sebagai konten tidak pantas. Tim kami akan meninjau laporan ini.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReportDialogOpen(false)}>Batal</Button>
            <Button onClick={() => reportMutation.mutate()} disabled={reportMutation.isPending}>
              {reportMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Laporkan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Comment Dialog */}
      <Dialog open={deleteCommentDialogOpen} onOpenChange={setDeleteCommentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hapus Komentar?</DialogTitle>
            <DialogDescription>
              Tindakan ini tidak dapat dibatalkan.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteCommentDialogOpen(false)}>Batal</Button>
            <Button
              variant="destructive"
              onClick={() => commentToDelete && deleteCommentMutation.mutate(commentToDelete)}
              disabled={deleteCommentMutation.isPending}
            >
              {deleteCommentMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Hapus
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Post */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-start gap-3">
            <Avatar className="h-12 w-12">
              <AvatarFallback>
                {getInitials(authorProfile?.full_name, authorProfile?.email)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <CardTitle className="text-xl">{escapeHtml(post.title)}</CardTitle>
              <p className="text-sm text-muted-foreground">
                {authorProfile?.full_name || authorProfile?.email || "Anonymous"} •{" "}
                {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="whitespace-pre-wrap">{escapeHtml(post.content)}</p>

          {/* Post Photos */}
          {post.photos && post.photos.length > 0 && (
            <div className="mt-4 grid gap-2 grid-cols-2 sm:grid-cols-3">
              {post.photos.map((url, i) => (
                <img key={i} src={url} alt={`${post.title} - ${i + 1}`} className="rounded-lg object-cover aspect-square" />
              ))}
            </div>
          )}

          {post.tags && post.tags.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-1">
              {post.tags.map((tag) => (
                <Badge key={tag} variant="secondary">
                  #{escapeHtml(tag)}
                </Badge>
              ))}
            </div>
          )}

          <div className="mt-6 flex items-center gap-4">
            <Button
              variant={userLikes?.posts?.includes(post.id) ? "default" : "outline"}
              size="sm"
              onClick={() => likePostMutation.mutate()}
              disabled={likePostMutation.isPending}
            >
              <Heart
                className={`mr-2 h-4 w-4 ${
                  userLikes?.posts?.includes(post.id) ? "fill-current" : ""
                }`}
              />
              {post.like_count} Likes
            </Button>
            <span className="flex items-center gap-1 text-sm text-muted-foreground">
              <MessageSquare className="h-4 w-4" />
              {post.comment_count} Komentar
            </span>
            {post.author_id !== user?.id && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setReportDialogOpen(true)}
              >
                <Flag className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Comments */}
      <h3 className="mb-4 text-lg font-semibold">Komentar</h3>

      {/* Add Comment */}
      <Card className="mb-4">
        <CardContent className="pt-4">
          <div className="flex gap-3">
            <Avatar className="h-10 w-10">
              <AvatarFallback>
                {user?.email?.[0]?.toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <Textarea
                placeholder="Tulis komentar..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value.slice(0, MAX_COMMENT_LENGTH))}
                rows={2}
                maxLength={MAX_COMMENT_LENGTH}
              />
              <div className="mt-2 flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  {newComment.length}/{MAX_COMMENT_LENGTH}
                </span>
                <Button
                  size="sm"
                  onClick={() => addCommentMutation.mutate()}
                  disabled={!newComment.trim() || addCommentMutation.isPending}
                >
                  {addCommentMutation.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="mr-2 h-4 w-4" />
                  )}
                  Kirim
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Comments List */}
      {commentsData?.length === 0 ? (
        <p className="text-center text-muted-foreground">Belum ada komentar. Jadilah yang pertama!</p>
      ) : (
        <div className="space-y-4">
          {commentsData?.map((comment) => (
            <Card key={comment.id}>
              <CardContent className="pt-4">
                <div className="flex gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback>
                      {getInitials(comment.authorProfile?.full_name, comment.authorProfile?.email)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium">
                        {comment.authorProfile?.full_name || comment.authorProfile?.email || "Anonymous"}
                      </p>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                        </span>
                        {comment.author_id === user?.id && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => {
                              setCommentToDelete(comment.id);
                              setDeleteCommentDialogOpen(true);
                            }}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                    <p className="mt-1 text-sm">{escapeHtml(comment.content)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </TenantLayout>
  );
}
