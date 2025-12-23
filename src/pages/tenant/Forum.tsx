import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { TenantLayout } from "@/components/layouts/TenantLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useIsMobile } from "@/hooks/use-mobile";
import { Plus, MessageSquare, Heart, Eye, Loader2, Search, Pin, ImageIcon, X } from "lucide-react";
import { ForumPostSkeleton } from "@/components/ui/skeletons";
import { formatDistanceToNow } from "date-fns";
import { Link } from "react-router-dom";

interface ForumPost {
  id: string;
  title: string;
  content: string;
  tags: string[] | null;
  is_pinned: boolean;
  view_count: number;
  comment_count: number;
  like_count: number;
  created_at: string;
  author_id: string;
}

export default function TenantForum() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newPost, setNewPost] = useState({ title: "", content: "", tags: "", photos: [] as string[] });
  const [showAllPosts, setShowAllPosts] = useState(false);

  // Get tenant's property from active contract
  const { data: tenantContract } = useQuery({
    queryKey: ["tenant-contract-property", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contracts")
        .select(`
          unit_id,
          units!inner (
            property_id,
            properties!inner (
              id,
              name
            )
          )
        `)
        .eq("tenant_user_id", user?.id)
        .eq("status", "active")
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const propertyId = (tenantContract?.units as any)?.property_id;
  const propertyName = (tenantContract?.units as any)?.properties?.name;

  // Fetch forum posts with author profiles (filtered by property if available)
  const { data: posts, isLoading } = useQuery({
    queryKey: ["forum-posts", propertyId, showAllPosts],
    queryFn: async () => {
      let query = supabase
        .from("forum_posts")
        .select("*")
        .eq("is_visible", true)
        .order("is_pinned", { ascending: false })
        .order("created_at", { ascending: false });

      // Filter by property if tenant has an active contract and not showing all
      if (propertyId && !showAllPosts) {
        query = query.or(`property_id.eq.${propertyId},property_id.is.null`);
      }

      const { data: postsData, error: postsError } = await query;
      if (postsError) throw postsError;

      // Fetch author profiles separately
      const authorIds = [...new Set(postsData.map(p => p.author_id))];
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("user_id, full_name, email")
        .in("user_id", authorIds);

      const profilesMap = new Map(profilesData?.map(p => [p.user_id, p]) || []);
      
      return postsData.map(post => ({
        ...post,
        author_profile: profilesMap.get(post.author_id) || null,
      })) as (ForumPost & { author_profile: { full_name: string | null; email: string } | null })[];
    },
  });

  // Check user's likes
  const { data: userLikes } = useQuery({
    queryKey: ["user-post-likes", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("forum_likes")
        .select("post_id")
        .eq("user_id", user?.id)
        .not("post_id", "is", null);
      if (error) throw error;
      return data.map((l) => l.post_id);
    },
    enabled: !!user?.id,
  });

  // Create post mutation
  const createPostMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error("Not authenticated");

      const tags = newPost.tags
        .split(",")
        .map((t) => t.trim())
        .filter((t) => t);

      const { error } = await supabase.from("forum_posts").insert({
        author_id: user.id,
        title: newPost.title,
        content: newPost.content,
        tags: tags.length > 0 ? tags : null,
        photos: newPost.photos.length > 0 ? newPost.photos : null,
        property_id: propertyId || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["forum-posts"] });
      toast({ title: "Post created!" });
      setIsDialogOpen(false);
      setNewPost({ title: "", content: "", tags: "", photos: [] });
    },
    onError: (error) => {
      toast({ title: "Failed to create post", description: error.message, variant: "destructive" });
    },
  });

  // Photo upload handler
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !user?.id) return;
    
    for (const file of Array.from(files)) {
      if (file.size > 5 * 1024 * 1024) {
        toast({ title: "File too large", description: "Max 5MB per image", variant: "destructive" });
        continue;
      }
      
      const fileExt = file.name.split('.').pop();
      const filePath = `forum/${user.id}/${Date.now()}.${fileExt}`;
      
      const { error } = await supabase.storage.from('maintenance-photos').upload(filePath, file);
      if (error) {
        toast({ title: "Upload failed", variant: "destructive" });
        continue;
      }
      
      const { data: { publicUrl } } = supabase.storage.from('maintenance-photos').getPublicUrl(filePath);
      setNewPost(prev => ({ ...prev, photos: [...prev.photos, publicUrl] }));
    }
  };

  // Like post mutation
  const likeMutation = useMutation({
    mutationFn: async (postId: string) => {
      const isLiked = userLikes?.includes(postId);
      if (isLiked) {
        const { error } = await supabase
          .from("forum_likes")
          .delete()
          .eq("user_id", user?.id)
          .eq("post_id", postId);
        if (error) throw error;
        // Decrement like count directly
        const currentPost = posts?.find(p => p.id === postId);
        if (currentPost) {
          await supabase
            .from("forum_posts")
            .update({ like_count: Math.max((currentPost.like_count || 0) - 1, 0) })
            .eq("id", postId);
        }
      } else {
        const { error } = await supabase.from("forum_likes").insert({
          user_id: user?.id,
          post_id: postId,
        });
        if (error) throw error;
        // Increment like count directly
        const currentPost = posts?.find(p => p.id === postId);
        if (currentPost) {
          await supabase
            .from("forum_posts")
            .update({ like_count: (currentPost.like_count || 0) + 1 })
            .eq("id", postId);
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["forum-posts"] });
      queryClient.invalidateQueries({ queryKey: ["user-post-likes"] });
    },
  });

  const filteredPosts = posts?.filter(
    (post) =>
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.tags?.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()))
  );

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

  // Create post dialog content
  const createPostDialog = (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      {!isMobile && (
        <DialogTrigger asChild>
          <Button size="sm">
            <Plus className="mr-1.5 h-4 w-4" />
            <span className="hidden sm:inline">Buat Post</span>
            <span className="sm:hidden">Post</span>
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="max-w-lg mx-4">
        <DialogHeader>
          <DialogTitle>Buat Post Baru</DialogTitle>
        </DialogHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            createPostMutation.mutate();
          }}
          className="space-y-4"
        >
          <div className="space-y-2">
            <Label htmlFor="title">Judul *</Label>
            <Input
              id="title"
              value={newPost.title}
              onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
              placeholder="Apa yang ingin kamu bagikan?"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="content">Konten *</Label>
            <Textarea
              id="content"
              value={newPost.content}
              onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
              placeholder="Tulis detail di sini..."
              rows={4}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="tags">Tags (pisahkan dengan koma)</Label>
            <Input
              id="tags"
              value={newPost.tags}
              onChange={(e) => setNewPost({ ...newPost, tags: e.target.value })}
              placeholder="contoh: pertanyaan, tips, diskusi"
            />
          </div>
          {/* Photo Upload */}
          <div className="space-y-2">
            <Label>Foto (opsional)</Label>
            <div className="flex flex-wrap gap-2">
              {newPost.photos.map((url, i) => (
                <div key={i} className="relative h-14 w-14">
                  <img src={url} alt="" className="h-full w-full rounded-lg object-cover" />
                  <button
                    type="button"
                    onClick={() => setNewPost(p => ({ ...p, photos: p.photos.filter((_, idx) => idx !== i) }))}
                    className="absolute -right-1 -top-1 rounded-full bg-destructive p-0.5 text-destructive-foreground"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
              {newPost.photos.length < 4 && (
                <label className="flex h-14 w-14 cursor-pointer items-center justify-center rounded-lg border-2 border-dashed hover:border-primary transition-colors">
                  <input type="file" accept="image/*" multiple className="hidden" onChange={handlePhotoUpload} />
                  <ImageIcon className="h-5 w-5 text-muted-foreground" />
                </label>
              )}
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsDialogOpen(false)}>
              Batal
            </Button>
            <Button type="submit" size="sm" disabled={createPostMutation.isPending}>
              {createPostMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Posting
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );

  return (
    <TenantLayout
      title="Forum Komunitas"
      description="Terhubung dengan penghuni lain"
      actions={createPostDialog}
      floatingAction={isMobile ? {
        type: 'create',
        onClick: () => setIsDialogOpen(true)
      } : undefined}
    >
      <div className="space-y-4">
        {/* Property Filter Info & Toggle */}
        {propertyName && (
          <div className="flex items-center justify-between rounded-lg bg-muted/50 p-3">
            <div className="text-sm">
              <span className="text-muted-foreground">Menampilkan: </span>
              <span className="font-medium">{showAllPosts ? "Semua Properti" : propertyName}</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAllPosts(!showAllPosts)}
              className="text-xs h-8"
            >
              {showAllPosts ? "Properti Saya" : "Semua"}
            </Button>
          </div>
        )}

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Cari post..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-10"
          />
        </div>

        {/* Posts */}
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => <ForumPostSkeleton key={i} />)}
          </div>
        ) : filteredPosts?.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <MessageSquare className="h-10 w-10 text-muted-foreground" />
              <h3 className="mt-4 text-base font-medium">Belum ada post</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Jadilah yang pertama memulai diskusi!
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredPosts?.map((post) => (
              <Card key={post.id} className="transition-shadow hover:shadow-md">
                <CardHeader className="pb-2 px-4 pt-4">
                  <div className="flex items-start gap-3">
                    <Avatar className="h-9 w-9 shrink-0">
                      <AvatarFallback className="text-xs">
                        {getInitials(post.author_profile?.full_name, post.author_profile?.email)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <Link to={`/tenant/forum/${post.id}`} className="hover:underline flex-1 min-w-0">
                          <CardTitle className="text-sm font-semibold truncate">{post.title}</CardTitle>
                        </Link>
                        {post.is_pinned && (
                          <Pin className="h-3.5 w-3.5 text-primary shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {post.author_profile?.full_name || post.author_profile?.email || "Anonymous"} •{" "}
                        {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="px-4 pb-4">
                  <p className="text-sm text-muted-foreground line-clamp-2">{post.content}</p>

                  {post.tags && post.tags.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {post.tags.slice(0, 3).map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-[10px] px-1.5 py-0">
                          #{tag}
                        </Badge>
                      ))}
                    </div>
                  )}

                  <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
                    <button
                      onClick={() => likeMutation.mutate(post.id)}
                      className={`flex items-center gap-1 transition-colors hover:text-red-500 ${
                        userLikes?.includes(post.id) ? "text-red-500" : ""
                      }`}
                      disabled={likeMutation.isPending}
                    >
                      <Heart
                        className={`h-4 w-4 ${userLikes?.includes(post.id) ? "fill-current" : ""}`}
                      />
                      {post.like_count}
                    </button>
                    <Link
                      to={`/tenant/forum/${post.id}`}
                      className="flex items-center gap-1 hover:text-primary"
                    >
                      <MessageSquare className="h-4 w-4" />
                      {post.comment_count}
                    </Link>
                    <span className="flex items-center gap-1">
                      <Eye className="h-4 w-4" />
                      {post.view_count}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </TenantLayout>
  );
}
