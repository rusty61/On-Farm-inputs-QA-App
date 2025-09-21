import { ApplicationDraft, Mix, Owner, Paddock } from './types';
import { formatDate } from './utils';

export async function generateOfflinePdf(
  draft: ApplicationDraft,
  context: {
    owners: Owner[];
    mixes: Mix[];
    paddocks: Paddock[];
  }
) {
  const { default: jsPDF } = await import('jspdf');
  const doc = new jsPDF();
  const owner = context.owners.find((o) => o.id === draft.ownerId);
  const mix = context.mixes.find((m) => m.id === draft.mixId);

  doc.setFontSize(18);
  doc.text('Infield Spray Record — Provisional PDF', 14, 20);

  doc.setFontSize(12);
  doc.text(`Generated: ${formatDate(new Date().toISOString())}`, 14, 30);
  if (owner) {
    doc.text(`Owner: ${owner.name}`, 14, 38);
  }
  if (draft.operatorName) {
    doc.text(`Operator: ${draft.operatorName}`, 14, 46);
  }
  doc.text(`Started: ${formatDate(draft.startedAt)}`, 14, 54);
  if (draft.finishedAt) {
    doc.text(`Finished: ${formatDate(draft.finishedAt)}`, 14, 62);
  }

  doc.text('Selected paddocks:', 14, 74);
  draft.paddockIds.forEach((paddockId, index) => {
    const paddock = context.paddocks.find((p) => p.id === paddockId);
    const y = 82 + index * 8;
    doc.text(`• ${paddock?.name ?? paddockId}`, 18, y);
  });

  doc.text('GPS snapshots:', 14, 82 + draft.paddockIds.length * 8 + 10);
  draft.gpsSnapshots.forEach((snap, index) => {
    const y = 90 + draft.paddockIds.length * 8 + index * 8;
    doc.text(
      `• ${snap.paddockId}: ${snap.coordinate.latitude.toFixed(5)}, ${snap.coordinate.longitude.toFixed(5)} (±${snap.coordinate.accuracy?.toFixed(1) ?? '—'} m)`,
      18,
      y
    );
  });

  if (mix) {
    const startY = 98 + draft.paddockIds.length * 8 + draft.gpsSnapshots.length * 8;
    doc.text(`Mix: ${mix.name} — Water: ${mix.totalWaterL} L`, 14, startY);
    mix.items.forEach((item, index) => {
      const y = startY + 8 + index * 8;
      doc.text(`• ${item.chemical} @ ${item.rateLPerHa} L/ha`, 18, y);
    });
  }

  if (draft.weather) {
    const startY = 118 + draft.paddockIds.length * 8 + draft.gpsSnapshots.length * 8;
    doc.text('Weather snapshot:', 14, startY);
    doc.text(
      `Wind ${draft.weather.windSpeedMs ?? '—'} m/s @ ${draft.weather.windDirectionDeg ?? '—'}°, Temp ${draft.weather.temperatureC ?? '—'}°C, Humidity ${draft.weather.humidityPct ?? '—'}%`,
      18,
      startY + 8
    );
  }

  if (draft.notes) {
    const startY = 138 + draft.paddockIds.length * 8 + draft.gpsSnapshots.length * 8;
    doc.text('Notes:', 14, startY);
    doc.text(doc.splitTextToSize(draft.notes, 180), 18, startY + 8);
  }

  doc.save(`spray-record-provisional-${Date.now()}.pdf`);
}
