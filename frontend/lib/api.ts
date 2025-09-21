import {
  ApplicationSummary,
  Farm,
  Mix,
  MixItem,
  Owner,
  Paddock,
  WeatherSnapshot
} from './types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8000';

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  token?: string;
  body?: unknown;
}

async function request<T>(path: string, { method = 'GET', token, body }: RequestOptions): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `Request failed with status ${response.status}`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export async function fetchOwners(token?: string) {
  return request<Owner[]>('/api/owners', { token });
}

export async function createOwner(token: string, payload: { name: string }) {
  return request<Owner>('/api/owners', { method: 'POST', token, body: payload });
}

export async function fetchFarms(token: string, ownerId?: string) {
  const query = ownerId ? `?owner_id=${ownerId}` : '';
  return request<Farm[]>(`/api/farms${query}`, { token });
}

export async function createFarm(
  token: string,
  payload: { ownerId: string; name: string; notes?: string }
) {
  return request<Farm>('/api/farms', { method: 'POST', token, body: payload });
}

export async function fetchPaddocks(token: string, ownerId?: string) {
  const query = ownerId ? `?owner_id=${ownerId}` : '';
  return request<Paddock[]>(`/api/paddocks${query}`, { token });
}

export async function createPaddock(
  token: string,
  payload: { ownerId: string; farmId: string; name: string; areaHectares?: number }
) {
  return request<Paddock>('/api/paddocks', { method: 'POST', token, body: payload });
}

export async function updatePaddockGps(
  token: string,
  paddockId: string,
  payload: { latitude: number; longitude: number; accuracy?: number }
) {
  return request<Paddock>(`/api/paddocks/${paddockId}/gps`, { method: 'POST', token, body: payload });
}

export async function fetchMixes(token: string, ownerId?: string) {
  const query = ownerId ? `?owner_id=${ownerId}` : '';
  return request<Mix[]>(`/api/mixes${query}`, { token });
}

export async function createMix(
  token: string,
  payload: { ownerId: string; name: string; totalWaterL: number; items: Array<Omit<MixItem, 'id'>> }
) {
  return request<Mix>('/api/mixes', { method: 'POST', token, body: payload });
}

export async function fetchApplications(token: string, ownerId?: string) {
  const query = ownerId ? `?owner_id=${ownerId}` : '';
  return request<ApplicationSummary[]>(`/api/applications${query}`, { token });
}

export async function createApplication(
  token: string,
  payload: {
    ownerId: string;
    mixId: string;
    paddockIds: string[];
    startedAt: string;
    operatorName: string;
    notes?: string;
    waterSource?: string;
  }
) {
  return request<ApplicationSummary>('/api/applications', { method: 'POST', token, body: payload });
}

export async function finalizeApplication(token: string, applicationId: string) {
  return request<ApplicationSummary>(`/api/applications/${applicationId}/finalize`, {
    method: 'POST',
    token
  });
}

export async function fetchWeatherSnapshot(
  token: string,
  payload: { stationId: string; applicationId?: string }
) {
  return request<WeatherSnapshot>('/api/weather/fetch', {
    method: 'POST',
    token,
    body: payload
  });
}

export async function downloadAuthoritativePdf(token: string, applicationId: string) {
  const response = await fetch(`${API_BASE_URL}/api/applications/${applicationId}/export.pdf`, {
    headers: token
      ? {
          Authorization: `Bearer ${token}`
        }
      : undefined
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || 'Failed to download PDF');
  }

  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `application-${applicationId}.pdf`;
  link.click();
  URL.revokeObjectURL(url);
}
