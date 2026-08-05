export interface AlternativeCandidate {
  name: string;
  confidence: number;
}

export interface VisualFeatures {
  grain_size: string;
  texture: string;
  dominant_colors: string[];
  visible_crystals?: boolean | null;
  layering?: boolean | null;
  vesicles?: boolean | null;
  luster: string;
}

export interface FollowUpQuestion {
  id: string;
  question: string;
  options: string[];
  test_type: string;
}

export interface SpecimenFacts {
  name: string;
  rock_type: string;
  hardness: string;
  colors: string[];
  chemical_composition: string;
  formation: string;
  common_uses: string[];
  found_in: string;
  about: string;
}

export interface VisionAnalysisResponse {
  primary_identification: string;
  confidence: number;
  alternatives: AlternativeCandidate[];
  visual_features: VisualFeatures;
  reasoning: string;
  observations: string[];
  assumptions: string[];
  follow_up_questions: FollowUpQuestion[];
}

export interface IdentificationResult {
  scan_id: string;
  primary_identification: string;
  classification: string;
  confidence: number;
  raw_confidence: number;
  alternatives: AlternativeCandidate[];
  visual_features: VisualFeatures;
  reasoning: string;
  observations: string[];
  assumptions: string[];
  follow_up_questions: FollowUpQuestion[];
  specimen_facts?: SpecimenFacts | null;
  limitations: string[];
  recommend_physical_test: boolean;
  image_quality_score: number;
  geological_consistency: number;
  followup_agreement: number;
  premium_verification_used: boolean;
}

export interface ScanRecord {
  id: string;
  image_uri: string;
  primary_name: string;
  classification: string;
  confidence: number;
  raw_json: string;
  created_at: string;
  is_favorite: boolean;
}

export interface AppSettings {
  auto_save: boolean;
  show_confidence: boolean;
  units: 'metric' | 'imperial';
  offline_mode: boolean;
  notifications_enabled: boolean;
  /** App language code (e.g. en, es, ja) */
  language: string;
  /** Visual theme: soft claymorphism or flat classic */
  appearance: 'clay' | 'classic';
  /** Display name shown on profile */
  username: string;
  /** @handle shown under the name */
  handle: string;
  /** Short bio line */
  bio: string;
  /** Persistent local file URI for avatar (documents directory) */
  profile_picture: string;
  /** First-run language → profile → photo → tutorial finished */
  onboarding_complete: boolean;
  /** Allow anonymous usage analytics to improve the app */
  privacy_analytics: boolean;
  /** Allow personalized tips based on scan history */
  privacy_personalized: boolean;
}

export const DEFAULT_SETTINGS: AppSettings = {
  auto_save: true,
  show_confidence: true,
  units: 'metric',
  offline_mode: false,
  notifications_enabled: true,
  language: 'en',
  appearance: 'clay',
  username: 'Rock Explorer',
  handle: 'rock.explorer',
  bio: 'Exploring the world, one rock at a time.',
  profile_picture: '',
  onboarding_complete: false,
  privacy_analytics: true,
  privacy_personalized: true,
};
