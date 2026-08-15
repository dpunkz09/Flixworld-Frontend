// Comment notification - fired when someone comments on a thread you follow
export interface CommentNotificationData {
  type?: "comment";
  comment_id: number;
  commenter_id: number;
  commenter_name: string;
  media_type: "movie" | "tv";
  tmdb_id: number;
  media_title: string;
  body_preview: string;
  parent_id: number | null;
}

// Report update notification - fired when admin changes a report status
export interface ReportNotificationData {
  type: "report_update";
  report_id: number;
  media_type: "movie" | "tv";
  tmdb_id: number;
  media_title: string;
  status: string;
  admin_note: string | null;
  message: string;
}

export type NotificationData = CommentNotificationData | ReportNotificationData;

export interface Notification {
  id: string;
  data: NotificationData;
  read_at: string | null;
  created_at: string;
}

export interface NotificationsResponse {
  data: Notification[];
  meta: {
    current_page: number;
    last_page: number;
    total: number;
    unread_count: number;
  };
}
