import { useAdminGuard } from '@/features/auth/hooks/useAdminGuard';
import { ForumCommentsTable } from '@/features/forum/components/admin/ForumCommentsTable';
import { ForumContentDialog } from '@/features/forum/components/admin/ForumContentDialog';
import { ForumPostsTable } from '@/features/forum/components/admin/ForumPostsTable';
import { ForumReportsTable } from '@/features/forum/components/admin/ForumReportsTable';
import { ForumResolveDialog } from '@/features/forum/components/admin/ForumResolveDialog';
import { ForumStats } from '@/features/forum/components/admin/ForumStats';
import { useForumModeration } from '@/features/forum/hooks/useForumModeration';
import { ForumReport, ForumReportStatus } from '@/features/forum/types/forum-moderation';
import { AdminLayout } from '@/shared/components/layouts/AdminLayout';
import { Alert, AlertDescription } from '@/shared/components/ui/alert';
import { Badge } from '@/shared/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import { AlertTriangle, Flag, Loader2, MessageSquare } from 'lucide-react';
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
              setContentToView({ type: 'post', title: (fetchedPost as { title?: string }).title, content: fetchedPost.content });
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
    // Ideally we should use a ConfirmDialog but for now let's just update directly or keep the logic
    // The original code had showVisibilityConfirm state but didn't use the ConfirmDialog component in the rendered JSX (it was imported but not used in the truncated part)
    // Let's implement direct toggle for now to simplify, or use window.confirm
    if (window.confirm(`Apakah Anda yakin ingin ${currentlyVisible ? 'menyembunyikan' : 'menampilkan'} konten ini?`)) {
       updateVisibility({
        type,
        id,
        isVisible: !currentlyVisible
      });
    }
  };

  const totalReportPages = Math.ceil(totalReports / ITEMS_PER_PAGE);
  const totalPostPages = Math.ceil(totalPosts / ITEMS_PER_PAGE);
  const totalCommentPages = Math.ceil(totalComments / ITEMS_PER_PAGE);

  if (guardLoading || isLoading) {
    return (
      <AdminLayout title="Moderasi Forum" description="Kelola laporan, moderasi konten, dan jaga standar komunitas">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Moderasi Forum" description="Kelola laporan, moderasi konten, dan jaga standar komunitas">
      <div className="space-y-6">

        {/* Error State */}
        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Gagal memuat laporan: {error instanceof Error ? error.message : 'Kesalahan tidak diketahui'}
            </AlertDescription>
          </Alert>
        )}

        {/* Stats */}
        <ForumStats stats={stats} isLoading={isLoading} />

        <Tabs defaultValue="reports" className="space-y-4">
          <TabsList>
            <TabsTrigger value="reports" className="flex items-center gap-2">
              <Flag className="h-4 w-4" />
              Laporan {(stats?.pending || 0) > 0 && <Badge variant="destructive">{stats?.pending || 0}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="posts" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Postingan
            </TabsTrigger>
            <TabsTrigger value="comments" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Komentar
            </TabsTrigger>
          </TabsList>

          {/* Reports Tab */}
          <TabsContent value="reports" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Laporan</CardTitle>
                  <CardDescription>Tinjau dan tindak lanjuti laporan pengguna</CardDescription>
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter berdasarkan status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Status</SelectItem>
                    <SelectItem value="pending">Menunggu</SelectItem>
                    <SelectItem value="reviewed">Ditinjau</SelectItem>
                    <SelectItem value="resolved">Diselesaikan</SelectItem>
                    <SelectItem value="dismissed">Diabaikan</SelectItem>
                    <SelectItem value="action_taken">Tindakan Diambil</SelectItem>
                  </SelectContent>
                </Select>
              </CardHeader>
              <CardContent>
                <ForumReportsTable 
                  reports={reports}
                  statusColors={statusColors}
                  onViewContent={viewContent}
                  onResolve={openResolveDialog}
                  page={reportsPage}
                  totalPages={totalReportPages}
                  onPageChange={setReportsPage}
                  isLoading={isLoading}
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Posts Tab */}
          <TabsContent value="posts" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Postingan Forum</CardTitle>
                <CardDescription>Moderasi postingan pengguna</CardDescription>
              </CardHeader>
              <CardContent>
                <ForumPostsTable 
                  posts={posts}
                  onVisibilityToggle={(id, isVisible) => confirmVisibilityToggle('post', id, isVisible)}
                  page={postsPage}
                  totalPages={totalPostPages}
                  onPageChange={setPostsPage}
                  isLoading={isLoading}
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Comments Tab */}
          <TabsContent value="comments" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Komentar Forum</CardTitle>
                <CardDescription>Moderasi komentar pengguna</CardDescription>
              </CardHeader>
              <CardContent>
                <ForumCommentsTable 
                  comments={comments}
                  onVisibilityToggle={(id, isVisible) => confirmVisibilityToggle('comment', id, isVisible)}
                  page={commentsPage}
                  totalPages={totalCommentPages}
                  onPageChange={setCommentsPage}
                  isLoading={isLoading}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <ForumResolveDialog 
          open={showResolveDialog}
          onOpenChange={setShowResolveDialog}
          selectedReport={selectedReport}
          action={resolveAction}
          notes={resolutionNotes}
          onNotesChange={setResolutionNotes}
          onConfirm={handleResolve}
          isUpdating={isUpdating}
        />

        <ForumContentDialog 
          open={showContentDialog}
          onOpenChange={setShowContentDialog}
          content={contentToView}
        />

      </div>
    </AdminLayout>
  );
}
