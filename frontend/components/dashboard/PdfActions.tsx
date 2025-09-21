'use client';

import { SectionCard } from './SectionCard';
import { ApplicationDraft } from '@/lib/types';

interface PdfActionsProps {
  draft: ApplicationDraft;
  selectedApplicationId: string | null;
  onGenerateOffline(): Promise<void>;
  onDownloadServer(): Promise<void>;
}

export function PdfActions({ draft, selectedApplicationId, onGenerateOffline, onDownloadServer }: PdfActionsProps) {
  return (
    <SectionCard
      title="PDF exports"
      description="Generate an offline jsPDF summary or request the authoritative FastAPI PDF with QR watermarking."
    >
      <div className="grid gap-4 md:grid-cols-2">
        <button
          type="button"
          onClick={onGenerateOffline}
          className="flex flex-col gap-2 rounded-2xl border border-brand bg-brand/10 p-6 text-left text-sm text-slate-100 transition hover:border-brand-light hover:bg-brand/20"
        >
          <span className="text-lg font-semibold">Offline provisional PDF</span>
          <span className="text-xs text-slate-200">
            Bundles the current draft, including selected paddocks, GPS snapshots, and mix details into a jsPDF download for
            offline audits.
          </span>
          <span className="text-xs text-emerald-300">Operator: {draft.operatorName || '—'}</span>
        </button>
        <button
          type="button"
          disabled={!selectedApplicationId}
          onClick={onDownloadServer}
          className="flex flex-col gap-2 rounded-2xl border border-slate-800 bg-slate-950/60 p-6 text-left text-sm text-slate-100 transition hover:border-brand hover:bg-brand/10 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <span className="text-lg font-semibold">Authoritative Render PDF</span>
          <span className="text-xs text-slate-200">
            Calls the FastAPI endpoint to render the QR watermarked PDF for the selected application. Requires finalized data on
            the backend.
          </span>
          <span className="text-xs text-slate-400">
            {selectedApplicationId ? `Application ${selectedApplicationId.slice(0, 8)}` : 'Select an application first'}
          </span>
        </button>
      </div>
    </SectionCard>
  );
}
