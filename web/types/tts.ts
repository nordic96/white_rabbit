export interface TTSRequest {
  mystery_id: string;
  text: string;
  voice_id?: string;
}

export interface TTSResponse {
  audio_url: string;
  cached: boolean;
}

export type TTSModelStatus = 'ready' | 'not_loaded' | 'warmed_up';

export interface TTSHealthResponse {
  status: TTSModelStatus;
  model_loaded: boolean;
  lazy_load: boolean;
  default_voice?: string;
  sample_rate?: number;
  max_text_length?: number;
}

export interface TTSWarmupResponse {
  status: TTSModelStatus;
  message: string;
}
