export interface Subtitle {
  label: string;
  file: string;
}

export interface StreamData {
  title: string;
  imdb_id: string;
  file_name: string;
  backdrop: string;
  stream_urls: string[];
  /** Season number — TV only */
  season?: string;
  /** Episode number — TV only */
  episode?: string;
}

export interface StreamResponse {
  status_code: string;
  data: StreamData;
  default_subs: Subtitle[];
  subtitles: Subtitle[];
  subtitles_provider: string;
  thumbnails_url?: string | null;
}
