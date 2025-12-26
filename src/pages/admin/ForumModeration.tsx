import { useState } from 'react';
import { AdminLayout } from '@/components/layouts/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { Flag, Eye, EyeOff, MessageSquare, AlertTriangle, CheckCircle, XCircle, Loader2, ChevronLeft, ChevronRight, FileText } from 'lucide-react';
import { useAdminGuard } from '@/hooks/useAdminGuard';
import { createAuditLog } from '@/lib/auditLog';
import { ConfirmDialog } from '@/components/admin/ConfirmDialog';

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
  pending: 'bg-warning/10 text-warning border-warning/30',
  reviewed: 'bg-blue-500/10 text-blue-600 border-blue-300',
  resolved: 'bg-success/10 text-success border-success/30',
  dismissed: 'bg-muted text-muted-foreground border-muted',
  action_taken: 'bg-destructive/10 text-destructive border-destructive/30',
};

const ITEMS_PER_PAGE = 20;

export default function ForumModeration() {
  const { isAdmin, isLoading: guardLoading } = useAdminGuard();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [selectedReport, setSelectedReport] = useState<ForumReport | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [showResolveDialog, setShowResolveDialog] = useState(false);
  const [resolveAction, setResolveAction] = useState<'resolved' | 'dismissed' | 'action_taken'>('resolved');
  const [showContentDialog, setShowContentDialog] = useState(false);
  const [contentToView, setContentToView] = useState<{ type: 'post' | 'comment'; content: string; title?: string } | null>(null);
  const [showVisibilityConfirm, setShowVisibilityConfirm] = useState(false);
  const [visibilityTarget, setVisibilityTarget] = useState<{ type: 'post' | 'comment'; id: string; currentlyVisible: boolean } | null>(null);
  
  // Pagination
  const [reportsPage, setReportsPage] = useState(1);
  const [postsPage, setPostsPage] = useState(1);
  const [commentsPage, setCommentsPage] = useState(1);

  // Fetch reports with pagination
  const { data: reportsData, isLoading: reportsLoading, error: reportsError } = useQuery({
    queryKey: ['forum-reports', reportsPage],
    queryFn: async () => {
      const { count } = await supabase
        .from('forum_reports')
        .select('id', { count: 'exact', head: true });
      
      const offset = (reportsPage - 1) * ITEMS_PER_PAGE;
      const { data, error } = await supabase
        .from('forum_reports')
        .select('*')
        .order('created_at', { ascending: false })
        .range(offset, offset + ITEMS_PER_PAGE - 1);
      
      if (error) throw error;
      return { reports: data as ForumReport[], total: count || 0 };
    },
    enabled: isAdmin,
  });

  const reports = reportsData?.reports || [];
  const totalReports = reportsData?.total || 0;
  const totalReportPages = Math.ceil(totalReports / ITEMS_PER_PAGE);

  // Fetch all posts for moderation with pagination
  const { data: postsData } = useQuery({
    queryKey: ['all-forum-posts', postsPage],
    queryFn: async () => {
      const { count } = await supabase
        .from('forum_posts')
        .select('id', { count: 'exact', head: true });
      
      const offset = (postsPage - 1) * ITEMS_PER_PAGE;
      const { data, error } = await supabase
        .from('forum_posts')
        .select('*')
        .order('created_at', { ascending: false })
        .range(offset, offset + ITEMS_PER_PAGE - 1);
      
      if (error) throw error;
      return { posts: data as ForumPost[], total: count || 0 };
    },
    enabled: isAdmin,
  });

  const allPosts = postsData?.posts || [];
  const totalPosts = postsData?.total || 0;
  const totalPostPages = Math.ceil(totalPosts / ITEMS_PER_PAGE);

  // Fetch all comments for moderation with pagination
  const { data: commentsData } = useQuery({
    queryKey: ['all-forum-comments', commentsPage],
    queryFn: async () => {
      const { count } = await supabase
        .from('forum_comments')
        .select('id', { count: 'exact', head: true });
      
      const offset = (commentsPage - 1) * ITEMS_PER_PAGE;
      const { data, error } = await supabase
        .from('forum_comments')
        .select('*')
        .order('created_at', { ascending: false })
        .range(offset, offset + ITEMS_PER_PAGE - 1);
      
      if (error) throw error;
      return { comments: data as ForumComment[], total: count || 0 };
    },
    enabled: isAdmin,
  });

  const allComments = commentsData?.comments || [];
  const totalComments = commentsData?.total || 0;
  const totalCommentPages = Math.ceil(totalComments / ITEMS_PER_PAGE);

  // Resolve report mutation
  const resolveReportMutation = useMutation({
    mutationFn: async ({ reportId, status, notes }: { reportId: string; status: string; notes: string }) => {
      if (!notes.trim() && (status === 'resolved' || status === 'dismissed' || status === 'action_taken')) {
        throw new Error('Resolution notes are required');
      }
      
      const { error } = await supabase
        .from('forum_reports')
        .update({
          status,
          reviewed_at: new Date().toISOString(),
          reviewed_by: user?.id,
          description: notes ? `${selectedReport?.description || ''}\n\n--- Admin Notes ---\n${notes}` : selectedReport?.description,
        })
        .eq('id', reportId);
      
      if (error) throw error;

      await createAuditLog({
        action: status === 'resolved' ? 'resolve' : 'dismiss',
        entityType: 'forum_report',
        entityId: reportId,
        newData: { status, notes },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['forum-reports'] });
      toast.success('Report updated successfully');
      setShowResolveDialog(false);
      setSelectedReport(null);
      setResolutionNotes('');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update report');
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

      await createAuditLog({
        action: 'toggle_visibility',
        entityType: 'forum_post',
        entityId: postId,
        newData: { is_visible: isVisible },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-forum-posts'] });
      toast.success('Post visibility updated');
      setShowVisibilityConfirm(false);
      setVisibilityTarget(null);
    },
    onError: () => {
      toast.error('Failed to update post visibility');
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

      await createAuditLog({
        action: 'toggle_visibility',
        entityType: 'forum_comment',
        entityId: commentId,
        newData: { is_visible: isVisible },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-forum-comments'] });
      toast.success('Comment visibility updated');
      setShowVisibilityConfirm(false);
      setVisibilityTarget(null);
    },
    onError: () => {
      toast.error('Failed to update comment visibility');
    },
  });

  const openResolveDialog = (report: ForumReport, action: 'resolved' | 'dismissed' | 'action_taken') => {
    setSelectedReport(report);
    setResolveAction(action);
    setResolutionNotes('');
    setShowResolveDialog(true);
  };

  const handleResolve = () => {
    if (!selectedReport) return;
    resolveReportMutation.mutate({
      reportId: selectedReport.id,
      status: resolveAction,
      notes: resolutionNotes,
    });
  };

  const viewContent = async (report: ForumReport) => {
    if (report.post_id) {
      const post = allPosts.find(p => p.id === report.post_id);
      if (post) {
        setContentToView({ type: 'post', title: post.title, content: post.content });
        setShowContentDialog(true);
      } else {
        // Fetch if not in current page
        const { data } = await supabase.from('forum_posts').select('title, content').eq('id', report.post_id).single();
        if (data) {
          setContentToView({ type: 'post', title: data.title, content: data.content });
          setShowContentDialog(true);
        }
      }
    } else if (report.comment_id) {
      const comment = allComments.find(c => c.id === report.comment_id);
      if (comment) {
        setContentToView({ type: 'comment', content: comment.content });
        setShowContentDialog(true);
      } else {
        const { data } = await supabase.from('forum_comments').select('content').eq('id', report.comment_id).single();
        if (data) {
          setContentToView({ type: 'comment', content: data.content });
          setShowContentDialog(true);
        }
      }
    }
  };

  const confirmVisibilityToggle = (type: 'post' | 'comment', id: string, currentlyVisible: boolean) => {
    setVisibilityTarget({ type, id, currentlyVisible });
    setShowVisibilityConfirm(true);
  };

  const handleVisibilityConfirm = () => {
    if (!visibilityTarget) return;
    if (visibilityTarget.type === 'post') {
      togglePostVisibilityMutation.mutate({ postId: visibilityTarget.id, isVisible: !visibilityTarget.currentlyVisible });
    } else {
      toggleCommentVisibilityMutation.mutate({ commentId: visibilityTarget.id, isVisible: !visibilityTarget.currentlyVisible });
    }
  };

  const pendingReports = reports.filter((r) => r.status === 'pending');
  const stats = {
    totalReports: totalReports,
    pendingReports: reports.filter((r) => r.status === 'pending').length,
    hiddenPosts: allPosts.filter((p) => !p.is_visible).length,
    hiddenComments: allComments.filter((c) => !c.is_visible).length,
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
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">Forum Moderation</h1>
          <p className="text-muted-foreground mt-1">Manage reports, moderate content, and maintain community standards</p>
        </div>

        {/* Error State */}
        {reportsError && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Failed to load reports: {reportsError instanceof Error ? reportsError.message : 'Unknown error'}
            </AlertDescription>
          </Alert>
        )}

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
          <Card className={stats.pendingReports > 0 ? 'border-warning' : ''}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Pending Reports</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-warning">{stats.pendingReports}</div>
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
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : reports.length === 0 ? (
                  <div className="text-center py-8">
                    <CheckCircle className="h-12 w-12 mx-auto text-success mb-4" />
                    <p className="text-muted-foreground">No reports to review</p>
                  </div>
                ) : (
                  <>
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
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => viewContent(report)}
                                  title="View Content"
                                >
                                  <FileText className="h-4 w-4" />
                                </Button>
                                {report.status === 'pending' && (
                                  <>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="text-success"
                                      onClick={() => openResolveDialog(report, 'resolved')}
                                      title="Resolve"
                                    >
                                      <CheckCircle className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="text-destructive"
                                      onClick={() => openResolveDialog(report, 'action_taken')}
                                      title="Take Action"
                                    >
                                      <AlertTriangle className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="text-muted-foreground"
                                      onClick={() => openResolveDialog(report, 'dismissed')}
                                      title="Dismiss"
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

                    {/* Pagination */}
                    {totalReportPages > 1 && (
                      <div className="flex items-center justify-between mt-4">
                        <p className="text-sm text-muted-foreground">
                          Page {reportsPage} of {totalReportPages}
                        </p>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setReportsPage(p => Math.max(1, p - 1))}
                            disabled={reportsPage === 1}
                          >
                            <ChevronLeft className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setReportsPage(p => Math.min(totalReportPages, p + 1))}
                            disabled={reportsPage === totalReportPages}
                          >
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Posts Tab */}
          <TabsContent value="posts">
            <Card>
              <CardHeader>
                <CardTitle>All Forum Posts</CardTitle>
                <CardDescription>Moderate forum posts ({totalPosts} total)</CardDescription>
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
                            onClick={() => confirmVisibilityToggle('post', post.id, post.is_visible)}
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

                {/* Pagination */}
                {totalPostPages > 1 && (
                  <div className="flex items-center justify-between mt-4">
                    <p className="text-sm text-muted-foreground">
                      Page {postsPage} of {totalPostPages}
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPostsPage(p => Math.max(1, p - 1))}
                        disabled={postsPage === 1}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPostsPage(p => Math.min(totalPostPages, p + 1))}
                        disabled={postsPage === totalPostPages}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Comments Tab */}
          <TabsContent value="comments">
            <Card>
              <CardHeader>
                <CardTitle>All Forum Comments</CardTitle>
                <CardDescription>Moderate forum comments ({totalComments} total)</CardDescription>
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
                            onClick={() => confirmVisibilityToggle('comment', comment.id, comment.is_visible)}
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

                {/* Pagination */}
                {totalCommentPages > 1 && (
                  <div className="flex items-center justify-between mt-4">
                    <p className="text-sm text-muted-foreground">
                      Page {commentsPage} of {totalCommentPages}
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCommentsPage(p => Math.max(1, p - 1))}
                        disabled={commentsPage === 1}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCommentsPage(p => Math.min(totalCommentPages, p + 1))}
                        disabled={commentsPage === totalCommentPages}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Resolve Dialog */}
        <Dialog open={showResolveDialog} onOpenChange={setShowResolveDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {resolveAction === 'resolved' && 'Resolve Report'}
                {resolveAction === 'dismissed' && 'Dismiss Report'}
                {resolveAction === 'action_taken' && 'Take Action on Report'}
              </DialogTitle>
              <DialogDescription>
                {resolveAction === 'resolved' && 'Mark this report as resolved. The content remains visible.'}
                {resolveAction === 'dismissed' && 'Dismiss this report as invalid or not actionable.'}
                {resolveAction === 'action_taken' && 'Record that action was taken on the reported content.'}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="notes">Resolution Notes (Required)</Label>
                <Textarea
                  id="notes"
                  placeholder="Explain your decision..."
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  className="mt-1"
                />
                {!resolutionNotes.trim() && (
                  <p className="text-sm text-destructive mt-1">Notes are required</p>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowResolveDialog(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleResolve}
                disabled={!resolutionNotes.trim() || resolveReportMutation.isPending}
                variant={resolveAction === 'action_taken' ? 'destructive' : 'default'}
              >
                {resolveReportMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {resolveAction === 'resolved' && 'Resolve'}
                {resolveAction === 'dismissed' && 'Dismiss'}
                {resolveAction === 'action_taken' && 'Confirm Action Taken'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Content View Dialog */}
        <Dialog open={showContentDialog} onOpenChange={setShowContentDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Reported {contentToView?.type === 'post' ? 'Post' : 'Comment'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {contentToView?.title && (
                <div>
                  <Label className="text-muted-foreground">Title</Label>
                  <p className="font-medium">{contentToView.title}</p>
                </div>
              )}
              <div>
                <Label className="text-muted-foreground">Content</Label>
                <div className="mt-1 p-4 bg-muted rounded-lg max-h-96 overflow-y-auto">
                  <p className="whitespace-pre-wrap">{contentToView?.content}</p>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowContentDialog(false)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Visibility Confirmation Dialog */}
        <ConfirmDialog
          open={showVisibilityConfirm}
          onOpenChange={setShowVisibilityConfirm}
          title={`${visibilityTarget?.currentlyVisible ? 'Hide' : 'Show'} ${visibilityTarget?.type}`}
          description={`Are you sure you want to ${visibilityTarget?.currentlyVisible ? 'hide' : 'show'} this ${visibilityTarget?.type}?`}
          confirmLabel={visibilityTarget?.currentlyVisible ? 'Hide' : 'Show'}
          onConfirm={handleVisibilityConfirm}
          isLoading={togglePostVisibilityMutation.isPending || toggleCommentVisibilityMutation.isPending}
          variant={visibilityTarget?.currentlyVisible ? 'destructive' : 'default'}
        />
      </div>
    </AdminLayout>
  );
}