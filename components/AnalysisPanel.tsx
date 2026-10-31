'use client';

import type { AnalysisData } from '@/types';
import { formatBytes } from '@/lib/image/utils';

interface Props {
  data: AnalysisData;
  originalImageUrl?: string;
  stegoImageUrl?: string;
  diffImageUrl?: string;
}

function MetricCard({ title, rows }: { title: string; rows: [string, string, boolean?][] }) {
  return (
    <div className="card" style={{ overflow: 'hidden' }}>
      <div className="card-header">
        <span style={{ fontFamily: 'var(--sans)', fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>{title}</span>
      </div>
      <div style={{ padding: '4px 24px 8px' }}>
        {rows.map(([l, v, hi]) => (
          <div key={l} className="metric-row">
            <span style={{ fontFamily: 'var(--sans)', fontSize: '13px', color: 'var(--text-secondary)' }}>{l}</span>
            <span style={{ fontFamily: 'var(--mono)', fontSize: '13px', fontWeight: 500, color: hi ? 'var(--success)' : 'var(--text-primary)' }}>{v}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AnalysisPanel({ data, originalImageUrl, stegoImageUrl, diffImageUrl }: Props) {
  const psnrNum = data.psnr === 'infinity' ? null : data.psnr as number;
  const psnrStr = psnrNum === null ? '∞ dB' : `${psnrNum.toFixed(2)} dB`;
  const quality = psnrNum === null ? 'Identical — no change' : psnrNum > 45 ? 'Imperceptible' : psnrNum > 35 ? 'Excellent' : psnrNum > 25 ? 'Good' : 'Visible';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Image previews */}
      {(originalImageUrl || stegoImageUrl || diffImageUrl) && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
          {[
            { url: originalImageUrl, label: 'Original' },
            { url: stegoImageUrl,    label: 'Stego output' },
            { url: diffImageUrl,     label: 'Difference ×50' },
          ].map(({ url, label }) => url ? (
            <div key={label} className="card" style={{ overflow: 'hidden' }}>
              <div style={{ aspectRatio: '4/3', overflow: 'hidden', background: 'var(--bg-muted)' }}>
                <img src={url} alt={label} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
              </div>
              <div style={{ padding: '10px 16px', borderTop: '1px solid var(--border)' }}>
                <span style={{ fontFamily: 'var(--sans)', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>{label}</span>
              </div>
            </div>
          ) : null)}
        </div>
      )}

      {/* Metric grids */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <MetricCard title="Image quality" rows={[
          ['PSNR', psnrStr],
          ['Perceptual quality', quality],
          ['MSE', data.mse.toFixed(8)],
          ['Embedding rate', `${data.embeddingRatePercent.toFixed(3)}%`],
          ['Channels modified', data.modifiedChannels > 0 ? data.modifiedChannels.toLocaleString('en-US') : '—'],
        ]} />
        <MetricCard title="Cryptographic parameters" rows={[
          ['Encryption', data.encryptionAlgorithm],
          ['Key derivation', data.keyDerivation],
          ['Embedding method', data.embeddingMethod],
          ['Output format', data.outputFormat],
          ['Processing', data.processingLocation],
        ]} />
        <MetricCard title="Image dimensions" rows={[
          ['Original', `${data.originalWidth} × ${data.originalHeight}`],
          ['Output', `${data.stegoWidth} × ${data.stegoHeight}`],
          ['Total pixels', (data.originalWidth * data.originalHeight).toLocaleString('en-US')],
          ['RGB channel slots', (data.originalWidth * data.originalHeight * 3).toLocaleString('en-US')],
        ]} />
        <MetricCard title="Payload size" rows={[
          ['Payload', formatBytes(data.payloadBytes)],
          ['Theoretical capacity', formatBytes(data.capacityBytes)],
          ['Usable capacity', formatBytes(data.usableCapacityBytes)],
          ['Format overhead', formatBytes(data.capacityBytes - data.usableCapacityBytes)],
        ]} />
      </div>
    </div>
  );
}
