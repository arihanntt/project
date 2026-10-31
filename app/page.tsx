'use client';

import Link from 'next/link';

const MODES = [
  { href: '/encode', n: '01', title: 'Encode', sub: 'Encrypt text and hide it inside any image. The output is a standard PNG — visually identical to the original.' },
  { href: '/decode', n: '02', title: 'Decode', sub: 'Upload a StealthDrop image and provide the correct password to extract and decrypt the hidden payload.' },
  { href: '/image-in-image', n: '03', title: 'Image in Image', sub: 'Encrypt and conceal an entire image inside another image. Both remain fully intact.' },
  { href: '/analysis', n: '04', title: 'Analysis', sub: 'Compare original and encoded images. Measure PSNR, MSE, embedding rate, and LSB distribution.' },
];

const HOW_IT_WORKS = [
  {
    n: '01',
    title: 'Upload your image',
    desc: 'Choose any PNG, JPEG, or WEBP as your cover — the carrier that will hold the secret. The image stays visually identical.',
    icon: (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="22" height="22" rx="3" />
        <path d="M3 18l6-6 5 5 4-4 7 7" />
        <circle cx="9" cy="9" r="2" />
      </svg>
    ),
  },
  {
    n: '02',
    title: 'Type your secret',
    desc: 'Write any message — or embed an entire image. StealthDrop handles text and binary payloads with the same pipeline.',
    icon: (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 6h20M4 12h14M4 18h10" />
      </svg>
    ),
  },
  {
    n: '03',
    title: 'Set a password',
    desc: 'Your password is passed through PBKDF2-SHA256 at 200,000 iterations, then HKDF separates the AES key from the scatter seed.',
    icon: (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="5" />
        <path d="M15.5 15.5L23 23" />
        <circle cx="11" cy="11" r="2" fill="currentColor" stroke="none" />
      </svg>
    ),
  },
  {
    n: '04',
    title: 'AES-256-GCM encryption',
    desc: 'Your payload is encrypted in-browser. No data leaves your device. The ciphertext is authenticated — tamper-proof.',
    icon: (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="8" y="12" width="12" height="10" rx="2" />
        <path d="M10 12V9a4 4 0 0 1 8 0v3" />
        <circle cx="14" cy="17" r="1.5" fill="currentColor" stroke="none" />
      </svg>
    ),
  },
  {
    n: '05',
    title: 'PRNG pixel scatter',
    desc: 'The HKDF-derived seed powers a Mulberry32 PRNG. A Fisher-Yates shuffle assigns each payload bit to a pseudorandom pixel channel.',
    icon: (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="7" cy="7" r="2" /><circle cx="21" cy="7" r="2" />
        <circle cx="14" cy="14" r="2" /><circle cx="7" cy="21" r="2" /><circle cx="21" cy="21" r="2" />
        <path d="M9 7h10M9 7.5L14 14M19 7.5L14 14M14 16L9 21M14 16L19 21" />
      </svg>
    ),
  },
  {
    n: '06',
    title: 'LSB embedding',
    desc: 'Each bit of ciphertext replaces the least-significant bit of a scattered RGB channel. The perceptual change is invisible — PSNR typically exceeds 50 dB.',
    icon: (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="10" height="10" rx="1.5" opacity="0.4" />
        <rect x="15" y="3" width="10" height="10" rx="1.5" />
        <rect x="3" y="15" width="10" height="10" rx="1.5" />
        <rect x="15" y="15" width="10" height="10" rx="1.5" opacity="0.4" />
      </svg>
    ),
  },
  {
    n: '07',
    title: 'Download the PNG',
    desc: 'The output is a standard lossless PNG. Share it anywhere. Only someone with the correct password can ever know it carries a secret.',
    icon: (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 4v14M9 13l5 5 5-5" />
        <path d="M5 20v2a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-2" />
      </svg>
    ),
  },
];

const SPECS: [string, string][] = [
  ['Encryption', 'AES-256-GCM'],
  ['Key derivation', 'PBKDF2-SHA256 · 200,000 iterations'],
  ['Key separation', 'HKDF — AES key ≠ PRNG seed'],
  ['Pixel scatter', 'Mulberry32 + Fisher-Yates shuffle'],
  ['Embedding', '1 LSB per RGB channel'],
  ['Output format', 'PNG (lossless)'],
  ['Processing', 'Browser — nothing uploaded'],
  ['Server contact', 'None'],
];

function ModeCard({ href, n, title, sub }: { href: string; n: string; title: string; sub: string }) {
  return (
    <Link href={href} style={{ textDecoration: 'none', display: 'block' }}
      onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--bg-subtle)'}
      onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = '#fff'}
    >
      <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: '12px', padding: '32px', height: '100%', transition: 'background 0.15s', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ fontFamily: 'var(--mono)', fontSize: '11px', fontWeight: 500, color: 'var(--text-muted)', letterSpacing: '0.05em' }}>{n}</div>
        <div>
          <h3 style={{ fontFamily: 'var(--serif)', fontWeight: 800, fontSize: '26px', letterSpacing: '-0.03em', color: 'var(--text-primary)', marginBottom: '10px' }}>{title}</h3>
          <p style={{ fontFamily: 'var(--sans)', fontSize: '14px', lineHeight: 1.65, color: 'var(--text-secondary)' }}>{sub}</p>
        </div>
        <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', gap: '6px', fontFamily: 'var(--sans)', fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
          Open
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M3 7h8M8 4l3 3-3 3" />
          </svg>
        </div>
      </div>
    </Link>
  );
}

export default function Home() {
  return (
    <div style={{ background: 'var(--bg)' }}>

      {/* ══════════════════════════════ HERO */}
      <section style={{
        minHeight: 'calc(100vh - 60px)',
        maxWidth: 'var(--page-max)',
        margin: '0 auto',
        padding: '0 var(--page-px)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        paddingTop: '32px',
        paddingBottom: '80px',
        gap: '52px',
      }}>
        <div>
          <h1 style={{
            fontFamily: 'var(--serif)',
            fontWeight: 800,
            fontSize: 'clamp(72px, 12vw, 160px)',
            lineHeight: 0.92,
            letterSpacing: '-0.04em',
            color: 'var(--text-primary)',
          }}>
            Surface
          </h1>
          <h1 style={{
            fontFamily: 'var(--serif)',
            fontWeight: 400,
            fontSize: 'clamp(72px, 12vw, 160px)',
            lineHeight: 0.92,
            letterSpacing: '-0.04em',
            color: 'var(--text-muted)',
          }}>
            isn’t everything.
          </h1>
        </div>

        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '40px', flexWrap: 'wrap' }}>
          <p style={{
            fontFamily: 'var(--sans)', fontSize: '17px', lineHeight: 1.75,
            color: 'var(--text-secondary)', maxWidth: '460px', fontWeight: 400,
          }}>
            StealthDrop encrypts your secrets and embeds them into ordinary images using AES-256-GCM encryption and PRNG pixel scattering. Everything runs in your browser — zero server contact.
          </p>
          <div style={{ display: 'flex', gap: '12px', flexShrink: 0 }}>
            <Link href="/encode" className="btn btn-dark btn-lg" style={{ borderRadius: '8px' }}>Start encoding</Link>
            <Link href="/decode" className="btn btn-outline btn-lg" style={{ borderRadius: '8px' }}>Decode image</Link>
          </div>
        </div>
      </section>

      <div style={{ borderTop: '1px solid var(--border)', maxWidth: 'var(--page-max)', margin: '0 auto' }} />

      {/* ═══════════════════════ HOW IT WORKS — SVG PATH */}
      <section style={{ maxWidth: 'var(--page-max)', margin: '0 auto', padding: '100px var(--page-px)' }}>
        <div style={{ marginBottom: '72px' }}>
          <h2 style={{ fontFamily: 'var(--serif)', fontWeight: 800, fontSize: 'clamp(36px, 5vw, 56px)', letterSpacing: '-0.04em', color: 'var(--text-primary)', marginBottom: '16px' }}>
            How it works
          </h2>
          <p style={{ fontFamily: 'var(--sans)', fontSize: '16px', color: 'var(--text-secondary)', maxWidth: '500px', lineHeight: 1.65 }}>
            Seven steps from upload to an invisible, encrypted image — all in your browser.
          </p>
        </div>

        {/* Steps with SVG connector line */}
        <div style={{ position: 'relative' }}>

          {/* Vertical connector line */}
          <div style={{ position: 'absolute', left: '27px', top: '56px', bottom: '56px', width: '2px', background: 'linear-gradient(to bottom, var(--text-primary) 0%, rgba(0,0,0,0.12) 60%, transparent 100%)', zIndex: 0 }} />


          {/* SVG dot connectors */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
            {HOW_IT_WORKS.map((step, i) => (
              <div key={step.n} style={{
                display: 'flex',
                gap: '32px',
                alignItems: 'flex-start',
                paddingBottom: i < HOW_IT_WORKS.length - 1 ? '48px' : '0',
                position: 'relative',
                zIndex: 1,
              }}>
                {/* Left: number circle */}
                <div style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '50%',
                  background: i === 0 ? 'var(--text-primary)' : '#fff',
                  border: `1.5px solid ${i === 0 ? 'var(--text-primary)' : 'var(--border-strong)'}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  color: i === 0 ? '#fff' : 'var(--text-secondary)',
                }}>
                  {step.icon && (
                    <div style={{ color: i === 0 ? '#fff' : 'var(--text-muted)', width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {step.icon}
                    </div>
                  )}
                </div>

                {/* Right: content */}
                <div style={{ paddingTop: '12px', flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                    <span style={{ fontFamily: 'var(--mono)', fontSize: '11px', color: 'var(--text-muted)', fontWeight: 500 }}>{step.n}</span>
                    <h3 style={{ fontFamily: 'var(--serif)', fontWeight: 700, fontSize: '22px', letterSpacing: '-0.03em', color: 'var(--text-primary)' }}>
                      {step.title}
                    </h3>
                  </div>
                  <p style={{ fontFamily: 'var(--sans)', fontSize: '14px', lineHeight: 1.7, color: 'var(--text-secondary)', maxWidth: '600px' }}>
                    {step.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA after steps */}
        <div style={{ marginTop: '64px', paddingTop: '48px', borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '24px' }}>
          <div>
            <div style={{ fontFamily: 'var(--serif)', fontWeight: 700, fontSize: '24px', letterSpacing: '-0.03em', color: 'var(--text-primary)', marginBottom: '6px' }}>
              Ready to try it?
            </div>
            <div style={{ fontFamily: 'var(--sans)', fontSize: '14px', color: 'var(--text-muted)' }}>
              No account. No upload. Just your browser.
            </div>
          </div>
          <Link href="/encode" className="btn btn-dark btn-lg" style={{ borderRadius: '8px' }}>
            Start encoding →
          </Link>
        </div>
      </section>

      <div style={{ borderTop: '1px solid var(--border)', maxWidth: 'var(--page-max)', margin: '0 auto' }} />

      {/* ═════════════════════════════════ MODES */}
      <section style={{ maxWidth: 'var(--page-max)', margin: '0 auto', padding: '100px var(--page-px)' }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: '48px', gap: '24px', flexWrap: 'wrap' }}>
          <h2 style={{ fontFamily: 'var(--serif)', fontWeight: 800, fontSize: 'clamp(36px, 5vw, 56px)', letterSpacing: '-0.04em', color: 'var(--text-primary)', lineHeight: 1.0 }}>
            Four tools.
          </h2>
          <span style={{ fontFamily: 'var(--sans)', fontSize: '14px', color: 'var(--text-muted)' }}>All fully client-side</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '12px' }}>
          {MODES.map(m => <ModeCard key={m.href} {...m} />)}
        </div>
      </section>

      <div style={{ borderTop: '1px solid var(--border)', maxWidth: 'var(--page-max)', margin: '0 auto' }} />

      {/* ══════════════════════════════ SPECS */}
      <section style={{ maxWidth: 'var(--page-max)', margin: '0 auto', padding: '100px var(--page-px)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '80px', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontFamily: 'var(--serif)', fontWeight: 800, fontSize: 'clamp(36px, 5vw, 56px)', letterSpacing: '-0.04em', color: 'var(--text-primary)', lineHeight: 1.0, marginBottom: '24px' }}>
            Zero trust.<br />
            <span style={{ fontWeight: 400, color: 'var(--text-muted)' }}>Full control.</span>
          </h2>
          <p style={{ fontFamily: 'var(--sans)', fontSize: '16px', lineHeight: 1.75, color: 'var(--text-secondary)', maxWidth: '400px', marginBottom: '36px' }}>
            The entire cryptographic pipeline runs inside your browser. Your password and your images never leave your device.
          </p>
          <Link href="/encode" className="btn btn-dark btn-md" style={{ borderRadius: '8px' }}>Try it free</Link>
        </div>
        <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
          {SPECS.map(([label, value], i) => (
            <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '24px', padding: '16px 24px', borderBottom: i < SPECS.length - 1 ? '1px solid var(--border)' : 'none', background: i % 2 !== 0 ? 'var(--bg-subtle)' : 'transparent' }}>
              <span style={{ fontFamily: 'var(--sans)', fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)', flexShrink: 0 }}>{label}</span>
              <span style={{ fontFamily: 'var(--mono)', fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)', textAlign: 'right' }}>{value}</span>
            </div>
          ))}
        </div>
      </section>

      <div style={{ borderTop: '1px solid var(--border)', background: 'var(--bg-subtle)' }}>
        <div style={{ maxWidth: 'var(--page-max)', margin: '0 auto', padding: '28px var(--page-px)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontFamily: 'var(--serif)', fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>StealthDrop</span>
          <span style={{ fontFamily: 'var(--mono)', fontSize: '11px', color: 'var(--text-muted)' }}>AES-256-GCM · PBKDF2-SHA256 · RGB-LSB</span>
        </div>
      </div>
    </div>
  );
}
