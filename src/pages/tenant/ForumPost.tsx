import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { TenantLayout } from "@/components/layouts/TenantLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { ArrowLeft, Heart, MessageSquare, Loader2, Send, Trash2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface ForumPost {
  id: string;
  title: string;
  content: string;
  tags: string[] | null;
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

export default function TenantForumPost() {
  const { postId } = useParams<{ postId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [newComment, setNewComment] = useState("");

  // Fetch post with author profile
  const { data: postData, isLoading } = useQuery({
    queryKey: ["forum-post", postId],
    queryFn: async () => {
      const { data: post, error } = await supabase
        .from("forum_posts")
        .select("*")
        .eq("id", postId)
        .single();
      if (error) throw error;

      // Fetch author profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("user_id, full_name, email")
        .eq("user_id", post.author_id)
        .single();

      return { post: post as ForumPost, authorProfile: profile as AuthorProfile | null };
    },
    enabled: !!postId,
  });

  const post = postData?.post;
  const authorProfile = postData?.authorProfile;

  // Increment view count on mount
  useEffect(() => {
    if (postId && post) {
      supabase
        .from("forum_posts")
        .update({ view_count: (post.view_count || 0) + 1 })
        .eq("id", postId)
        .then(() => {});
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

  // Add comment mutation
  const addCommentMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id || !postId) throw new Error("Invalid");
      const { error } = await supabase.from("forum_comments").insert({
        post_id: postId,
        author_id: user.id,
        content: newComment,
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
    },
    onError: (error) => {
      toast({ title: "Failed to add comment", description: error.message, variant: "destructive" });
    },
  });

  // Like post mutation
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
  });

  // Delete comment mutation
  const deleteCommentMutation = useMutation({
    mutationFn: async (commentId: string) => {
      await supabase.from("forum_comments").delete().eq("id", commentId);
      await supabase
        .from("forum_posts")
        .update({ comment_count: Math.max((post?.comment_count || 0) - 1, 0) })
        .eq("id", postId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["forum-comments", postId] });
      queryClient.invalidateQueries({ queryKey: ["forum-post", postId] });
      toast({ title: "Comment deleted" });
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

  if (isLoading) {
    return (
      <TenantLayout title="Loading...">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </TenantLayout>
    );
  }

  if (!post) {
    return (
      <TenantLayout title="Post not found">
        <Card>
          <CardContent className="py-12 text-center">
            <p>Post not found or has been deleted.</p>
            <Button className="mt-4" onClick={() => navigate("/tenant/forum")}>
              Back to Forum
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
          Back
        </Button>
      }
    >
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
              <CardTitle className="text-xl">{post.title}</CardTitle>
              <p className="text-sm text-muted-foreground">
                {authorProfile?.full_name || authorProfile?.email || "Anonymous"} •{" "}
                {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="whitespace-pre-wrap">{post.content}</p>

          {post.tags && post.tags.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-1">
              {post.tags.map((tag) => (
                <Badge key={tag} variant="secondary">
                  #{tag}
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
              {post.comment_count} Comments
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Comments */}
      <h3 className="mb-4 text-lg font-semibold">Comments</h3>

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
                placeholder="Write a comment..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                rows={2}
              />
              <div className="mt-2 flex justify-end">
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
                  Post Comment
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Comments List */}
      {commentsData?.length === 0 ? (
        <p className="text-center text-muted-foreground">No comments yet. Be the first!</p>
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
                            onClick={() => deleteCommentMutation.mutate(comment.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                    <p className="mt-1 text-sm">{comment.content}</p>
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
