import Constants from 'expo-constants';
import {
  IdentificationResult,
  VisionAnalysisResponse,
  SpecimenFacts,
} from '../types';

/**
 * On a physical device (Expo Go / dev client), "localhost" resolves to the
 * phone itself, not your Mac — that's why identification requests fail with
 * a network error even though the backend is running. Instead, reuse the
 * LAN IP that Metro is already serving the bundle from, so the app finds
 * your dev machine automatically as your network/IP changes.
 */
function inferDevApiUrl(): string {
  const hostUri =
    Constants.expoConfig?.hostUri ||
    (Constants as any).expoGoConfig?.debuggerHost ||
    (Constants as any).manifest2?.extra?.expoClient?.hostUri ||
    (Constants as any).manifest?.debuggerHost;

  const host = typeof hostUri === 'string' ? hostUri.split(':')[0] : null;
  return host ? `http://${host}:8000` : 'http://localhost:8000';
}

export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || inferDevApiUrl();

export interface IdentifyPayload {
  image_base64: string;
  location?: {
    latitude?: number;
    longitude?: number;
    region?: string;
  };
  expert?: boolean;
}

export interface FollowUpAnswer {
  question_id: string;
  answer: string;
}

export interface FollowUpPayload {
  scan_id: string;
  vision_result: VisionAnalysisResponse;
  answers: FollowUpAnswer[];
  image_base64?: string;
  location?: {
    latitude?: number;
    longitude?: number;
    region?: string;
  };
  expert?: boolean;
}

export async function identifySpecimen(payload: IdentifyPayload): Promise<IdentificationResult> {
  const response = await fetch(`${API_BASE_URL}/v1/identify`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: 'Failed to identify specimen' }));
    throw new Error(errorData.detail || 'Failed to identify specimen');
  }

  return response.json();
}

export async function submitFollowUp(payload: FollowUpPayload): Promise<IdentificationResult> {
  const response = await fetch(`${API_BASE_URL}/v1/identify/follow-up`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: 'Failed to process follow-up' }));
    throw new Error(errorData.detail || 'Failed to process follow-up');
  }

  return response.json();
}

export async function getSpecimenFacts(name: string): Promise<SpecimenFacts> {
  const response = await fetch(`${API_BASE_URL}/v1/specimens/${encodeURIComponent(name)}`);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: 'Specimen details not found' }));
    throw new Error(errorData.detail || 'Specimen details not found');
  }

  return response.json();
}
