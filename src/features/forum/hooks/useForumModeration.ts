import { useAuth } from '@/features/auth/hooks/useAuth';
import { useToast } from '@/shared/hooks/use-toast';
import { createAuditLog } from '@/shared/utils/auditLog';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { forumModerationService } from '../services/forumModerationService';
import { ForumReportStatus } from '../types/forum-moderation';

export function useForumModeration(
  page: number = 1, 
  pageSize: number = 20, 
  statusFilter?: string,
  postsPage: number = 1,
  commentsPage: number = 1
) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();

  const {
    data: reportsData,
    isLoading: isLoadingReports,
    error: reportsError,
  } = useQuery({
    queryKey: ['admin-forum-reports', page, pageSize, statusFilter],
    queryFn: () => forumModerationService.fetchReports(page, pageSize, statusFilter),
  });

  const {
    data: postsData,
    isLoading: isLoadingPosts,
  } = useQuery({
    queryKey: ['admin-forum-posts', postsPage, pageSize],
    queryFn: () => forumModerationService.fetchPosts(postsPage, pageSize),
  });

  const {
    data: commentsData,
    isLoading: isLoadingComments,
  } = useQuery({
    queryKey: ['admin-forum-comments', commentsPage, pageSize],
    queryFn: () => forumModerationService.fetchComments(commentsPage, pageSize),
  });

  const {
    data: stats,
    isLoading: isLoadingStats,
  } = useQuery({
    queryKey: ['admin-forum-stats'],
    queryFn: forumModerationService.fetchReportStats,
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status, notes }: { id: string; status: ForumReportStatus; notes?: string }) =>
      forumModerationService.updateReportStatus(id, status, notes),
    onSuccess: (_, { id, status }) => {
      queryClient.invalidateQueries({ queryKey: ['admin-forum-reports'] });
      queryClient.invalidateQueries({ queryKey: ['admin-forum-stats'] });
      
      createAuditLog({
        action: 'update',
        entityType: 'forum_report',
        entityId: id,
        newData: { status },
      });

      toast({
        title: 'Report Updated',
        description: `Report status changed to ${status}`,
      });
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: `Failed to update report: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
    },
  });

  const updateVisibilityMutation = useMutation({
    mutationFn: ({ type, id, isVisible }: { type: 'post' | 'comment'; id: string; isVisible: boolean }) =>
      forumModerationService.updateContentVisibility(type, id, isVisible),
    onSuccess: (_, { type, id, isVisible }) => {
      queryClient.invalidateQueries({ queryKey: ['admin-forum-posts'] });
      queryClient.invalidateQueries({ queryKey: ['admin-forum-comments'] });
      
      createAuditLog({
        action: 'toggle_visibility',
        entityType: type === 'post' ? 'forum_post' : 'forum_comment',
        entityId: id,
        newData: { is_visible: isVisible },
      });

      toast({
        title: 'Visibility Updated',
        description: `${type === 'post' ? 'Post' : 'Comment'} is now ${isVisible ? 'visible' : 'hidden'}`,
      });
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: `Failed to update visibility: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
    },
  });

  const fetchContent = async (type: 'post' | 'comment', id: string) => {
    if (type === 'post') {
      return forumModerationService.fetchPost(id);
    } else {
      return forumModerationService.fetchComment(id);
    }
  };

  return {
    reports: reportsData?.reports || [],
    totalReports: reportsData?.total || 0,
    posts: postsData?.posts || [],
    totalPosts: postsData?.total || 0,
    comments: commentsData?.comments || [],
    totalComments: commentsData?.total || 0,
    stats,
    isLoading: isLoadingReports || isLoadingStats || isLoadingPosts || isLoadingComments,
    error: reportsError,
    updateStatus: updateStatusMutation.mutate,
    updateVisibility: updateVisibilityMutation.mutate,
    fetchContent,
    isUpdating: updateStatusMutation.isPending || updateVisibilityMutation.isPending,
  };
}
