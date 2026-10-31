'use client';

import { calculateCapacity } from '@/lib/steganography/lsb';
import { formatBytes } from '@/lib/image/utils';

interface Props { width: number; height: number; payloadBytes?: number; }

export default function CapacityMeter({ width, height, payloadBytes }: Props) {
  const { theoreticalBytes, usableBytes } = calculateCapacity(width, height);
  const used = payloadBytes ?? 0;
  const pct  = Math.min(1, used / usableBytes);
  const over = used > usableBytes;

  return (
    <div className="card">
      <div className="card-header">
        <span style={{ fontFamily: 'var(--sans)', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>
          Capacity
        </span>
        <span style={{ fontFamily: 'var(--mono)', fontSize: '11px', color: 'var(--text-muted)' }}>
          {width} × {height}
        </span>
      </div>

      <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {[
          { label: 'Image capacity', value: formatBytes(theoreticalBytes) },
          { label: 'Usable (after overhead)', value: formatBytes(usableBytes) },
          ...(payloadBytes !== undefined ? [{
            label: 'Payload size', value: formatBytes(payloadBytes), highlight: over,
          }] : []),
        ].map(({ label, value, highlight }) => (
          <div key={label} className="metric-row">
            <span style={{ fontFamily: 'var(--sans)', fontSize: '13px', color: 'var(--text-secondary)' }}>{label}</span>
            <span style={{ fontFamily: 'var(--mono)', fontSize: '13px', fontWeight: 500, color: highlight ? 'var(--danger)' : 'var(--text-primary)' }}>{value}</span>
          </div>
        ))}

        {payloadBytes !== undefined && (
          <>
            <div className="progress-track">
              <div className={`progress-fill ${over ? 'danger' : ''}`} style={{ width: `${pct * 100}%` }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--sans)', fontSize: '12px', color: over ? 'var(--danger)' : 'var(--text-muted)' }}>
              <span>{over ? '⚠ Exceeds capacity' : `${(pct * 100).toFixed(1)}% used`}</span>
              <span>{formatBytes(usableBytes - used)} {over ? 'over' : 'remaining'}</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
