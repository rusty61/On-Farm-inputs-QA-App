'use client';

import { useEffect, useMemo, useState } from 'react';
import { OwnerManager } from '@/components/dashboard/OwnerManager';
import { FarmManager } from '@/components/dashboard/FarmManager';
import { PaddockManager } from '@/components/dashboard/PaddockManager';
import { MixBuilder } from '@/components/dashboard/MixBuilder';
import { ApplicationComposer } from '@/components/dashboard/ApplicationComposer';
import { WeatherSnapshotPanel } from '@/components/dashboard/WeatherSnapshotPanel';
import { PdfActions } from '@/components/dashboard/PdfActions';
import { StatusBanner } from '@/components/dashboard/StatusBanner';
import {
  ApplicationDraft,
  ApplicationSummary,
  Farm,
  Mix,
  Owner,
  Paddock,
  WeatherSnapshot,
  emptyApplicationDraft
} from '@/lib/types';
import {
  createApplication,
  createFarm,
  createMix,
  createOwner,
  createPaddock,
  downloadAuthoritativePdf,
  fetchApplications,
  fetchFarms,
  fetchMixes,
  fetchOwners,
  fetchPaddocks,
  fetchWeatherSnapshot,
  finalizeApplication,
  updatePaddockGps
} from '@/lib/api';
import { generateOfflinePdf } from '@/lib/pdf';
import { loadOfflineState, storeOfflineState } from '@/lib/storage';
import { useSupabase } from '@/components/providers/SupabaseProvider';

const fallbackId = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : Math.random().toString(36).slice(2);

interface StatusState {
  message: string;
  tone: 'success' | 'error' | 'info';
}

export default function DashboardPage() {
  const { session } = useSupabase();
  const token = session?.accessToken;

  const [owners, setOwners] = useState<Owner[]>([]);
  const [farms, setFarms] = useState<Farm[]>([]);
  const [paddocks, setPaddocks] = useState<Paddock[]>([]);
  const [mixes, setMixes] = useState<Mix[]>([]);
  const [applications, setApplications] = useState<ApplicationSummary[]>([]);
  const [selectedOwnerId, setSelectedOwnerId] = useState<string | null>(null);
  const [selectedFarmId, setSelectedFarmId] = useState<string | null>(null);
  const [selectedMixId, setSelectedMixId] = useState<string | null>(null);
  const [selectedApplicationId, setSelectedApplicationId] = useState<string | null>(null);
  const [draft, setDraft] = useState<ApplicationDraft>(() => ({ ...emptyApplicationDraft }));
  const [weather, setWeather] = useState<WeatherSnapshot | null>(null);
  const [status, setStatus] = useState<StatusState | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);
  const [isSubmittingApplication, setIsSubmittingApplication] = useState(false);

  const notify = (message: string, tone: StatusState['tone'] = 'info') => {
    setStatus({ message, tone });
    setTimeout(() => {
      setStatus((current) => (current?.message === message ? null : current));
    }, 5000);
  };

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    const offline = loadOfflineState();
    if (offline.owners?.length) {
      setOwners(offline.owners);
    }
    if (offline.farms?.length) {
      setFarms(offline.farms);
    }
    if (offline.paddocks?.length) {
      setPaddocks(offline.paddocks);
    }
    if (offline.mixes?.length) {
      setMixes(offline.mixes);
    }
    if (offline.applications?.length) {
      setApplications(offline.applications);
    }
    if (offline.draft) {
      setDraft({ ...emptyApplicationDraft, ...offline.draft });
    }
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (!token) {
      return;
    }
    (async () => {
      try {
        const [remoteOwners, remoteFarms, remotePaddocks, remoteMixes, remoteApplications] = await Promise.all([
          fetchOwners(token),
          fetchFarms(token),
          fetchPaddocks(token),
          fetchMixes(token),
          fetchApplications(token)
        ]);
        setOwners(remoteOwners);
        setFarms(remoteFarms);
        setPaddocks(remotePaddocks);
        setMixes(remoteMixes);
        setApplications(remoteApplications);
        notify('Synced data from FastAPI backend.', 'success');
      } catch (error) {
        console.warn('Failed to sync with API', error);
        notify('Unable to reach the API. Working from offline cache.', 'error');
      }
    })();
  }, [token]);

  useEffect(() => {
    if (!isHydrated || typeof window === 'undefined') {
      return;
    }
    storeOfflineState({ owners, farms, paddocks, mixes, applications, draft });
  }, [owners, farms, paddocks, mixes, applications, draft, isHydrated]);

  useEffect(() => {
    if (!selectedOwnerId && owners.length > 0) {
      setSelectedOwnerId(owners[0].id);
    }
  }, [owners, selectedOwnerId]);

  const ownerMixes = useMemo(
    () => mixes.filter((mix) => !selectedOwnerId || mix.ownerId === selectedOwnerId),
    [mixes, selectedOwnerId]
  );

  const handleOwnerSelect = (ownerId: string) => {
    const resolvedOwnerId = ownerId || null;
    setSelectedOwnerId(resolvedOwnerId);
    setDraft((current) => ({
      ...current,
      ownerId: resolvedOwnerId,
      farmId:
        current.farmId && farms.some((farm) => farm.id === current.farmId && farm.ownerId === resolvedOwnerId)
          ? current.farmId
          : null,
      paddockIds: current.paddockIds.filter((paddockId) => {
        const paddock = paddocks.find((p) => p.id === paddockId);
        return paddock?.ownerId === resolvedOwnerId;
      }),
      mixId:
        current.mixId && mixes.some((mix) => mix.id === current.mixId && mix.ownerId === resolvedOwnerId)
          ? current.mixId
          : null
    }));
  };

  const handleFarmSelect = (farmId: string) => {
    const resolvedFarmId = farmId || null;
    setSelectedFarmId(resolvedFarmId);
    setDraft((current) => ({
      ...current,
      farmId: resolvedFarmId,
      paddockIds: current.paddockIds.filter((paddockId) => {
        const paddock = paddocks.find((p) => p.id === paddockId);
        return paddock?.farmId === resolvedFarmId;
      })
    }));
  };

  const handleMixSelect = (mixId: string) => {
    setSelectedMixId(mixId);
    setDraft((current) => ({ ...current, mixId }));
  };

  const handleCreateOwner = async (name: string) => {
    if (!token) {
      const owner: Owner = {
        id: fallbackId(),
        name,
        createdAt: new Date().toISOString(),
        isLocalOnly: true
      };
      setOwners((prev) => [...prev, owner]);
      setSelectedOwnerId(owner.id);
      setDraft((current) => ({ ...current, ownerId: owner.id }));
      notify('Owner stored offline. Sign in to sync.', 'info');
      return;
    }
    try {
      const owner = await createOwner(token, { name });
      setOwners((prev) => [...prev, owner]);
      setSelectedOwnerId(owner.id);
      setDraft((current) => ({ ...current, ownerId: owner.id }));
      notify('Owner created successfully.', 'success');
    } catch (error) {
      console.error('Failed to create owner', error);
      const owner: Owner = {
        id: fallbackId(),
        name,
        createdAt: new Date().toISOString(),
        isLocalOnly: true
      };
      setOwners((prev) => [...prev, owner]);
      notify('Owner saved offline because API was unreachable.', 'error');
    }
  };

  const handleCreateFarm = async (ownerId: string, payload: { name: string; notes?: string }) => {
    if (!token) {
      const farm: Farm = {
        id: fallbackId(),
        ownerId,
        name: payload.name,
        notes: payload.notes,
        createdAt: new Date().toISOString(),
        isLocalOnly: true
      };
      setFarms((prev) => [...prev, farm]);
      setSelectedFarmId(farm.id);
      notify('Farm stored offline.', 'info');
      return;
    }
    try {
      const farm = await createFarm(token, { ownerId, name: payload.name, notes: payload.notes });
      setFarms((prev) => [...prev, farm]);
      setSelectedFarmId(farm.id);
      notify('Farm created.', 'success');
    } catch (error) {
      console.error('Failed to create farm', error);
      const farm: Farm = {
        id: fallbackId(),
        ownerId,
        name: payload.name,
        notes: payload.notes,
        createdAt: new Date().toISOString(),
        isLocalOnly: true
      };
      setFarms((prev) => [...prev, farm]);
      notify('Farm saved offline because API was unreachable.', 'error');
    }
  };

  const handleCreatePaddock = async (payload: { ownerId: string; farmId: string; name: string; areaHectares?: number }) => {
    if (!token) {
      const paddock: Paddock = {
        id: fallbackId(),
        ownerId: payload.ownerId,
        farmId: payload.farmId,
        name: payload.name,
        areaHectares: payload.areaHectares,
        createdAt: new Date().toISOString(),
        isLocalOnly: true
      } as Paddock;
      setPaddocks((prev) => [...prev, paddock]);
      notify('Paddock stored offline.', 'info');
      return;
    }
    try {
      const paddock = await createPaddock(token, payload);
      setPaddocks((prev) => [...prev, paddock]);
      notify('Paddock created.', 'success');
    } catch (error) {
      console.error('Failed to create paddock', error);
      const paddock: Paddock = {
        id: fallbackId(),
        ownerId: payload.ownerId,
        farmId: payload.farmId,
        name: payload.name,
        areaHectares: payload.areaHectares,
        createdAt: new Date().toISOString(),
        isLocalOnly: true
      } as Paddock;
      setPaddocks((prev) => [...prev, paddock]);
      notify('Paddock saved offline because API was unreachable.', 'error');
    }
  };

  const handleCaptureGps = async (
    paddockId: string,
    payload: { latitude: number; longitude: number; accuracy?: number }
  ) => {
    const updateLocal = (isLocalOnly = false) => {
      setPaddocks((prev) =>
        prev.map((paddock) =>
          paddock.id === paddockId
            ? {
                ...paddock,
                gpsPoint: { latitude: payload.latitude, longitude: payload.longitude },
                gpsAccuracyM: payload.accuracy,
                gpsCapturedAt: new Date().toISOString(),
                isLocalOnly: isLocalOnly || paddock.isLocalOnly
              }
            : paddock
        )
      );
    };

    if (!token) {
      updateLocal(true);
      notify('GPS saved offline. Sync when connected.', 'info');
      return;
    }

    try {
      const paddock = await updatePaddockGps(token, paddockId, payload);
      setPaddocks((prev) => prev.map((item) => (item.id === paddockId ? paddock : item)));
      notify('GPS snapshot stored.', 'success');
    } catch (error) {
      console.error('Failed to push GPS', error);
      updateLocal(true);
      notify('GPS stored offline because API was unreachable.', 'error');
    }
  };

  const handleCreateMix = async (
    ownerId: string,
    payload: { name: string; totalWaterL: number; items: Array<{ chemical: string; rateLPerHa: number; notes?: string }> }
  ) => {
    if (!token) {
      const mix: Mix = {
        id: fallbackId(),
        ownerId,
        name: payload.name,
        totalWaterL: payload.totalWaterL,
        items: payload.items.map((item, index) => ({ ...item, id: `${index}-${fallbackId()}` })),
        createdAt: new Date().toISOString(),
        isLocalOnly: true
      };
      setMixes((prev) => [...prev, mix]);
      setSelectedMixId(mix.id);
      setDraft((current) => ({ ...current, mixId: mix.id }));
      notify('Mix stored offline.', 'info');
      return;
    }
    try {
      const mix = await createMix(token, {
        ownerId,
        name: payload.name,
        totalWaterL: payload.totalWaterL,
        items: payload.items
      });
      setMixes((prev) => [...prev, mix]);
      setSelectedMixId(mix.id);
      setDraft((current) => ({ ...current, mixId: mix.id }));
      notify('Mix created.', 'success');
    } catch (error) {
      console.error('Failed to create mix', error);
      const mix: Mix = {
        id: fallbackId(),
        ownerId,
        name: payload.name,
        totalWaterL: payload.totalWaterL,
        items: payload.items.map((item, index) => ({ ...item, id: `${index}-${fallbackId()}` })),
        createdAt: new Date().toISOString(),
        isLocalOnly: true
      };
      setMixes((prev) => [...prev, mix]);
      notify('Mix saved offline because API was unreachable.', 'error');
    }
  };

  const handleApplicationDraftChange = (nextDraft: ApplicationDraft) => {
    setDraft(nextDraft);
  };

  const handleCreateApplication = async (payload: ApplicationDraft) => {
    if (!payload.ownerId || !payload.mixId || payload.paddockIds.length === 0) {
      notify('Owner, mix, and at least one paddock are required.', 'error');
      return;
    }
    setIsSubmittingApplication(true);
    if (!token) {
      const application: ApplicationSummary = {
        id: fallbackId(),
        ownerId: payload.ownerId,
        mixId: payload.mixId,
        paddockIds: payload.paddockIds,
        startedAt: payload.startedAt,
        finishedAt: payload.finishedAt,
        finalized: false,
        weather: payload.weather,
        isLocalOnly: true
      };
      setApplications((prev) => [application, ...prev]);
      setSelectedApplicationId(application.id);
      setDraft({ ...emptyApplicationDraft, ownerId: payload.ownerId, mixId: payload.mixId, operatorName: payload.operatorName });
      notify('Application drafted offline.', 'info');
      setIsSubmittingApplication(false);
      return;
    }
    try {
      const application = await createApplication(token, {
        ownerId: payload.ownerId,
        mixId: payload.mixId,
        paddockIds: payload.paddockIds,
        startedAt: payload.startedAt,
        operatorName: payload.operatorName,
        notes: payload.notes,
        waterSource: payload.waterSource
      });
      setApplications((prev) => [application, ...prev]);
      setSelectedApplicationId(application.id);
      setDraft({ ...emptyApplicationDraft, ownerId: payload.ownerId, mixId: payload.mixId, operatorName: payload.operatorName });
      notify('Application created.', 'success');
    } catch (error) {
      console.error('Failed to create application', error);
      const application: ApplicationSummary = {
        id: fallbackId(),
        ownerId: payload.ownerId,
        mixId: payload.mixId,
        paddockIds: payload.paddockIds,
        startedAt: payload.startedAt,
        finishedAt: payload.finishedAt,
        finalized: false,
        weather: payload.weather,
        isLocalOnly: true
      };
      setApplications((prev) => [application, ...prev]);
      notify('Application saved offline because API was unreachable.', 'error');
    } finally {
      setIsSubmittingApplication(false);
    }
  };

  const handleFinalizeApplication = async (applicationId: string) => {
    if (!token) {
      notify('Sign in to finalize applications on the backend.', 'error');
      return;
    }
    try {
      const updated = await finalizeApplication(token, applicationId);
      setApplications((prev) => prev.map((app) => (app.id === applicationId ? updated : app)));
      notify('Application finalized.', 'success');
    } catch (error) {
      console.error('Failed to finalize application', error);
      notify('Unable to finalize application. Try again once the API is reachable.', 'error');
    }
  };

  const handleFetchWeather = async (stationId: string) => {
    if (!selectedApplicationId) {
      notify('Select an application first.', 'error');
      return;
    }
    if (!token) {
      notify('Weather fetch requires backend connectivity.', 'error');
      return;
    }
    try {
      const snapshot = await fetchWeatherSnapshot(token, {
        stationId,
        applicationId: selectedApplicationId
      });
      setWeather({ ...snapshot, capturedAt: new Date().toISOString() });
      setApplications((prev) =>
        prev.map((application) =>
          application.id === selectedApplicationId
            ? {
                ...application,
                weather: snapshot
              }
            : application
        )
      );
      notify('Weather snapshot attached to application.', 'success');
    } catch (error) {
      console.error('Failed to fetch weather', error);
      notify('Unable to fetch weather from the FastAPI service.', 'error');
    }
  };

  const handleOfflinePdf = async () => {
    try {
      await generateOfflinePdf(draft, { owners, mixes, paddocks });
      notify('Generated provisional PDF.', 'success');
    } catch (error) {
      console.error('Failed to render jsPDF', error);
      notify('Unable to generate offline PDF.', 'error');
    }
  };

  const handleAuthoritativePdf = async () => {
    if (!selectedApplicationId) {
      notify('Select an application to download the server PDF.', 'error');
      return;
    }
    if (!token) {
      notify('Sign in to request the authoritative PDF.', 'error');
      return;
    }
    try {
      await downloadAuthoritativePdf(token, selectedApplicationId);
      notify('Authoritative PDF download started.', 'success');
    } catch (error) {
      console.error('Failed to download PDF', error);
      notify('Unable to download PDF from FastAPI.', 'error');
    }
  };

  const currentWeather = useMemo(() => {
    if (selectedApplicationId) {
      const application = applications.find((app) => app.id === selectedApplicationId);
      return application?.weather ?? weather;
    }
    return weather;
  }, [applications, selectedApplicationId, weather]);

  if (!session) {
    return (
      <div className="mx-auto flex max-w-3xl flex-col gap-6 text-center">
        <StatusBanner
          message="Sign in with Supabase Auth to sync owner-scoped spray records. Offline mode is available for drafting."
        />
        <p className="text-sm text-slate-300">
          The dashboard unlocks tank mix management, paddock GPS capture, weather snapshots, and PDF exports once authenticated.
          Use the controls below after signing in via the Supabase login page.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-10 pb-20">
      {status ? <StatusBanner message={status.message} tone={status.tone} /> : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <OwnerManager
          owners={owners}
          selectedOwnerId={selectedOwnerId}
          onSelect={handleOwnerSelect}
          onCreate={handleCreateOwner}
        />
        <FarmManager
          owners={owners}
          farms={farms}
          selectedOwnerId={selectedOwnerId}
          selectedFarmId={selectedFarmId}
          onSelectOwner={handleOwnerSelect}
          onSelectFarm={handleFarmSelect}
          onCreateFarm={handleCreateFarm}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <PaddockManager
          paddocks={paddocks}
          farms={farms}
          selectedOwnerId={selectedOwnerId}
          selectedFarmId={selectedFarmId}
          onSelectFarm={handleFarmSelect}
          onCreatePaddock={handleCreatePaddock}
          onCaptureGps={handleCaptureGps}
        />
        <MixBuilder
          mixes={ownerMixes}
          selectedOwnerId={selectedOwnerId}
          selectedMixId={selectedMixId}
          onSelectMix={handleMixSelect}
          onCreateMix={handleCreateMix}
        />
      </div>

      <ApplicationComposer
        draft={draft}
        owners={owners}
        farms={farms}
        paddocks={paddocks}
        mixes={mixes}
        applications={applications}
        selectedApplicationId={selectedApplicationId}
        onDraftChange={handleApplicationDraftChange}
        onCreate={handleCreateApplication}
        onSelectApplication={setSelectedApplicationId}
        onFinalize={handleFinalizeApplication}
        loading={isSubmittingApplication}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <WeatherSnapshotPanel
          selectedApplicationId={selectedApplicationId}
          weather={currentWeather ?? null}
          onFetchWeather={handleFetchWeather}
        />
        <PdfActions
          draft={draft}
          selectedApplicationId={selectedApplicationId}
          onGenerateOffline={handleOfflinePdf}
          onDownloadServer={handleAuthoritativePdf}
        />
      </div>
    </div>
  );
}
