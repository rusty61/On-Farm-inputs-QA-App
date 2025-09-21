import { ApplicationDraft, ApplicationSummary, Farm, Mix, Owner, Paddock } from './types';

const STORAGE_KEY = 'spray-record-offline-cache-v1';

interface OfflineState {
  owners: Owner[];
  farms: Farm[];
  paddocks: Paddock[];
  mixes: Mix[];
  applications: ApplicationSummary[];
  draft?: ApplicationDraft;
}

function readState(): OfflineState {
  if (typeof window === 'undefined') {
    return { owners: [], farms: [], paddocks: [], mixes: [], applications: [] };
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return { owners: [], farms: [], paddocks: [], mixes: [], applications: [] };
    }
    return JSON.parse(raw) as OfflineState;
  } catch (error) {
    console.error('Failed to read offline state', error);
    return { owners: [], farms: [], paddocks: [], mixes: [], applications: [] };
  }
}

function writeState(next: OfflineState) {
  if (typeof window === 'undefined') {
    return;
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
}

export function loadOfflineState(): OfflineState {
  return readState();
}

export function storeOfflineState(next: OfflineState) {
  writeState(next);
}
