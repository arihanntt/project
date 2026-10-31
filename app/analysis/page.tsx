'use client';

import { useState } from 'react';
import DropZone from '@/components/DropZone';
import AnalysisPanel from '@/components/AnalysisPanel';
import type { ImageInfo, AnalysisData } from '@/types';
import { computeAnalysis, buildDifferenceImage, calculateCapacity } from '@/lib/steganography/lsb';
import { fileToImageData, imageDataToPngUrl, formatBytes } from '@/lib/image/utils';

const CAPACITY_REF = [[640, 480], [1280, 720], [1920, 1080], [2560, 1440], [3840, 2160]];

const Card = ({ children }: { children: React.ReactNode }) => (
  <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
    {children}
  </div>
);

const CardHeader = ({ title, sub }: { title: string; sub?: string }) => (
  <div style={{ padding: '18px 24px', borderBottom: '1px solid var(--border)', background: 'var(--bg-subtle)' }}>
    <div style={{ fontFamily: 'var(--sans)', fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>{title}</div>
    {sub && <div style={{ fontFamily: 'var(--sans)', fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>{sub}</div>}
  </div>
);

function LsbBar({ label, value, color }: { label: string; value: number; color: string }) {
  const pct = value * 100;
  const deviation = Math.abs(pct - 50);
  const isAnomalous = deviation < 1;
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '8px' }}>
        <span style={{ fontFamily: 'var(--sans)', fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>{label}</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {isAnomalous && <span className="badge badge-neutral" style={{ fontSize: '11px', padding: '2px 8px' }}>≈50% — suspect</span>}
          <span style={{ fontFamily: 'var(--mono)', fontSize: '14px', fontWeight: 700, color }}>{pct.toFixed(2)}%</span>
        </div>
      </div>
      <div style={{ position: 'relative', height: '8px', background: 'var(--bg-muted)', borderRadius: '4px', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: '4px', transition: 'width 0.6s ease' }} />
        <div style={{ position: 'absolute', left: '50%', top: 0, width: '2px', height: '100%', background: 'rgba(0,0,0,0.15)' }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '5px' }}>
        <span style={{ fontFamily: 'var(--mono)', fontSize: '10px', color: 'var(--text-muted)' }}>0%</span>
        <span style={{ fontFamily: 'var(--mono)', fontSize: '10px', color: 'var(--text-muted)' }}>50%</span>
        <span style={{ fontFamily: 'var(--mono)', fontSize: '10px', color: 'var(--text-muted)' }}>100%</span>
      </div>
    </div>
  );
}

export default function AnalysisPage() {
  const [orig,     setOrig]     = useState<ImageInfo | null>(null);
  const [stego,    setStego]    = useState<ImageInfo | null>(null);
  const [single,   setSingle]   = useState<ImageInfo | null>(null);
  const [payload,  setPayload]  = useState('');
  const [busy,     setBusy]     = useState(false);
  const [error,    setError]    = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisData | null>(null);
  const [origUrl,  setOrigUrl]  = useState<string | null>(null);
  const [stegoUrl, setStegoUrl] = useState<string | null>(null);
  const [diffUrl,  setDiffUrl]  = useState<string | null>(null);
  const [lsb,      setLsb]      = useState<{ r: number; g: number; b: number; total: number } | null>(null);

  const compare = async () => {
    if (!orig || !stego) { setError('Upload both images.'); return; }
    setError(null); setBusy(true); setAnalysis(null);
    try {
      const o = await fileToImageData(orig.file);
      const s = await fileToImageData(stego.file);
      if (o.width !== s.width || o.height !== s.height) throw new Error('Images must have the same dimensions.');
      const p = parseInt(payload) || 0;
      const { mse, psnr, embeddingRatePercent } = computeAnalysis(o, s, p);
      const { theoreticalBytes, usableBytes } = calculateCapacity(o.width, o.height);
      setAnalysis({ originalWidth: o.width, originalHeight: o.height, stegoWidth: s.width, stegoHeight: s.height, payloadBytes: p, capacityBytes: theoreticalBytes, usableCapacityBytes: usableBytes, embeddingRatePercent, modifiedChannels: 0, mse, psnr, encryptionAlgorithm: 'AES-256-GCM', keyDerivation: 'PBKDF2-SHA256 + HKDF', embeddingMethod: 'RGB / 1 LSB / PRNG scatter', outputFormat: 'PNG', processingLocation: 'Client-side' });
      setOrigUrl(imageDataToPngUrl(o));
      setStegoUrl(imageDataToPngUrl(s));
      setDiffUrl(imageDataToPngUrl(buildDifferenceImage(o, s, 50)));
    } catch (e) { setError(e instanceof Error ? e.message : 'Analysis failed.'); }
    setBusy(false);
  };

  const inspectLsb = async () => {
    if (!single) return;
    setBusy(true);
    const d = await fileToImageData(single.file);
    let r = 0, g = 0, b = 0;
    const t = d.width * d.height;
    for (let i = 0; i < d.data.length; i += 4) { if (d.data[i] & 1) r++; if (d.data[i + 1] & 1) g++; if (d.data[i + 2] & 1) b++; }
    setLsb({ r: r / t, g: g / t, b: b / t, total: t });
    setBusy(false);
  };

  return (
    <div style={{ background: 'var(--bg-subtle)', minHeight: 'calc(100vh - 60px)' }}>

      {/* ── Page header */}
      <div style={{ background: '#fff', borderBottom: '1px solid var(--border)' }}>
        <div style={{ maxWidth: 'var(--page-max)', margin: '0 auto', padding: '32px var(--page-px)' }}>
          <div style={{ marginBottom: '10px' }}>
            <span style={{ fontFamily: 'var(--mono)', fontSize: '11px', fontWeight: 500, color: 'var(--text-muted)', background: 'var(--bg-muted)', padding: '3px 10px', borderRadius: '4px' }}>04</span>
          </div>
          <h1 style={{ fontFamily: 'var(--serif)', fontWeight: 800, fontSize: 'clamp(32px, 5vw, 52px)', letterSpacing: '-0.04em', color: 'var(--text-primary)', lineHeight: 1.0 }}>
            Image analysis
          </h1>
          <p style={{ fontFamily: 'var(--sans)', fontSize: '15px', color: 'var(--text-secondary)', marginTop: '10px', lineHeight: 1.6 }}>
            Measure quality metrics and inspect LSB distributions to detect steganographic changes.
          </p>
        </div>
      </div>

      <div style={{ maxWidth: 'var(--page-max)', margin: '0 auto', padding: '32px var(--page-px)', display: 'flex', flexDirection: 'column', gap: '24px' }}>

        {/* ── Tools row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>

          {/* Compare images */}
          <Card>
            <CardHeader title="Compare images" sub="PSNR · MSE · Difference map" />
            <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label className="field-label">Original (reference)</label>
                <DropZone id="orig-a" label="Drop original image" subtitle="Unmodified" onImageLoaded={setOrig} imageInfo={orig} onClear={() => setOrig(null)} minHeight={140} />
              </div>
              <div>
                <label className="field-label">Stego output</label>
                <DropZone id="stego-a" label="Drop stego PNG" subtitle="StealthDrop-encoded" onImageLoaded={setStego} imageInfo={stego} onClear={() => setStego(null)} minHeight={140} />
              </div>
              <div>
                <label className="field-label" htmlFor="pb">Known payload size in bytes (optional)</label>
                <input
                  id="pb"
                  type="number"
                  className="input"
                  placeholder="e.g. 1024"
                  value={payload}
                  onChange={e => setPayload(e.target.value)}
                  min="0"
                />
              </div>
              {error && (
                <div className="error-box">
                  <span>⚠</span>
                  <span>{error}</span>
                </div>
              )}
              <button
                id="analyze-btn"
                onClick={compare}
                disabled={busy || !orig || !stego}
                className="btn btn-dark btn-md"
                style={{ borderRadius: '8px' }}
              >
                {busy ? 'Analyzing…' : 'Compare images →'}
              </button>
            </div>
          </Card>

          {/* LSB distribution */}
          <Card>
            <CardHeader title="LSB distribution" sub="Statistical steganography detection" />
            <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border)', borderRadius: '8px', padding: '14px 16px' }}>
                <p style={{ fontFamily: 'var(--sans)', fontSize: '13px', lineHeight: 1.65, color: 'var(--text-secondary)' }}>
                  Natural images exhibit ~50% LSB 0/1 distribution per channel. Values very close to exactly 50% may indicate steganographic modification.
                </p>
              </div>
              <div>
                <label className="field-label">Image to inspect</label>
                <DropZone id="lsb-img" label="Drop any image" subtitle="LSB frequency will be measured" onImageLoaded={setSingle} imageInfo={single} onClear={() => { setSingle(null); setLsb(null); }} minHeight={150} />
              </div>
              <button
                id="lsb-btn"
                onClick={inspectLsb}
                disabled={busy || !single}
                className="btn btn-dark btn-md"
                style={{ borderRadius: '8px' }}
              >
                {busy ? 'Analyzing…' : 'Inspect LSB distribution →'}
              </button>

              {lsb && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', paddingTop: '16px', borderTop: '1px solid var(--border)' }} className="fade-up">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontFamily: 'var(--sans)', fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>Results</span>
                    <span style={{ fontFamily: 'var(--mono)', fontSize: '12px', color: 'var(--text-muted)' }}>{lsb.total.toLocaleString('en-US')} pixels</span>
                  </div>
                  <LsbBar label="Red"   value={lsb.r} color="#e05252" />
                  <LsbBar label="Green" value={lsb.g} color="#2d9e5c" />
                  <LsbBar label="Blue"  value={lsb.b} color="#3d72d4" />
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* ── Analysis results */}
        {analysis && (
          <div className="fade-up">
            <h2 style={{ fontFamily: 'var(--serif)', fontWeight: 800, fontSize: '32px', letterSpacing: '-0.04em', color: 'var(--text-primary)', marginBottom: '16px' }}>
              Analysis results
            </h2>
            <AnalysisPanel
              data={analysis}
              originalImageUrl={origUrl ?? undefined}
              stegoImageUrl={stegoUrl ?? undefined}
              diffImageUrl={diffUrl ?? undefined}
            />
          </div>
        )}

        {/* ── Capacity reference */}
        <Card>
          <CardHeader title="Capacity reference" sub="Maximum payload per common resolution" />
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-subtle)' }}>
                  {['Resolution', 'Pixels', 'RGB channels', 'Theoretical', 'Usable'].map(h => (
                    <th key={h} style={{ padding: '12px 24px', textAlign: 'left', fontFamily: 'var(--sans)', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', letterSpacing: '-0.01em', whiteSpace: 'nowrap' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {CAPACITY_REF.map(([w, h], i) => {
                  const { theoreticalBytes, usableBytes, totalRgbChannels } = calculateCapacity(w, h);
                  return (
                    <tr key={`${w}x${h}`} style={{ borderBottom: i < CAPACITY_REF.length - 1 ? '1px solid var(--border)' : 'none', background: i % 2 !== 0 ? 'var(--bg-subtle)' : '#fff' }}>
                      <td style={{ padding: '14px 24px', fontFamily: 'var(--mono)', fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>{w} × {h}</td>
                      <td style={{ padding: '14px 24px', fontFamily: 'var(--mono)', fontSize: '13px', color: 'var(--text-secondary)' }} suppressHydrationWarning>{(w * h).toLocaleString('en-US')}</td>
                      <td style={{ padding: '14px 24px', fontFamily: 'var(--mono)', fontSize: '13px', color: 'var(--text-secondary)' }} suppressHydrationWarning>{totalRgbChannels.toLocaleString('en-US')}</td>
                      <td style={{ padding: '14px 24px', fontFamily: 'var(--mono)', fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>{formatBytes(theoreticalBytes)}</td>
                      <td style={{ padding: '14px 24px', fontFamily: 'var(--mono)', fontSize: '13px', color: 'var(--text-secondary)' }}>{formatBytes(usableBytes)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}
