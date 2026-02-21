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
    full_name: string | null;
  };
}

export interface ForumPost {
  id: string;
  title: string;
  content: string;
  author_id: string;
  property_id: string | null;
  is_visible: boolean | null;
  is_pinned: boolean | null;
  is_locked: boolean | null;
  like_count: number | null;
  comment_count: number | null;
  view_count: number | null;
  tags: string[] | null;
  photos: string[] | null;
  created_at: string;
  updated_at: string;
  author?: {
    email: string;
    full_name: string | null;
  };
}

export interface ForumComment {
  id: string;
  post_id: string;
  author_id: string;
  content: string;
  parent_id: string | null;
  is_visible: boolean | null;
  like_count: number | null;
  created_at: string;
  updated_at: string;
  author?: {
    email: string;
    full_name: string | null;
  };
}

export interface ForumReportStats {
  total: number;
  pending: number;
  resolved: number;
  dismissed: number;
}
