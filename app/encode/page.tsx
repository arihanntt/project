'use client';

import { useState, useCallback } from 'react';
import DropZone from '@/components/DropZone';
import ProcessingTimeline from '@/components/ProcessingTimeline';
import CapacityMeter from '@/components/CapacityMeter';
import AnalysisPanel from '@/components/AnalysisPanel';
import type { ImageInfo, ProcessStep, AnalysisData } from '@/types';
import { encode, computeAnalysis, buildDifferenceImage, calculateCapacity } from '@/lib/steganography/lsb';
import { fileToImageData, imageDataToPngBlob, imageDataToPngUrl, formatBytes } from '@/lib/image/utils';

const INIT: ProcessStep[] = [
  { label: 'Image loaded',         status: 'pending' },
  { label: 'Payload serialized',   status: 'pending' },
  { label: 'PBKDF2 key derived',   status: 'pending' },
  { label: 'AES-256-GCM encrypt',  status: 'pending' },
  { label: 'HKDF key separation',  status: 'pending' },
  { label: 'Pixel scatter map',    status: 'pending' },
  { label: 'RGB LSB embedding',    status: 'pending' },
  { label: 'PNG output generated', status: 'pending' },
];

/* Shared layout constants */
const COL = { display: 'flex', flexDirection: 'column' as const, gap: '16px' };

export default function EncodePage() {
  const [cover,       setCover]       = useState<ImageInfo | null>(null);
  const [text,        setText]        = useState('');
  const [password,    setPassword]    = useState('');
  const [showPw,      setShowPw]      = useState(false);
  const [advanced,    setAdvanced]    = useState(false);
  const [decoy,       setDecoy]       = useState(false);
  const [decoyPw,     setDecoyPw]     = useState('');
  const [decoyText,   setDecoyText]   = useState('');
  const [steps,       setSteps]       = useState<ProcessStep[]>(INIT);
  const [busy,        setBusy]        = useState(false);
  const [error,       setError]       = useState<string | null>(null);
  const [pngUrl,      setPngUrl]      = useState<string | null>(null);
  const [pngBlob,     setPngBlob]     = useState<Blob | null>(null);
  const [analysis,    setAnalysis]    = useState<AnalysisData | null>(null);
  const [origUrl,     setOrigUrl]     = useState<string | null>(null);
  const [diffUrl,     setDiffUrl]     = useState<string | null>(null);
  const [showAnalysis,setShowAnalysis]= useState(false);

  const upd = useCallback((i: number, s: ProcessStep['status']) =>
    setSteps(p => p.map((x, j) => j === i ? { ...x, status: s } : x)), []);

  const run = async () => {
    if (!cover)        { setError('Select a cover image.');         return; }
    if (!text.trim())  { setError('Enter a secret message.');       return; }
    if (!password)     { setError('Enter a password.');             return; }
    if (decoy && !decoyPw)   { setError('Decoy password required.'); return; }
    if (decoy && !decoyText) { setError('Decoy message required.'); return; }
    if (decoy && decoyPw === password) { setError('Decoy password must differ.'); return; }

    setError(null); setBusy(true); setPngUrl(null); setPngBlob(null);
    setAnalysis(null); setShowAnalysis(false);
    setSteps(INIT.map(s => ({ ...s, status: 'pending' as const })));

    try {
      upd(0, 'active');
      const img = await fileToImageData(cover.file);
      setOrigUrl(imageDataToPngUrl(img));
      upd(0, 'done'); upd(1, 'active');

      const plain = new TextEncoder().encode(text);
      const decoyPlain = decoy && decoyText ? new TextEncoder().encode(decoyText) : undefined;
      upd(1, 'done'); upd(2, 'active');

      const result = await encode({
        imageData: img, password, plaintext: plain, mode: 'text',
        decoyPassword: decoy ? decoyPw : undefined, decoyPlaintext: decoyPlain,
        onProgress: step => {
          if (step === 'SERIALIZING_PAYLOAD')   { upd(2,'done'); upd(3,'active'); }
          if (step === 'GENERATING_SCATTER_MAP'){ upd(3,'done'); upd(4,'done'); upd(5,'active'); }
          if (step === 'EMBEDDING_BITS')        { upd(5,'done'); upd(6,'active'); }
          if (step === 'DONE')                  { upd(6,'done'); }
        },
      });

      upd(7, 'active');
      const blob = await imageDataToPngBlob(result.stegoImageData);
      setPngUrl(URL.createObjectURL(blob)); setPngBlob(blob);
      upd(7, 'done');

      const { mse, psnr, embeddingRatePercent } = computeAnalysis(img, result.stegoImageData, result.payloadBytes);
      const { theoreticalBytes, usableBytes } = calculateCapacity(img.width, img.height);
      setAnalysis({ originalWidth: img.width, originalHeight: img.height, stegoWidth: result.stegoImageData.width, stegoHeight: result.stegoImageData.height, payloadBytes: result.payloadBytes, capacityBytes: theoreticalBytes, usableCapacityBytes: usableBytes, embeddingRatePercent, modifiedChannels: result.modifiedChannels, mse, psnr, encryptionAlgorithm: 'AES-256-GCM', keyDerivation: 'PBKDF2-SHA256 (200k) + HKDF', embeddingMethod: 'RGB / 1 LSB / PRNG scatter', outputFormat: 'PNG', processingLocation: 'Client-side' });
      setDiffUrl(imageDataToPngUrl(buildDifferenceImage(img, result.stegoImageData, 50)));
    } catch (e) {
      const m = e instanceof Error ? e.message : String(e);
      if (m.startsWith('PAYLOAD_TOO_LARGE')) {
        const [,p,c] = m.split(':');
        setError(`Payload too large — image holds ${formatBytes(parseInt(c))}, payload is ${formatBytes(parseInt(p))}.`);
      } else { setError(`Encoding failed: ${m}`); }
      setSteps(p => p.map(s => s.status === 'active' ? { ...s, status: 'error' } : s));
    }
    setBusy(false);
  };

  const done = steps.every(s => s.status === 'done');
  const payloadEst = text ? new TextEncoder().encode(text).length + 71 : undefined;

  return (
    <div style={{ background: 'var(--bg-subtle)', minHeight: 'calc(100vh - 60px)' }}>
      {/* Page title strip */}
      <div style={{ background: '#fff', borderBottom: '1px solid var(--border)' }}>
        <div style={{ maxWidth: 'var(--page-max)', margin: '0 auto', padding: '32px var(--page-px)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <span style={{ fontFamily: 'var(--mono)', fontSize: '11px', fontWeight: 500, color: 'var(--text-muted)', background: 'var(--bg-muted)', padding: '3px 8px', borderRadius: '4px' }}>01</span>
          </div>
          <h1 style={{ fontFamily: 'var(--serif)', fontWeight: 800, fontOpticalSizing: 'auto', fontSize: 'clamp(32px, 5vw, 52px)', letterSpacing: '-0.04em', color: 'var(--text-primary)', lineHeight: 1.0 }}>
            Embed a payload
          </h1>
          <p style={{ fontFamily: 'var(--sans)', fontSize: '15px', color: 'var(--text-secondary)', marginTop: '10px' }}>
            Encrypt a message and hide it inside any image using AES-256-GCM and RGB-LSB steganography.
          </p>
        </div>
      </div>

      <div style={{ maxWidth: 'var(--page-max)', margin: '0 auto', padding: '32px var(--page-px)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '24px', alignItems: 'start' }}>

          {/* Left column */}
          <div style={COL}>

            {/* Cover image */}
            <div className="card">
              <div className="card-header">
                <span style={{ fontFamily: 'var(--sans)', fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>Cover image</span>
                <span style={{ fontFamily: 'var(--mono)', fontSize: '11px', color: 'var(--text-muted)' }}>PNG · JPEG · WEBP</span>
              </div>
              <div style={{ padding: '20px' }}>
                <DropZone id="cover" label="Drop or select your cover image" subtitle="This image will carry the hidden payload" onImageLoaded={setCover} imageInfo={cover} onClear={() => setCover(null)} minHeight={280} />
              </div>
            </div>

            {/* Secret message */}
            <div className="card">
              <div className="card-header">
                <span style={{ fontFamily: 'var(--sans)', fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>Secret message</span>
                <span style={{ fontFamily: 'var(--mono)', fontSize: '11px', color: 'var(--text-muted)' }}>{new TextEncoder().encode(text).length} bytes</span>
              </div>
              <div style={{ padding: '20px' }}>
                <textarea id="secret-text" className="input" rows={6} placeholder="Type the message you want to encrypt and hide…" value={text} onChange={e => setText(e.target.value)} />
              </div>
            </div>

            {/* Password */}
            <div className="card">
              <div className="card-header">
                <span style={{ fontFamily: 'var(--sans)', fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>Password</span>
                <button className="btn btn-ghost btn-sm" onClick={() => setShowPw(!showPw)} style={{ padding: '4px 8px', fontSize: '12px' }}>{showPw ? 'Hide' : 'Show'}</button>
              </div>
              <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <input id="main-pw" type={showPw ? 'text' : 'password'} className="input" placeholder="Your encryption password — never stored" value={password} onChange={e => setPassword(e.target.value)} autoComplete="new-password" />
                <p style={{ fontFamily: 'var(--sans)', fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                  Derived using PBKDF2-SHA256 (200,000 iterations) + HKDF domain separation. The AES key and scatter seed are cryptographically independent.
                </p>
              </div>
            </div>

            {/* Advanced */}
            <div className="card">
              <button onClick={() => setAdvanced(!advanced)} style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}>
                <div className="card-header" style={{ borderBottom: advanced ? '1px solid var(--border)' : 'none' }}>
                  <span style={{ fontFamily: 'var(--sans)', fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>Advanced — Decoy mode</span>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round" style={{ transform: advanced ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
                    <path d="M3 6l5 5 5-5" />
                  </svg>
                </div>
              </button>
              {advanced && (
                <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }} className="fade-up">
                  <label className="toggle">
                    <input type="checkbox" checked={decoy} onChange={e => setDecoy(e.target.checked)} id="decoy-toggle" />
                    <div className="toggle-track" />
                    <div>
                      <div style={{ fontFamily: 'var(--sans)', fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>Enable dual-password decoy</div>
                      <div style={{ fontFamily: 'var(--sans)', fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>A second password reveals a different, decoy message</div>
                    </div>
                  </label>
                  {decoy && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', paddingTop: '16px', borderTop: '1px solid var(--border)' }} className="fade-up">
                      <div>
                        <label className="field-label" htmlFor="decoy-pw">Decoy password</label>
                        <input id="decoy-pw" type="password" className="input" placeholder="Password that reveals the decoy" value={decoyPw} onChange={e => setDecoyPw(e.target.value)} />
                      </div>
                      <div>
                        <label className="field-label" htmlFor="decoy-msg">Decoy message</label>
                        <textarea id="decoy-msg" className="input" rows={3} placeholder="The message shown with the decoy password…" value={decoyText} onChange={e => setDecoyText(e.target.value)} />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {error && (
              <div className="error-box fade-up">
                <span style={{ flexShrink: 0, fontSize: '16px' }}>⚠</span>
                <span>{error}</span>
              </div>
            )}

            <button id="embed-btn" onClick={run} disabled={busy || !cover || !text.trim() || !password} className="btn btn-dark btn-lg" style={{ borderRadius: '8px', width: '100%' }}>
              {busy ? 'Processing…' : 'Embed payload →'}
            </button>
          </div>

          {/* Right sidebar */}
          <div style={COL}>
            {cover && <CapacityMeter width={cover.width} height={cover.height} payloadBytes={payloadEst} />}
            <ProcessingTimeline steps={steps} title="Encoding pipeline" />
            {cover && cover.file.type !== 'image/png' && (
              <div style={{ background: '#fffbf0', border: '1px solid rgba(148,104,0,0.2)', borderRadius: '8px', padding: '14px 16px' }}>
                <div style={{ fontFamily: 'var(--sans)', fontSize: '13px', fontWeight: 600, color: 'var(--warning)', marginBottom: '4px' }}>JPEG / WEBP input</div>
                <div style={{ fontFamily: 'var(--sans)', fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.5 }}>Output will be lossless PNG regardless of input format.</div>
              </div>
            )}
          </div>
        </div>

        {/* ── Results */}
        {done && pngUrl && analysis && (
          <div style={{ marginTop: '48px', display: 'flex', flexDirection: 'column', gap: '24px' }} className="fade-up">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
              <h2 style={{ fontFamily: 'var(--serif)', fontWeight: 800, fontOpticalSizing: 'auto', fontSize: '32px', letterSpacing: '-0.04em', color: 'var(--text-primary)' }}>
                Encoding complete
              </h2>
              <span className="badge badge-success">✓ Payload embedded</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              {/* Output preview */}
              <div className="card">
                <div className="card-header">
                  <span style={{ fontFamily: 'var(--sans)', fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>Output image</span>
                </div>
                <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div style={{ borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border)' }}>
                    <img src={pngUrl} alt="Stego output" style={{ width: '100%', display: 'block' }} />
                  </div>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button id="download-stego" onClick={() => { const a = document.createElement('a'); a.href = URL.createObjectURL(pngBlob!); a.download = 'stealthdrop-output.png'; a.click(); }} className="btn btn-dark btn-md" style={{ flex: 1, borderRadius: '8px' }}>
                      Download PNG
                    </button>
                    <button onClick={() => setShowAnalysis(!showAnalysis)} className="btn btn-outline btn-md" style={{ borderRadius: '8px' }}>
                      {showAnalysis ? 'Hide' : 'Analyze'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Summary */}
              <div className="card">
                <div className="card-header">
                  <span style={{ fontFamily: 'var(--sans)', fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>Summary</span>
                </div>
                <div style={{ padding: '4px 24px 12px' }}>
                  {([
                    ['PSNR', analysis.psnr === 'infinity' ? '∞ dB' : `${(analysis.psnr as number).toFixed(2)} dB`],
                    ['MSE', analysis.mse.toFixed(8)],
                    ['Payload size', formatBytes(analysis.payloadBytes)],
                    ['Capacity', formatBytes(analysis.capacityBytes)],
                    ['Embedding rate', `${analysis.embeddingRatePercent.toFixed(3)}%`],
                    ['Encryption', 'AES-256-GCM'],
                    ['Output', 'PNG (lossless)'],
                  ] as [string,string][]).map(([l,v]) => (
                    <div key={l} className="metric-row">
                      <span style={{ fontFamily: 'var(--sans)', fontSize: '13px', color: 'var(--text-secondary)' }}>{l}</span>
                      <span style={{ fontFamily: 'var(--mono)', fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)' }}>{v}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {showAnalysis && (
              <div className="fade-up">
                <AnalysisPanel data={analysis} originalImageUrl={origUrl ?? undefined} stegoImageUrl={pngUrl} diffImageUrl={diffUrl ?? undefined} />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
