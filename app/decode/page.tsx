'use client';

import { useState } from 'react';
import DropZone from '@/components/DropZone';
import ProcessingTimeline from '@/components/ProcessingTimeline';
import type { ImageInfo, ProcessStep } from '@/types';
import { decode } from '@/lib/steganography/lsb';
import { fileToImageData, pngBytesToDataUrl } from '@/lib/image/utils';

const INIT: ProcessStep[] = [
  { label: 'Image loaded',            status: 'pending' },
  { label: 'Payload located',         status: 'pending' },
  { label: 'Bits reconstructed',      status: 'pending' },
  { label: 'Authentication verified', status: 'pending' },
  { label: 'Payload decrypted',       status: 'pending' },
];

export default function DecodePage() {
  const [img,     setImg]     = useState<ImageInfo | null>(null);
  const [pw,      setPw]      = useState('');
  const [showPw,  setShowPw]  = useState(false);
  const [steps,   setSteps]   = useState<ProcessStep[]>(INIT);
  const [busy,    setBusy]    = useState(false);
  const [error,   setError]   = useState<string | null>(null);
  const [textOut, setTextOut] = useState<string | null>(null);
  const [imgOut,  setImgOut]  = useState<string | null>(null);
  const [isDecoy, setIsDecoy] = useState(false);
  const [done,    setDone]    = useState(false);

  const upd = (i: number, s: ProcessStep['status']) =>
    setSteps(p => p.map((x, j) => j === i ? { ...x, status: s } : x));

  const run = async () => {
    if (!img) { setError('Select a StealthDrop PNG.'); return; }
    if (!pw)  { setError('Enter the decryption password.'); return; }

    setError(null); setBusy(true); setTextOut(null); setImgOut(null); setDone(false);
    setSteps(INIT.map(s => ({ ...s, status: 'pending' as const })));

    try {
      upd(0, 'active');
      const data = await fileToImageData(img.file);
      upd(0, 'done'); upd(1, 'active');
      await new Promise(r => setTimeout(r, 20));

      const result = await decode({
        imageData: data, password: pw,
        onProgress: step => {
          if (step === 'LOCATING_PAYLOAD')    { upd(1,'done'); upd(2,'active'); }
          if (step === 'RECONSTRUCTING_BITS') { upd(2,'done'); upd(3,'active'); }
          if (step === 'DECRYPTED')           { upd(3,'done'); upd(4,'active'); }
        },
      });

      upd(4, 'done');
      setIsDecoy(result.isDecoy);
      if (result.mode === 'text')  setTextOut(new TextDecoder().decode(result.plaintext));
      if (result.mode === 'image') setImgOut(pngBytesToDataUrl(result.plaintext));
      setDone(true);

    } catch (e) {
      const m = e instanceof Error ? e.message : String(e);
      if (m === 'AUTHENTICATION_FAILED')      setError('Wrong password — authentication failed. No payload was leaked.');
      else if (m === 'NOT_STEALTHDROP_IMAGE') setError('No StealthDrop payload detected in this image.');
      else setError(`Decoding failed: ${m}`);
      setSteps(p => p.map(s => s.status === 'active' ? { ...s, status: 'error' } : s));
    }
    setBusy(false);
  };

  return (
    <div style={{ background: 'var(--bg-subtle)', minHeight: 'calc(100vh - 60px)' }}>

      {/* ── Page header */}
      <div style={{ background: '#fff', borderBottom: '1px solid var(--border)' }}>
        <div style={{ maxWidth: 'var(--page-max)', margin: '0 auto', padding: '32px var(--page-px)' }}>
          <div style={{ marginBottom: '10px' }}>
            <span style={{ fontFamily: 'var(--mono)', fontSize: '11px', fontWeight: 500, color: 'var(--text-muted)', background: 'var(--bg-muted)', padding: '3px 10px', borderRadius: '4px' }}>02</span>
          </div>
          <h1 style={{ fontFamily: 'var(--serif)', fontWeight: 800, fontSize: 'clamp(32px, 5vw, 52px)', letterSpacing: '-0.04em', color: 'var(--text-primary)', lineHeight: 1.0 }}>
            Extract a payload
          </h1>
          <p style={{ fontFamily: 'var(--sans)', fontSize: '15px', color: 'var(--text-secondary)', marginTop: '10px', lineHeight: 1.6 }}>
            Authenticate with your password to decrypt and reveal the hidden message.
          </p>
        </div>
      </div>

      {/* ── Content */}
      <div style={{ maxWidth: 'var(--page-max)', margin: '0 auto', padding: '32px var(--page-px)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '24px', alignItems: 'start' }}>

          {/* Left column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

            {/* Image upload */}
            <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 24px', borderBottom: '1px solid var(--border)', background: 'var(--bg-subtle)' }}>
                <span style={{ fontFamily: 'var(--sans)', fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>StealthDrop image</span>
                <span style={{ fontFamily: 'var(--sans)', fontSize: '12px', color: 'var(--text-muted)' }}>Must be original — unmodified PNG</span>
              </div>
              <div style={{ padding: '20px' }}>
                <DropZone
                  id="stego-img"
                  label="Drop the encoded PNG"
                  subtitle="The StealthDrop image to decode"
                  onImageLoaded={setImg}
                  imageInfo={img}
                  onClear={() => { setImg(null); setDone(false); setTextOut(null); setImgOut(null); }}
                  minHeight={280}
                />
              </div>
            </div>

            {/* Password */}
            <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 24px', borderBottom: '1px solid var(--border)', background: 'var(--bg-subtle)' }}>
                <span style={{ fontFamily: 'var(--sans)', fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>Password</span>
                <button
                  onClick={() => setShowPw(!showPw)}
                  style={{ background: 'none', border: 'none', fontFamily: 'var(--sans)', fontSize: '13px', fontWeight: 500, color: 'var(--text-muted)', cursor: 'pointer', padding: '4px 8px', borderRadius: '4px' }}
                >
                  {showPw ? 'Hide' : 'Show'}
                </button>
              </div>
              <div style={{ padding: '20px' }}>
                <input
                  id="decode-pw"
                  type={showPw ? 'text' : 'password'}
                  className="input"
                  placeholder="The password used when encoding this image…"
                  value={pw}
                  onChange={e => setPw(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && run()}
                  autoComplete="current-password"
                />
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="error-box fade-up">
                <span style={{ flexShrink: 0, fontSize: '16px' }}>⚠</span>
                <span>{error}</span>
              </div>
            )}

            {/* CTA */}
            <button
              id="decode-btn"
              onClick={run}
              disabled={busy || !img || !pw}
              className="btn btn-dark btn-lg"
              style={{ borderRadius: '8px', width: '100%' }}
            >
              {busy ? 'Decrypting…' : 'Extract payload →'}
            </button>

            {/* ── Result */}
            {done && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }} className="fade-up">
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <span className="badge badge-success">✓ Authenticated</span>
                  {isDecoy && <span className="badge badge-neutral">Decoy payload</span>}
                </div>

                {textOut !== null && (
                  <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
                    <div style={{ padding: '18px 24px', borderBottom: '1px solid var(--border)', background: 'var(--bg-subtle)' }}>
                      <span style={{ fontFamily: 'var(--sans)', fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
                        {isDecoy ? 'Decoy message' : 'Secret message'}
                      </span>
                    </div>
                    <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                      <div style={{
                        fontFamily: 'var(--sans)', fontSize: '16px', lineHeight: 1.75,
                        color: 'var(--text-primary)', whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                        background: 'var(--bg-subtle)', borderRadius: '8px', padding: '18px 20px',
                        border: '1px solid var(--border)',
                      }}>
                        {textOut}
                      </div>
                      <button
                        id="copy-msg"
                        onClick={() => navigator.clipboard.writeText(textOut)}
                        className="btn btn-outline btn-md"
                        style={{ borderRadius: '8px', alignSelf: 'flex-start' }}
                      >
                        Copy to clipboard
                      </button>
                    </div>
                  </div>
                )}

                {imgOut !== null && (
                  <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
                    <div style={{ padding: '18px 24px', borderBottom: '1px solid var(--border)', background: 'var(--bg-subtle)' }}>
                      <span style={{ fontFamily: 'var(--sans)', fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>Recovered image</span>
                    </div>
                    <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                      <div style={{ borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border)' }}>
                        <img src={imgOut} alt="Recovered" style={{ width: '100%', display: 'block' }} />
                      </div>
                      <a
                        id="download-recovered"
                        href={imgOut}
                        download="recovered.png"
                        className="btn btn-dark btn-md"
                        style={{ borderRadius: '8px', textDecoration: 'none', alignSelf: 'flex-start' }}
                      >
                        Download image
                      </a>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right sidebar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <ProcessingTimeline steps={steps} title="Extraction pipeline" />

            <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
              <div style={{ padding: '18px 24px', borderBottom: '1px solid var(--border)', background: 'var(--bg-subtle)' }}>
                <span style={{ fontFamily: 'var(--sans)', fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>Important</span>
              </div>
              <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {[
                  ['Upload the original StealthDrop PNG, unmodified.', false],
                  ['JPEG re-encoding permanently destroys LSB data.', true],
                  ['Wrong password returns auth failure — no payload leaked.', false],
                  ['Decoy mode: both passwords authenticate independently.', false],
                ].map(([text, warn], i) => (
                  <div key={i} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                    <span style={{ fontFamily: 'var(--mono)', fontSize: '11px', color: warn ? 'var(--warning)' : 'var(--text-muted)', marginTop: '2px', flexShrink: 0, fontWeight: 500 }}>
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <p style={{ fontFamily: 'var(--sans)', fontSize: '13px', color: warn ? 'var(--warning)' : 'var(--text-secondary)', lineHeight: 1.55, fontWeight: warn ? 500 : 400 }}>
                      {text as string}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
