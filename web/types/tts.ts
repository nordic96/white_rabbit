export interface TTSRequest {
  mystery_id: string;
  text: string;
  voice_id?: string;
}

export interface TTSResponse {
  audio_url: string;
  cached: boolean;
}

export interface TTSHealthResponse {
  status: 'not_loaded' | 'ready';
  model_loaded: boolean;
  lazy_load: boolean;
  default_voice?: string;
  sample_rate?: number;
  max_text_length?: number;
}

export interface TTSWarmupResponse {
  status: string;
  message: string;
}
