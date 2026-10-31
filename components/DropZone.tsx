'use client';

import { useState, useRef, useCallback } from 'react';
import type { ImageInfo } from '@/types';

interface Props {
  id: string;
  label: string;
  subtitle?: string;
  onImageLoaded: (info: ImageInfo) => void;
  imageInfo: ImageInfo | null;
  onClear: () => void;
  minHeight?: number;
}

export default function DropZone({ id, label, subtitle, onImageLoaded, imageInfo, onClear, minHeight = 220 }: Props) {
  const [dragging, setDragging] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const process = useCallback((file: File) => {
    setErr(null);
    if (!file.type.startsWith('image/')) { setErr('Must be an image file.'); return; }
    if (file.size > 50 * 1024 * 1024) { setErr('File must be under 50 MB.'); return; }
    const reader = new FileReader();
    reader.onload = (e) => {
      const url = e.target?.result as string;
      const img = new Image();
      img.onload = () => onImageLoaded({ file, width: img.naturalWidth, height: img.naturalHeight, sizeBytes: file.size, dataUrl: url });
      img.src = url;
    };
    reader.readAsDataURL(file);
  }, [onImageLoaded]);

  const fmt = (b: number) => b < 1048576 ? `${(b/1024).toFixed(1)} KB` : `${(b/1048576).toFixed(2)} MB`;

  if (imageInfo) {
    return (
      <div className="dropzone dropzone-loaded" style={{ minHeight, cursor: 'default', alignItems: 'flex-end', borderRadius: '8px' }}>
        <img src={imageInfo.dataUrl} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.65) 0%, transparent 55%)' }} />
        <div style={{
          position: 'relative', zIndex: 1, width: '100%', display: 'flex',
          alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', gap: '10px',
        }}>
          <div>
            <div style={{ fontFamily: 'var(--sans)', fontSize: '13px', fontWeight: 600, color: '#fff', marginBottom: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '200px' }}>
              {imageInfo.file.name}
            </div>
            <div style={{ fontFamily: 'var(--mono)', fontSize: '11px', color: 'rgba(255,255,255,0.55)' }}>
              {imageInfo.width} × {imageInfo.height} · {fmt(imageInfo.sizeBytes)}
            </div>
          </div>
          <button onClick={(e) => { e.stopPropagation(); onClear(); }}
            style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.25)', color: '#fff', borderRadius: '6px', padding: '6px 12px', fontSize: '12px', fontFamily: 'var(--sans)', fontWeight: 500, cursor: 'pointer', backdropFilter: 'blur(8px)', flexShrink: 0 }}>
            Replace
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <div id={id} className={`dropzone ${dragging ? 'dragging' : ''}`}
        style={{ minHeight, flexDirection: 'column', gap: '12px', borderRadius: '8px' }}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f) process(f); }}
        role="button" tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && inputRef.current?.click()}
      >
        {/* Icon */}
        <div style={{ width: 44, height: 44, borderRadius: '10px', background: 'var(--bg-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="2" width="18" height="18" rx="2" />
            <path d="M2 14l5-5 4 4 3-3 6 6" />
            <circle cx="7.5" cy="7.5" r="1.5" />
          </svg>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontFamily: 'var(--sans)', fontSize: '14px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>{label}</div>
          {subtitle && <div style={{ fontFamily: 'var(--sans)', fontSize: '13px', color: 'var(--text-muted)' }}>{subtitle}</div>}
        </div>
        <div style={{ fontFamily: 'var(--sans)', fontSize: '12px', color: 'var(--text-muted)', background: 'var(--bg-muted)', padding: '5px 12px', borderRadius: '20px' }}>
          Drop file or click to browse
        </div>
        <input ref={inputRef} type="file" id={`${id}-input`} accept="image/*" onChange={(e) => { const f = e.target.files?.[0]; if (f) process(f); e.target.value = ''; }} style={{ display: 'none' }} />
      </div>
      {err && <div style={{ fontSize: '13px', color: 'var(--danger)', fontFamily: 'var(--sans)', paddingLeft: '4px' }}>{err}</div>}
    </div>
  );
}
