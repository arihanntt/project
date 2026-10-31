# StealthDrop — Visual Steganography Engine

**Encrypt. Scatter. Conceal.**

A browser-based cybersecurity application for hiding encrypted text or images inside ordinary images using RGB-LSB steganography combined with password-derived pseudorandom pixel scattering and AES-256-GCM authenticated encryption.

> All processing is **100% client-side**. No images, passwords, or keys are ever transmitted to any server.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Architecture](#2-architecture)
3. [Technology Stack](#3-technology-stack)
4. [Cryptographic Design](#4-cryptographic-design)
5. [Steganographic Design](#5-steganographic-design)
6. [Payload Format](#6-payload-format)
7. [Capacity Calculations](#7-capacity-calculations)
8. [Security Considerations](#8-security-considerations)
9. [Steganalysis Limitations](#9-steganalysis-limitations)
10. [How to Run Locally](#10-how-to-run-locally)
11. [How to Deploy to Vercel](#11-how-to-deploy-to-vercel)
12. [Future Improvements](#12-future-improvements)

---

## 1. Project Overview

StealthDrop is a steganography tool with three primary modes:

| Mode | Description |
|------|-------------|
| **ENCODE** | Encrypt a secret text message and hide it inside a cover image |
| **DECODE** | Extract and decrypt a hidden message from a StealthDrop PNG |
| **IMAGE-IN-IMAGE** | Encrypt a secret image and hide it inside a cover image |
| **ANALYSIS** | Compare original vs. stego image: MSE, PSNR, LSB distribution |

### Key Features

- AES-256-GCM authenticated encryption
- PBKDF2 (200,000 iterations) + HKDF domain-separated key derivation
- PRNG-based pixel-position scattering (non-sequential LSB placement)
- Dual-password decoy mode
- Lossless PNG output
- Full image analysis dashboard with difference visualization

---

## 2. Architecture

```
StealthDrop/
├── app/                        # Next.js App Router pages
│   ├── page.tsx                # Landing page
│   ├── encode/page.tsx         # Encode workflow
│   ├── decode/page.tsx         # Decode workflow
│   ├── image-in-image/page.tsx # Image-in-Image workflow
│   ├── analysis/page.tsx       # Image analysis dashboard
│   ├── layout.tsx              # Root layout
│   └── globals.css             # Design system
│
├── components/                 # Reusable React components
│   ├── NavBar.tsx
│   ├── DropZone.tsx
│   ├── ProcessingTimeline.tsx
│   ├── CapacityMeter.tsx
│   └── AnalysisPanel.tsx
│
├── lib/                        # Core library
│   ├── crypto/
│   │   └── engine.ts           # PBKDF2, HKDF, AES-256-GCM
│   ├── steganography/
│   │   ├── lsb.ts              # LSB embed/extract engine
│   │   └── scatter.ts          # PRNG pixel-position scatter
│   ├── payload/
│   │   └── serializer.ts       # Binary payload format
│   └── image/
│       └── utils.ts            # Canvas/file utilities
│
└── types/
    └── index.ts                # TypeScript types & constants
```

### Data Flow

```
ENCODE:
Password → PBKDF2 → HKDF → [AES key | PRNG seed]
Plaintext → AES-256-GCM → Ciphertext
Ciphertext → Binary payload with header
PRNG seed → Mulberry32 → Fisher-Yates → Pixel permutation
Payload bits → Scattered into RGB LSBs → PNG

DECODE (same password):
Password → PBKDF2 → HKDF → [AES key | PRNG seed]
PRNG seed → Same pixel permutation
Extract bits → Reconstruct payload bytes
Validate magic/version → AES-GCM decrypt → Plaintext
```

---

## 3. Technology Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS 4 |
| Crypto | Web Crypto API (native browser) |
| Image Processing | HTML5 Canvas API |
| Fonts | Inter + JetBrains Mono (Google Fonts) |
| Deployment | Vercel |

---

## 4. Cryptographic Design

### Key Derivation Pipeline

```
Password (string)
    │
    ▼
PBKDF2-SHA256
  iterations: 200,000
  salt: 32 random bytes (per encoding)
    │
    ▼
Base key material
    │
    ├──► HKDF(info="stealthdrop-aes-gcm") ──► 256-bit AES key
    │
    └──► HKDF(info="stealthdrop-prng")   ──► 256-bit PRNG seed bytes
```

### Encryption

- Algorithm: **AES-256-GCM**
- Key size: 256 bits
- IV/Nonce: 12 bytes, randomly generated per encryption
- Authentication tag: 16 bytes (appended to ciphertext)
- Provides: Confidentiality + Integrity + Authenticity

### Security Properties

- Wrong password → AES-GCM authentication failure (no plaintext leaked)
- Every encoding uses a fresh random salt and IV (no nonce reuse)
- HKDF domain separation ensures AES key and PRNG seed are independent
- PBKDF2 with 200,000 iterations provides brute-force resistance

---

## 5. Steganographic Design

### PRNG Scatter Map

**Purpose:** Prevent sequential LSB detection by scattering bits across the image in a password-derived pseudo-random order.

**Algorithm:**
1. HKDF derives 256-bit seed from password (zero-salt for scatter, ensuring same permutation on encode and decode)
2. Seed → Mulberry32 PRNG
3. Mulberry32 → Fisher-Yates shuffle over all RGB channel indices
4. First N indices (where N = payload bit count) form the scatter map

**Security Note:** The PRNG scatter provides positional obfuscation only. Cryptographic security comes from AES-256-GCM, not from pixel positions.

### LSB Embedding

For each payload bit:
- Map scatter index → pixel index + channel (R, G, or B)
- Replace only the least significant bit
- Maximum change per channel value: ±1

```
Original R channel byte: 10110100 (180)
Payload bit = 1
Modified R channel byte: 10110101 (181)  ← only LSB changed
```

The Alpha channel is **never modified**.

### Decoy Mode

```
Bit stream: [decoy sub-payload][real sub-payload]

Decoy password → decrypts first sub-payload → decoy message
Real password  → first sub-payload fails auth → tries second → real message
Wrong password → both fail → AUTHENTICATION_FAILED
```

---

## 6. Payload Format

### Binary Sub-Payload Structure

```
Offset  Size  Field
──────  ────  ──────────────────────────────────────────
0       4     MAGIC          — 0x53 0x44 0x52 0x50 ("SDRP")
4       1     VERSION        — 0x01
5       1     MODE           — 0x01=text, 0x02=image, 0x10=decoy
6       1     FLAGS          — reserved (0x00)
7       32    SALT           — PBKDF2 salt (random per encoding)
39      12    IV             — AES-GCM nonce (random per encoding)
51      4     PAYLOAD_LEN    — uint32 big-endian, ciphertext byte count
55      N     CIPHERTEXT     — AES-GCM encrypted payload + 16-byte tag
```

Total header overhead: **55 bytes**
AES-GCM tag: **16 bytes** (embedded in CIPHERTEXT)
Minimum overhead per payload: **71 bytes**

---

## 7. Capacity Calculations

**Formula:**
```
Total RGB channels   = width × height × 3
Theoretical capacity = Total RGB channels / 8  (bytes)
Usable capacity      = Theoretical capacity - overhead (71+ bytes)
```

**Reference table:**

| Resolution  | Theoretical  | Usable (approx) |
|-------------|--------------|-----------------|
| 640 × 480   | 115.2 KB     | 115.1 KB        |
| 1280 × 720  | 345.6 KB     | 345.5 KB        |
| 1920 × 1080 | 777.6 KB     | 777.5 KB        |
| 2560 × 1440 | 1.38 MB      | 1.38 MB         |
| 3840 × 2160 | 3.11 MB      | 3.11 MB         |

**PSNR for 1 LSB embedding:**
- Typical PSNR: 48–51 dB (excellent perceptual quality)
- Lower PSNR when payload occupies a higher fraction of pixels

---

## 8. Security Considerations

### What StealthDrop Provides

- **Confidentiality**: AES-256-GCM with PBKDF2-derived key
- **Integrity**: GCM authentication tag detects tampering
- **Authenticity**: Wrong password produces authentication failure, not corrupted plaintext
- **Forward secrecy per encoding**: Fresh salt and IV each time
- **Zero server contact**: All processing in the browser

### What StealthDrop Does NOT Provide

- **Steganographic undetectability**: Advanced statistical steganalysis may detect the presence of embedded data
- **Absolute plausible deniability**: The decoy system is a dual-password feature, not a cryptographically provable deniability system
- **Resistance to image recompression**: JPEG re-encoding destroys LSB data

### Best Practices

- Use PNG (lossless) as cover image when possible
- Use large cover images to reduce embedding rate (lower PSNR impact)
- Do not re-encode the stego PNG as JPEG
- Choose strong, unique passwords

---

## 9. Steganalysis Limitations

StealthDrop explicitly **does not claim undetectability**.

PRNG pixel scattering prevents naive sequential LSB checkers. However:

- **Chi-square analysis**: Statistical uniformity of LSB values may deviate from natural images
- **RS analysis**: Sample pair analysis can detect certain LSB patterns
- **Deep learning detectors**: Modern neural-network steganalysis tools (e.g., SRNet, Xu-Net) can detect LSB steganography with some accuracy

For high-security applications, additional measures such as adaptive embedding, cover image selection strategies, and lower embedding rates are recommended.

---

## 10. How to Run Locally

### Prerequisites

- Node.js 18+ (recommended: Node 20)
- npm 9+

### Setup

```bash
git clone <repository>
cd stealthdrop
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build

```bash
npm run build
npm start
```

---

## 11. How to Deploy to Vercel

### Option A: Vercel CLI

```bash
npm install -g vercel
vercel
```

### Option B: GitHub Integration

1. Push to GitHub
2. Import project at [vercel.com/new](https://vercel.com/new)
3. Framework: **Next.js** (auto-detected)
4. Deploy

No environment variables required. All processing is client-side.

---

## 12. Future Improvements

| Feature | Description |
|---------|-------------|
| Web Worker offloading | Move PBKDF2/embedding to a worker to avoid UI blocking on large images |
| 2-bit / 3-bit LSB mode | Higher capacity at cost of more perceptual distortion |
| Steganographic capacity optimization | Adaptive embedding based on image complexity |
| Chi-square analysis tool | Built-in basic steganalysis for demo |
| Mobile optimization | Touch-friendly file upload on iOS/Android |
| Steghide-compatible mode | Interoperable payload format |
| JPEG-safe embedding | Use DCT coefficients for JPEG-resistant embedding |
| Zero-knowledge password strength indicator | Client-side entropy estimation |

---

## License

MIT License. See [LICENSE](LICENSE) for details.

---

*StealthDrop is an educational and research demonstration tool. Use responsibly and legally.*
