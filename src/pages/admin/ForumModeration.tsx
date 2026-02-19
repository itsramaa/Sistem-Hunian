import { useAdminGuard } from '@/features/auth/hooks/useAdminGuard';
import { useForumModeration } from '@/features/forum/hooks/useForumModeration';
import { ForumReport, ForumReportStatus } from '@/features/forum/types';
import { ConfirmDialog } from "@/shared/components/ConfirmDialog";
import { AdminLayout } from '@/shared/components/layouts/AdminLayout';
import { Alert, AlertDescription } from '@/shared/components/ui/alert';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog';
import { Label } from '@/shared/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import { Textarea } from '@/shared/components/ui/textarea';
import { format } from 'date-fns';
import { AlertTriangle, CheckCircle, ChevronLeft, ChevronRight, Eye, EyeOff, Flag, Loader2, MessageSquare, XCircle } from 'lucide-react';
import { useState } from 'react';

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
  const [reportsPage, setReportsPage] = useState(1);
  const [postsPage, setPostsPage] = useState(1);
  const [commentsPage, setCommentsPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  const {
    reports,
    totalReports,
    posts,
    totalPosts,
    comments,
    totalComments,
    stats,
    isLoading,
    error,
    updateStatus,
    updateVisibility,
    fetchContent,
    isUpdating
  } = useForumModeration(reportsPage, ITEMS_PER_PAGE, statusFilter, postsPage, commentsPage);

  const [selectedReport, setSelectedReport] = useState<ForumReport | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [showResolveDialog, setShowResolveDialog] = useState(false);
  const [resolveAction, setResolveAction] = useState<ForumReportStatus>('resolved');
  
  const [showContentDialog, setShowContentDialog] = useState(false);
  const [contentToView, setContentToView] = useState<{ type: 'post' | 'comment'; content: string; title?: string } | null>(null);
  
  const [showVisibilityConfirm, setShowVisibilityConfirm] = useState(false);
  const [visibilityTarget, setVisibilityTarget] = useState<{ type: 'post' | 'comment'; id: string; currentlyVisible: boolean } | null>(null);

  const openResolveDialog = (report: ForumReport, action: ForumReportStatus) => {
    setSelectedReport(report);
    setResolveAction(action);
    setResolutionNotes('');
    setShowResolveDialog(true);
  };

  const handleResolve = () => {
    if (!selectedReport) return;
    updateStatus({
      id: selectedReport.id,
      status: resolveAction,
      notes: resolutionNotes,
    });
    setShowResolveDialog(false);
  };

  const viewContent = async (report: ForumReport) => {
    if (report.post_id) {
      // Check if post is in current list
      const post = posts.find(p => p.id === report.post_id);
      if (post) {
        setContentToView({ type: 'post', title: post.title, content: post.content });
        setShowContentDialog(true);
      } else {
        // Fetch
        try {
          const fetchedPost = await fetchContent('post', report.post_id);
          if (fetchedPost) {
            setContentToView({ type: 'post', title: fetchedPost.title, content: fetchedPost.content });
            setShowContentDialog(true);
          }
        } catch (e) {
          console.error(e);
        }
      }
    } else if (report.comment_id) {
      const comment = comments.find(c => c.id === report.comment_id);
      if (comment) {
        setContentToView({ type: 'comment', content: comment.content });
        setShowContentDialog(true);
      } else {
         try {
          const fetchedComment = await fetchContent('comment', report.comment_id);
          if (fetchedComment) {
            setContentToView({ type: 'comment', content: fetchedComment.content });
            setShowContentDialog(true);
          }
        } catch (e) {
          console.error(e);
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
    updateVisibility({
      type: visibilityTarget.type,
      id: visibilityTarget.id,
      isVisible: !visibilityTarget.currentlyVisible
    });
    setShowVisibilityConfirm(false);
    setVisibilityTarget(null);
  };

  const totalReportPages = Math.ceil(totalReports / ITEMS_PER_PAGE);
  const totalPostPages = Math.ceil(totalPosts / ITEMS_PER_PAGE);
  const totalCommentPages = Math.ceil(totalComments / ITEMS_PER_PAGE);

  if (guardLoading || isLoading) {
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
        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Failed to load reports: {error instanceof Error ? error.message : 'Unknown error'}
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
              <div className="text-2xl font-bold">{stats?.total || 0}</div>
            </CardContent>
          </Card>
          <Card className={(stats?.pending || 0) > 0 ? 'border-warning' : ''}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Pending Reports</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-warning">{stats?.pending || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Resolved</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success">{stats?.resolved || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Dismissed</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-muted-foreground">{stats?.dismissed || 0}</div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="reports" className="space-y-4">
          <TabsList>
            <TabsTrigger value="reports" className="flex items-center gap-2">
              <Flag className="h-4 w-4" />
              Reports {(stats?.pending || 0) > 0 && <Badge variant="destructive">{stats?.pending || 0}</Badge>}
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
          <TabsContent value="reports" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Reports</CardTitle>
                  <CardDescription>Review and act on user reports</CardDescription>
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="reviewed">Reviewed</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                    <SelectItem value="dismissed">Dismissed</SelectItem>
                    <SelectItem value="action_taken">Action Taken</SelectItem>
                  </SelectContent>
                </Select>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Reason</TableHead>
                        <TableHead>Reporter</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {reports.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                            No reports found
                          </TableCell>
                        </TableRow>
                      ) : (
                        reports.map((report) => (
                          <TableRow key={report.id}>
                            <TableCell>{format(new Date(report.created_at), 'MMM d, yyyy')}</TableCell>
                            <TableCell>
                              {report.post_id ? (
                                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Post</Badge>
                              ) : (
                                <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">Comment</Badge>
                              )}
                            </TableCell>
                            <TableCell className="max-w-[200px] truncate" title={report.description || ''}>
                              <span className="font-medium block">{report.reason}</span>
                              <span className="text-xs text-muted-foreground">{report.description}</span>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm">{report.reporter?.full_name || 'Unknown'}</div>
                              <div className="text-xs text-muted-foreground">{report.reporter?.email}</div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className={statusColors[report.status]}>
                                {report.status.replace('_', ' ')}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-2">
                                <Button variant="ghost" size="sm" onClick={() => viewContent(report)}>
                                  <Eye className="h-4 w-4 mr-1" /> View Content
                                </Button>
                                {report.status === 'pending' && (
                                  <>
                                    <Button variant="ghost" size="sm" className="text-success hover:text-success hover:bg-success/10" onClick={() => openResolveDialog(report, 'resolved')}>
                                      <CheckCircle className="h-4 w-4" />
                                    </Button>
                                    <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground" onClick={() => openResolveDialog(report, 'dismissed')}>
                                      <XCircle className="h-4 w-4" />
                                    </Button>
                                  </>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination */}
                {totalReportPages > 1 && (
                  <div className="flex items-center justify-end space-x-2 py-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setReportsPage((p) => Math.max(1, p - 1))}
                      disabled={reportsPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </Button>
                    <div className="text-sm text-muted-foreground">
                      Page {reportsPage} of {totalReportPages}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setReportsPage((p) => Math.min(totalReportPages, p + 1))}
                      disabled={reportsPage === totalReportPages}
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Posts Tab */}
          <TabsContent value="posts" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Forum Posts</CardTitle>
                <CardDescription>Moderate user posts</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Author</TableHead>
                        <TableHead>Title/Content</TableHead>
                        <TableHead>Stats</TableHead>
                        <TableHead>Visibility</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {posts.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                            No posts found
                          </TableCell>
                        </TableRow>
                      ) : (
                        posts.map((post) => (
                          <TableRow key={post.id}>
                            <TableCell>{format(new Date(post.created_at), 'MMM d, yyyy')}</TableCell>
                            <TableCell>
                              <div className="text-sm">{post.author?.full_name || 'Unknown'}</div>
                              <div className="text-xs text-muted-foreground">{post.author?.email}</div>
                            </TableCell>
                            <TableCell className="max-w-[300px]">
                              <div className="font-medium truncate">{post.title}</div>
                              <div className="text-xs text-muted-foreground truncate">{post.content}</div>
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-2 text-xs text-muted-foreground">
                                <span>{post.like_count || 0} likes</span>
                                <span>{post.comment_count || 0} comments</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              {post.is_visible ? (
                                <Badge variant="outline" className="bg-success/10 text-success border-success/20">Visible</Badge>
                              ) : (
                                <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20">Hidden</Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => confirmVisibilityToggle('post', post.id, post.is_visible)}
                                className={post.is_visible ? "text-destructive hover:text-destructive hover:bg-destructive/10" : "text-success hover:text-success hover:bg-success/10"}
                              >
                                {post.is_visible ? <EyeOff className="h-4 w-4 mr-1" /> : <Eye className="h-4 w-4 mr-1" />}
                                {post.is_visible ? 'Hide' : 'Show'}
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
                 {/* Pagination for Posts */}
                 {totalPostPages > 1 && (
                  <div className="flex items-center justify-end space-x-2 py-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPostsPage((p) => Math.max(1, p - 1))}
                      disabled={postsPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </Button>
                    <div className="text-sm text-muted-foreground">
                      Page {postsPage} of {totalPostPages}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPostsPage((p) => Math.min(totalPostPages, p + 1))}
                      disabled={postsPage === totalPostPages}
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Comments Tab */}
          <TabsContent value="comments" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Forum Comments</CardTitle>
                <CardDescription>Moderate user comments</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Author</TableHead>
                        <TableHead>Content</TableHead>
                        <TableHead>Visibility</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {comments.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                            No comments found
                          </TableCell>
                        </TableRow>
                      ) : (
                        comments.map((comment) => (
                          <TableRow key={comment.id}>
                            <TableCell>{format(new Date(comment.created_at), 'MMM d, yyyy')}</TableCell>
                            <TableCell>
                              <div className="text-sm">{comment.author?.full_name || 'Unknown'}</div>
                              <div className="text-xs text-muted-foreground">{comment.author?.email}</div>
                            </TableCell>
                            <TableCell className="max-w-[400px]">
                              <div className="text-sm truncate">{comment.content}</div>
                            </TableCell>
                            <TableCell>
                              {comment.is_visible ? (
                                <Badge variant="outline" className="bg-success/10 text-success border-success/20">Visible</Badge>
                              ) : (
                                <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20">Hidden</Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => confirmVisibilityToggle('comment', comment.id, comment.is_visible)}
                                className={comment.is_visible ? "text-destructive hover:text-destructive hover:bg-destructive/10" : "text-success hover:text-success hover:bg-success/10"}
                              >
                                {comment.is_visible ? <EyeOff className="h-4 w-4 mr-1" /> : <Eye className="h-4 w-4 mr-1" />}
                                {comment.is_visible ? 'Hide' : 'Show'}
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
                 {/* Pagination for Comments */}
                 {totalCommentPages > 1 && (
                  <div className="flex items-center justify-end space-x-2 py-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCommentsPage((p) => Math.max(1, p - 1))}
                      disabled={commentsPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </Button>
                    <div className="text-sm text-muted-foreground">
                      Page {commentsPage} of {totalCommentPages}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCommentsPage((p) => Math.min(totalCommentPages, p + 1))}
                      disabled={commentsPage === totalCommentPages}
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </Button>
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
              <DialogTitle>Resolve Report</DialogTitle>
              <DialogDescription>
                Update the status of this report.
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="action">Action</Label>
                <Select 
                  value={resolveAction} 
                  onValueChange={(v) => setResolveAction(v as ForumReportStatus)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select action" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="resolved">Mark as Resolved</SelectItem>
                    <SelectItem value="dismissed">Dismiss Report</SelectItem>
                    <SelectItem value="action_taken">Take Action & Resolve</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  placeholder="Add details about your decision..."
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowResolveDialog(false)}>Cancel</Button>
              <Button onClick={handleResolve} disabled={isUpdating}>
                {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Confirm
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Content View Dialog */}
        <Dialog open={showContentDialog} onOpenChange={setShowContentDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                View {contentToView?.type === 'post' ? 'Post' : 'Comment'} Content
              </DialogTitle>
            </DialogHeader>
            <div className="py-4 space-y-4">
              {contentToView?.title && (
                <div>
                  <h3 className="text-lg font-semibold">{contentToView.title}</h3>
                </div>
              )}
              <div className="p-4 bg-muted/50 rounded-md whitespace-pre-wrap">
                {contentToView?.content}
              </div>
            </div>
            <DialogFooter>
              <Button onClick={() => setShowContentDialog(false)}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Visibility Confirm Dialog */}
        <ConfirmDialog
          isOpen={showVisibilityConfirm}
          onClose={() => setShowVisibilityConfirm(false)}
          onConfirm={handleVisibilityConfirm}
          title={visibilityTarget?.currentlyVisible ? "Hide Content" : "Show Content"}
          description={`Are you sure you want to ${visibilityTarget?.currentlyVisible ? "hide" : "show"} this ${visibilityTarget?.type}?`}
          confirmLabel={visibilityTarget?.currentlyVisible ? "Hide" : "Show"}
          variant={visibilityTarget?.currentlyVisible ? "destructive" : "default"}
          isLoading={isUpdating}
        />
      </div>
    </AdminLayout>
  );
}
