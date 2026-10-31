'use client';

import { useState } from 'react';
import DropZone from '@/components/DropZone';
import ProcessingTimeline from '@/components/ProcessingTimeline';
import CapacityMeter from '@/components/CapacityMeter';
import type { ImageInfo, ProcessStep, AnalysisData } from '@/types';
import { encode, computeAnalysis, calculateCapacity } from '@/lib/steganography/lsb';
import { fileToImageData, imageToPngBytes, imageDataToPngBlob, formatBytes } from '@/lib/image/utils';

const INIT: ProcessStep[] = [
  { label: 'Images loaded',            status: 'pending' },
  { label: 'Secret image → PNG bytes', status: 'pending' },
  { label: 'PBKDF2 key derived',       status: 'pending' },
  { label: 'AES-256-GCM encrypt',      status: 'pending' },
  { label: 'Pixel scatter map',        status: 'pending' },
  { label: 'RGB LSB embedding',        status: 'pending' },
  { label: 'PNG output generated',     status: 'pending' },
];

const Card = ({ children }: { children: React.ReactNode }) => (
  <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
    {children}
  </div>
);

const CardHeader = ({ title, right }: { title: string; right?: React.ReactNode }) => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 24px', borderBottom: '1px solid var(--border)', background: 'var(--bg-subtle)' }}>
    <span style={{ fontFamily: 'var(--sans)', fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>{title}</span>
    {right}
  </div>
);

export default function ImageInImagePage() {
  const [cover,    setCover]    = useState<ImageInfo | null>(null);
  const [secret,   setSecret]   = useState<ImageInfo | null>(null);
  const [pw,       setPw]       = useState('');
  const [showPw,   setShowPw]   = useState(false);
  const [steps,    setSteps]    = useState<ProcessStep[]>(INIT);
  const [busy,     setBusy]     = useState(false);
  const [error,    setError]    = useState<string | null>(null);
  const [pngUrl,   setPngUrl]   = useState<string | null>(null);
  const [pngBlob,  setPngBlob]  = useState<Blob | null>(null);
  const [done,     setDone]     = useState(false);
  const [analysis, setAnalysis] = useState<AnalysisData | null>(null);

  const upd = (i: number, s: ProcessStep['status']) =>
    setSteps(p => p.map((x, j) => j === i ? { ...x, status: s } : x));

  const run = async () => {
    if (!cover)  { setError('Select a cover image.'); return; }
    if (!secret) { setError('Select a secret image.'); return; }
    if (!pw)     { setError('Enter a password.'); return; }

    setError(null); setBusy(true); setPngUrl(null); setPngBlob(null); setDone(false);
    setSteps(INIT.map(s => ({ ...s, status: 'pending' as const })));

    try {
      upd(0, 'active');
      const coverData  = await fileToImageData(cover.file);
      const secretData = await fileToImageData(secret.file);
      upd(0, 'done'); upd(1, 'active');

      const secretBytes = await imageToPngBytes(secretData);
      upd(1, 'done');

      const { theoreticalBytes } = calculateCapacity(coverData.width, coverData.height);
      if (secretBytes.length + 71 > theoreticalBytes)
        throw new Error(`PAYLOAD_TOO_LARGE:${secretBytes.length + 71}:${theoreticalBytes}`);

      upd(2, 'active');
      const result = await encode({
        imageData: coverData, password: pw, plaintext: secretBytes, mode: 'image',
        onProgress: step => {
          if (step === 'SERIALIZING_PAYLOAD')    { upd(2, 'done'); upd(3, 'active'); }
          if (step === 'GENERATING_SCATTER_MAP') { upd(3, 'done'); upd(4, 'active'); }
          if (step === 'EMBEDDING_BITS')         { upd(4, 'done'); upd(5, 'active'); }
          if (step === 'DONE')                   { upd(5, 'done'); }
        },
      });

      upd(6, 'active');
      const blob = await imageDataToPngBlob(result.stegoImageData);
      setPngUrl(URL.createObjectURL(blob)); setPngBlob(blob);
      upd(6, 'done');

      const { mse, psnr, embeddingRatePercent } = computeAnalysis(coverData, result.stegoImageData, result.payloadBytes);
      const { theoreticalBytes: cap, usableBytes } = calculateCapacity(coverData.width, coverData.height);
      setAnalysis({ originalWidth: coverData.width, originalHeight: coverData.height, stegoWidth: result.stegoImageData.width, stegoHeight: result.stegoImageData.height, payloadBytes: result.payloadBytes, capacityBytes: cap, usableCapacityBytes: usableBytes, embeddingRatePercent, modifiedChannels: result.modifiedChannels, mse, psnr, encryptionAlgorithm: 'AES-256-GCM', keyDerivation: 'PBKDF2-SHA256 (200k) + HKDF', embeddingMethod: 'RGB / 1 LSB / PRNG scatter', outputFormat: 'PNG', processingLocation: 'Client-side' });
      setDone(true);
    } catch (e) {
      const m = e instanceof Error ? e.message : String(e);
      if (m.startsWith('PAYLOAD_TOO_LARGE')) {
        const [, p, c] = m.split(':');
        setError(`Secret image too large — cover holds ${formatBytes(parseInt(c))}, secret needs ${formatBytes(parseInt(p))}.`);
      } else setError(`Failed: ${m}`);
      setSteps(p => p.map(s => s.status === 'active' ? { ...s, status: 'error' } : s));
    }
    setBusy(false);
  };

  const { theoreticalBytes } = cover ? calculateCapacity(cover.width, cover.height) : { theoreticalBytes: 0 };
  const approxPayload = secret ? secret.sizeBytes + 100 : undefined;
  const capacityExceeded = cover && secret && approxPayload! > theoreticalBytes;

  return (
    <div style={{ background: 'var(--bg-subtle)', minHeight: 'calc(100vh - 60px)' }}>

      {/* ── Page header */}
      <div style={{ background: '#fff', borderBottom: '1px solid var(--border)' }}>
        <div style={{ maxWidth: 'var(--page-max)', margin: '0 auto', padding: '32px var(--page-px)' }}>
          <div style={{ marginBottom: '10px' }}>
            <span style={{ fontFamily: 'var(--mono)', fontSize: '11px', fontWeight: 500, color: 'var(--text-muted)', background: 'var(--bg-muted)', padding: '3px 10px', borderRadius: '4px' }}>03</span>
          </div>
          <h1 style={{ fontFamily: 'var(--serif)', fontWeight: 800, fontSize: 'clamp(32px, 5vw, 52px)', letterSpacing: '-0.04em', color: 'var(--text-primary)', lineHeight: 1.0 }}>
            Image in image
          </h1>
          <p style={{ fontFamily: 'var(--sans)', fontSize: '15px', color: 'var(--text-secondary)', marginTop: '10px', lineHeight: 1.6 }}>
            Encrypt and hide an entire image inside another. Both remain visually unchanged.
          </p>
        </div>
      </div>

      {/* ── Content */}
      <div style={{ maxWidth: 'var(--page-max)', margin: '0 auto', padding: '32px var(--page-px)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '24px', alignItems: 'start' }}>

          {/* Left */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

            {/* Dual dropzones */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <Card>
                <CardHeader title="Cover image" right={<span style={{ fontFamily: 'var(--sans)', fontSize: '12px', color: 'var(--text-muted)' }}>Carrier</span>} />
                <div style={{ padding: '16px' }}>
                  <DropZone id="cover-img" label="Drop cover image" subtitle="Will carry the hidden image" onImageLoaded={setCover} imageInfo={cover} onClear={() => setCover(null)} minHeight={220} />
                </div>
              </Card>
              <Card>
                <CardHeader title="Secret image" right={<span style={{ fontFamily: 'var(--sans)', fontSize: '12px', color: 'var(--text-muted)' }}>Payload</span>} />
                <div style={{ padding: '16px' }}>
                  <DropZone id="secret-img" label="Drop secret image" subtitle="Will be encrypted and hidden" onImageLoaded={setSecret} imageInfo={secret} onClear={() => setSecret(null)} minHeight={220} />
                </div>
              </Card>
            </div>

            {/* Capacity warning */}
            {capacityExceeded && (
              <div style={{ background: 'var(--danger-bg)', border: '1px solid rgba(192,57,43,0.15)', borderLeft: '3px solid var(--danger)', borderRadius: '8px', padding: '14px 18px' }} className="fade-up">
                <div style={{ fontFamily: 'var(--sans)', fontSize: '14px', fontWeight: 700, color: 'var(--danger)', marginBottom: '4px' }}>Capacity exceeded</div>
                <div style={{ fontFamily: 'var(--sans)', fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  Secret ~{formatBytes(secret!.sizeBytes)} · Cover holds ~{formatBytes(theoreticalBytes)} · Use a larger cover image or compress the secret.
                </div>
              </div>
            )}

            {/* Password */}
            <Card>
              <CardHeader
                title="Password"
                right={
                  <button onClick={() => setShowPw(!showPw)}
                    style={{ background: 'none', border: 'none', fontFamily: 'var(--sans)', fontSize: '13px', fontWeight: 500, color: 'var(--text-muted)', cursor: 'pointer', padding: '4px 8px', borderRadius: '4px' }}>
                    {showPw ? 'Hide' : 'Show'}
                  </button>
                }
              />
              <div style={{ padding: '20px' }}>
                <input
                  id="iii-pw"
                  type={showPw ? 'text' : 'password'}
                  className="input"
                  placeholder="Password for AES-256-GCM encryption…"
                  value={pw}
                  onChange={e => setPw(e.target.value)}
                  autoComplete="new-password"
                />
              </div>
            </Card>

            {/* Error */}
            {error && (
              <div className="error-box fade-up">
                <span style={{ flexShrink: 0 }}>⚠</span>
                <span>{error}</span>
              </div>
            )}

            {/* CTA */}
            <button
              id="hide-image-btn"
              onClick={run}
              disabled={busy || !cover || !secret || !pw || !!capacityExceeded}
              className="btn btn-dark btn-lg"
              style={{ borderRadius: '8px', width: '100%' }}
            >
              {busy ? 'Processing…' : 'Conceal image →'}
            </button>

            {/* Result */}
            {done && pngUrl && analysis && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }} className="fade-up">
                <span className="badge badge-success" style={{ alignSelf: 'flex-start' }}>✓ Image concealed</span>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <Card>
                    <CardHeader title="Output PNG" />
                    <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <div style={{ borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border)' }}>
                        <img src={pngUrl} alt="Output" style={{ width: '100%', display: 'block' }} />
                      </div>
                      <button
                        id="download-iii"
                        onClick={() => { const a = document.createElement('a'); a.href = URL.createObjectURL(pngBlob!); a.download = 'stealthdrop-image.png'; a.click(); }}
                        className="btn btn-dark btn-md"
                        style={{ borderRadius: '8px' }}
                      >
                        Download PNG
                      </button>
                    </div>
                  </Card>
                  <Card>
                    <CardHeader title="Stats" />
                    <div style={{ padding: '4px 20px 12px' }}>
                      {([
                        ['Payload', formatBytes(analysis.payloadBytes)],
                        ['PSNR', analysis.psnr === 'infinity' ? '∞ dB' : `${(analysis.psnr as number).toFixed(2)} dB`],
                        ['MSE', analysis.mse.toFixed(6)],
                        ['Embedding rate', `${analysis.embeddingRatePercent.toFixed(3)}%`],
                      ] as [string, string][]).map(([l, v]) => (
                        <div key={l} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '11px 0', borderBottom: '1px solid var(--border)' }}>
                          <span style={{ fontFamily: 'var(--sans)', fontSize: '13px', color: 'var(--text-secondary)' }}>{l}</span>
                          <span style={{ fontFamily: 'var(--mono)', fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>{v}</span>
                        </div>
                      ))}
                    </div>
                  </Card>
                </div>
              </div>
            )}
          </div>

          {/* Right sidebar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {cover && <CapacityMeter width={cover.width} height={cover.height} payloadBytes={approxPayload} />}
            <ProcessingTimeline steps={steps} title="Pipeline" />
            <Card>
              <CardHeader title="How it works" />
              <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {[
                  'Secret image is encoded as raw PNG bytes',
                  'Bytes are encrypted with AES-256-GCM',
                  'Ciphertext embedded in cover RGB LSBs',
                  'Output is a standard lossless PNG',
                  'Decode with Decode page using the same password',
                ].map((n, i) => (
                  <div key={i} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                    <span style={{ fontFamily: 'var(--mono)', fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px', flexShrink: 0, fontWeight: 500 }}>
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <p style={{ fontFamily: 'var(--sans)', fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.55 }}>{n}</p>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
