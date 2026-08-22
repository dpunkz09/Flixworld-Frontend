export interface Subtitle {
  label: string;
  file: string;
}

export interface StreamServer {
  id: string;
  label: string;
  url: string;
  type: "hls" | "mp4";
  /** Referer header required by the stream origin — forwarded to the HLS proxy */
  referer?: string;
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
  /** All available stream servers including primary */
  servers: StreamServer[];
}
