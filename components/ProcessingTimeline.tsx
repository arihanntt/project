'use client';

import type { ProcessStep } from '@/types';

interface Props { steps: ProcessStep[]; title?: string; }

export default function ProcessingTimeline({ steps, title }: Props) {
  const done  = steps.filter(s => s.status === 'done').length;
  const total = steps.length;
  const hasErr = steps.some(s => s.status === 'error');
  const complete = done === total;

  return (
    <div className="card">
      <div className="card-header">
        <span style={{ fontFamily: 'var(--sans)', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>
          {title ?? 'Pipeline'}
        </span>
        <span style={{
          fontFamily: 'var(--mono)', fontSize: '11px', fontWeight: 500,
          color: hasErr ? 'var(--danger)' : complete ? 'var(--success)' : 'var(--text-muted)',
        }}>
          {hasErr ? 'Failed' : complete ? 'Done' : `${done} / ${total}`}
        </span>
      </div>

      <div style={{ padding: '8px 24px 16px' }}>
        {steps.map((s, i) => (
          <div key={s.label} className={`step ${s.status}`}>
            <div className="step-dot">
              {s.status === 'done'   && <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 5.2L4 7l4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
              {s.status === 'active' && <div style={{ width: 6, height: 6, background: '#fff', borderRadius: '50%' }} />}
              {s.status === 'error'  && <span style={{ fontSize: '11px', lineHeight: 1 }}>×</span>}
              {s.status === 'pending'&& <span style={{ fontFamily: 'var(--mono)', fontSize: '9px', color: 'var(--text-muted)', fontWeight: 500 }}>{String(i+1).padStart(2,'0')}</span>}
            </div>
            <span style={{
              fontFamily: 'var(--sans)', fontSize: '13px',
              fontWeight: s.status === 'active' ? 600 : 400,
              color: s.status === 'done' ? 'var(--text-muted)' : s.status === 'active' ? 'var(--text-primary)' : s.status === 'error' ? 'var(--danger)' : 'var(--text-muted)',
              transition: 'color 0.25s',
            }}>
              {s.label}
            </span>
          </div>
        ))}
        <div className="progress-track" style={{ marginTop: '12px' }}>
          <div className={`progress-fill ${hasErr ? 'danger' : ''}`} style={{ width: `${(done/total)*100}%` }} />
        </div>
      </div>
    </div>
  );
}
