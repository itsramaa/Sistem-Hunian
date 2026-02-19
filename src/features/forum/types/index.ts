export type ForumReportStatus = 'pending' | 'reviewed' | 'resolved' | 'dismissed' | 'action_taken';

export interface ForumReport {
  id: string;
  post_id: string | null;
  comment_id: string | null;
  reporter_id: string;
  reason: string;
  description: string | null;
  status: ForumReportStatus;
  reviewed_at: string | null;
  reviewed_by: string | null;
  created_at: string;
  reporter?: {
    email: string;
    full_name: string;
  };
}

export interface ForumPost {
  id: string;
  title: string;
  content: string;
  author_id: string;
  is_visible: boolean;
  is_locked: boolean;
  like_count: number;
  comment_count: number;
  created_at: string;
  author?: {
    email: string;
    full_name: string;
  };
}

export interface ForumComment {
  id: string;
  post_id: string;
  content: string;
  author_id: string;
  is_visible: boolean;
  created_at: string;
  author?: {
    email: string;
    full_name: string;
  };
}

export interface ForumReportStats {
  total: number;
  pending: number;
  resolved: number;
  dismissed: number;
}
