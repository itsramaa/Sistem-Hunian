import { supabase } from '@/lib/integrations/supabase/client';
import { ForumComment, ForumPost, ForumReport, ForumReportStats, ForumReportStatus } from '../types/forum-moderation';

export const forumModerationService = {
  async fetchReports(page: number, pageSize: number, status?: string): Promise<{ reports: ForumReport[]; total: number }> {
    let query = supabase
      .from('forum_reports')
      .select('*, reporter:profiles!reporter_id(email, full_name)', { count: 'exact' });

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) throw error;

    return {
      reports: (data as any[]) || [],
      total: count || 0,
    };
  },

  async fetchReportStats(): Promise<ForumReportStats> {
    const { data, error } = await supabase
      .from('forum_reports')
      .select('status');

    if (error) throw error;

    const stats: ForumReportStats = {
      total: data.length,
      pending: 0,
      resolved: 0,
      dismissed: 0,
    };

    data.forEach((report) => {
      if (report.status === 'pending') stats.pending++;
      else if (report.status === 'resolved' || report.status === 'action_taken') stats.resolved++;
      else if (report.status === 'dismissed') stats.dismissed++;
    });

    return stats;
  },

  async updateReportStatus(id: string, status: ForumReportStatus, notes?: string): Promise<void> {
    const { error } = await supabase
      .from('forum_reports')
      .update({
        status,
        reviewed_at: new Date().toISOString(),
        // Note: reviewed_by should be set by RLS or trigger, but we can try setting it if the schema allows
        // otherwise we assume the backend handles it. Ideally we pass the current user ID if needed.
      })
      .eq('id', id);

    if (error) throw error;
  },

  async fetchPosts(page: number, pageSize: number): Promise<{ posts: ForumPost[]; total: number }> {
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const { data, error, count } = await supabase
      .from('forum_posts')
      .select('*, author:profiles!author_id(email, full_name)', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) throw error;

    return {
      posts: (data as any[]) || [],
      total: count || 0,
    };
  },

  async fetchComments(page: number, pageSize: number): Promise<{ comments: ForumComment[]; total: number }> {
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const { data, error, count } = await supabase
      .from('forum_comments')
      .select('*, author:profiles!author_id(email, full_name)', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) throw error;

    return {
      comments: (data as any[]) || [],
      total: count || 0,
    };
  },

  async fetchPost(id: string): Promise<ForumPost> {
    const { data, error } = await supabase
      .from('forum_posts')
      .select('*, author:profiles!author_id(email, full_name)')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data as any;
  },

  async fetchComment(id: string): Promise<ForumComment> {
    const { data, error } = await supabase
      .from('forum_comments')
      .select('*, author:profiles!author_id(email, full_name)')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data as any;
  },

  async updateContentVisibility(type: 'post' | 'comment', id: string, isVisible: boolean): Promise<void> {
    const table = type === 'post' ? 'forum_posts' : 'forum_comments';
    const { error } = await supabase
      .from(table)
      .update({ is_visible: isVisible })
      .eq('id', id);

    if (error) throw error;
  },
};
