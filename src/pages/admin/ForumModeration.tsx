import { useState } from 'react';
import { AdminLayout } from '@/components/layouts/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { Flag, Eye, EyeOff, Trash2, MessageSquare, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

type ForumReport = {
  id: string;
  post_id: string | null;
  comment_id: string | null;
  reporter_id: string;
  reason: string;
  description: string | null;
  status: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
  created_at: string;
};

type ForumPost = {
  id: string;
  title: string;
  content: string;
  author_id: string;
  is_visible: boolean;
  is_locked: boolean;
  like_count: number;
  comment_count: number;
  created_at: string;
};

type ForumComment = {
  id: string;
  post_id: string;
  content: string;
  author_id: string;
  is_visible: boolean;
  created_at: string;
};

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
  reviewed: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  resolved: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  dismissed: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
};

export default function ForumModeration() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [selectedReport, setSelectedReport] = useState<ForumReport | null>(null);
  const [resolution, setResolution] = useState('');

  // Fetch reports
  const { data: reports = [], isLoading: reportsLoading } = useQuery({
    queryKey: ['forum-reports'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('forum_reports')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as ForumReport[];
    },
  });

  // Fetch flagged posts
  const { data: flaggedPosts = [] } = useQuery({
    queryKey: ['flagged-posts'],
    queryFn: async () => {
      const reportedPostIds = reports.filter((r) => r.post_id).map((r) => r.post_id);
      if (reportedPostIds.length === 0) return [];
      const { data, error } = await supabase
        .from('forum_posts')
        .select('*')
        .in('id', reportedPostIds);
      if (error) throw error;
      return data as ForumPost[];
    },
    enabled: reports.length > 0,
  });

  // Fetch all posts for moderation
  const { data: allPosts = [] } = useQuery({
    queryKey: ['all-forum-posts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('forum_posts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);
      if (error) throw error;
      return data as ForumPost[];
    },
  });

  // Fetch all comments for moderation
  const { data: allComments = [] } = useQuery({
    queryKey: ['all-forum-comments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('forum_comments')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);
      if (error) throw error;
      return data as ForumComment[];
    },
  });

  // Resolve report mutation
  const resolveReportMutation = useMutation({
    mutationFn: async ({ reportId, status }: { reportId: string; status: string }) => {
      const { error } = await supabase
        .from('forum_reports')
        .update({
          status,
          reviewed_at: new Date().toISOString(),
          reviewed_by: user?.id,
        })
        .eq('id', reportId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['forum-reports'] });
      toast.success('Report updated successfully');
      setSelectedReport(null);
      setResolution('');
    },
    onError: () => {
      toast.error('Failed to update report');
    },
  });

  // Toggle post visibility mutation
  const togglePostVisibilityMutation = useMutation({
    mutationFn: async ({ postId, isVisible }: { postId: string; isVisible: boolean }) => {
      const { error } = await supabase
        .from('forum_posts')
        .update({ is_visible: isVisible })
        .eq('id', postId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-forum-posts'] });
      queryClient.invalidateQueries({ queryKey: ['flagged-posts'] });
      toast.success('Post visibility updated');
    },
  });

  // Toggle comment visibility mutation
  const toggleCommentVisibilityMutation = useMutation({
    mutationFn: async ({ commentId, isVisible }: { commentId: string; isVisible: boolean }) => {
      const { error } = await supabase
        .from('forum_comments')
        .update({ is_visible: isVisible })
        .eq('id', commentId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-forum-comments'] });
      toast.success('Comment visibility updated');
    },
  });

  const pendingReports = reports.filter((r) => r.status === 'pending');
  const stats = {
    totalReports: reports.length,
    pendingReports: pendingReports.length,
    hiddenPosts: allPosts.filter((p) => !p.is_visible).length,
    hiddenComments: allComments.filter((c) => !c.is_visible).length,
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">Forum Moderation</h1>
          <p className="text-muted-foreground mt-1">Manage reports, moderate content, and maintain community standards</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Reports</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalReports}</div>
            </CardContent>
          </Card>
          <Card className={stats.pendingReports > 0 ? 'border-yellow-500' : ''}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Pending Reports</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{stats.pendingReports}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Hidden Posts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.hiddenPosts}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Hidden Comments</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.hiddenComments}</div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="reports" className="space-y-4">
          <TabsList>
            <TabsTrigger value="reports" className="flex items-center gap-2">
              <Flag className="h-4 w-4" />
              Reports {pendingReports.length > 0 && <Badge variant="destructive">{pendingReports.length}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="posts" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Posts
            </TabsTrigger>
            <TabsTrigger value="comments" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Comments
            </TabsTrigger>
          </TabsList>

          {/* Reports Tab */}
          <TabsContent value="reports">
            <Card>
              <CardHeader>
                <CardTitle>Content Reports</CardTitle>
                <CardDescription>Review and resolve user-submitted reports</CardDescription>
              </CardHeader>
              <CardContent>
                {reportsLoading ? (
                  <div className="text-center py-8 text-muted-foreground">Loading reports...</div>
                ) : reports.length === 0 ? (
                  <div className="text-center py-8">
                    <CheckCircle className="h-12 w-12 mx-auto text-green-500 mb-4" />
                    <p className="text-muted-foreground">No reports to review</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Reason</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {reports.map((report) => (
                        <TableRow key={report.id}>
                          <TableCell>{format(new Date(report.created_at), 'dd MMM yyyy')}</TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {report.post_id ? 'Post' : 'Comment'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">{report.reason}</p>
                              {report.description && (
                                <p className="text-sm text-muted-foreground truncate max-w-xs">
                                  {report.description}
                                </p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={statusColors[report.status] || ''}>
                              {report.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              {report.status === 'pending' && (
                                <>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="text-green-600"
                                    onClick={() => resolveReportMutation.mutate({ reportId: report.id, status: 'resolved' })}
                                  >
                                    <CheckCircle className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="text-gray-600"
                                    onClick={() => resolveReportMutation.mutate({ reportId: report.id, status: 'dismissed' })}
                                  >
                                    <XCircle className="h-4 w-4" />
                                  </Button>
                                </>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Posts Tab */}
          <TabsContent value="posts">
            <Card>
              <CardHeader>
                <CardTitle>All Forum Posts</CardTitle>
                <CardDescription>Moderate forum posts</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead>Stats</TableHead>
                      <TableHead>Visibility</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {allPosts.map((post) => (
                      <TableRow key={post.id} className={!post.is_visible ? 'opacity-50' : ''}>
                        <TableCell>{format(new Date(post.created_at), 'dd MMM yyyy')}</TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium truncate max-w-xs">{post.title}</p>
                            <p className="text-sm text-muted-foreground truncate max-w-xs">
                              {post.content.slice(0, 50)}...
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2 text-sm text-muted-foreground">
                            <span>{post.like_count} likes</span>
                            <span>•</span>
                            <span>{post.comment_count} comments</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={post.is_visible ? 'default' : 'secondary'}>
                            {post.is_visible ? 'Visible' : 'Hidden'}
                          </Badge>
                          {post.is_locked && (
                            <Badge variant="outline" className="ml-1">Locked</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => togglePostVisibilityMutation.mutate({
                              postId: post.id,
                              isVisible: !post.is_visible,
                            })}
                          >
                            {post.is_visible ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Comments Tab */}
          <TabsContent value="comments">
            <Card>
              <CardHeader>
                <CardTitle>All Forum Comments</CardTitle>
                <CardDescription>Moderate forum comments</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Content</TableHead>
                      <TableHead>Visibility</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {allComments.map((comment) => (
                      <TableRow key={comment.id} className={!comment.is_visible ? 'opacity-50' : ''}>
                        <TableCell>{format(new Date(comment.created_at), 'dd MMM yyyy')}</TableCell>
                        <TableCell>
                          <p className="truncate max-w-md">{comment.content}</p>
                        </TableCell>
                        <TableCell>
                          <Badge variant={comment.is_visible ? 'default' : 'secondary'}>
                            {comment.is_visible ? 'Visible' : 'Hidden'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => toggleCommentVisibilityMutation.mutate({
                              commentId: comment.id,
                              isVisible: !comment.is_visible,
                            })}
                          >
                            {comment.is_visible ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}