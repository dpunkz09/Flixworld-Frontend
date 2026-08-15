export interface CommentUser {
  id: number;
  name: string;
  profile_picture: string | null;
}

export interface Comment {
  id: number;
  body: string;
  platform: "web" | "android";
  parent_id: number | null;
  created_at: string;
  updated_at: string;
  is_mine: boolean;
  user: CommentUser;
  replies: Comment[];
  reply_count: number;
}

export interface CommentsResponse {
  data: Comment[];
  meta: {
    current_page: number;
    last_page: number;
    total: number;
  };
  is_following: boolean;
}

export interface PostCommentPayload {
  body: string;
  parent_id?: number | null;
  media_title?: string;
  platform?: string;
}
