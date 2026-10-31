// ============================================================
// StealthDrop - Core Types
// ============================================================

export type EncodeMode = 'text' | 'image';

export interface ImageInfo {
  file: File;
  width: number;
  height: number;
  sizeBytes: number;
  dataUrl: string;
}

export interface CapacityInfo {
  widthPx: number;
  heightPx: number;
  totalRgbBits: number;
  theoreticalBytes: number;
  overheadBytes: number;
  usableBytes: number;
}

export interface EncodeOptions {
  coverImage: ImageInfo;
  secretText?: string;
  secretImage?: ImageInfo;
  password: string;
  mode: EncodeMode;
  decoyEnabled: boolean;
  decoyPassword?: string;
  decoyText?: string;
}

export interface EncodeResult {
  stegoPngUrl: string;
  stegoPngBlob: Blob;
  analysisData: AnalysisData;
}

export interface DecodeResult {
  mode: EncodeMode;
  secretText?: string;
  secretImageUrl?: string;
  isDecoy: boolean;
}

export interface AnalysisData {
  originalWidth: number;
  originalHeight: number;
  stegoWidth: number;
  stegoHeight: number;
  payloadBytes: number;
  capacityBytes: number;
  usableCapacityBytes: number;
  embeddingRatePercent: number;
  modifiedChannels: number;
  mse: number;
  psnr: number | 'infinity';
  encryptionAlgorithm: string;
  keyDerivation: string;
  embeddingMethod: string;
  outputFormat: string;
  processingLocation: string;
}

export interface ProcessStep {
  label: string;
  status: 'pending' | 'active' | 'done' | 'error';
}

// ----------------------------------------------------------------
// Binary payload format constants
// ----------------------------------------------------------------

/** Magic bytes: ASCII "SDRP" */
export const MAGIC = new Uint8Array([0x53, 0x44, 0x52, 0x50]);

/** Current payload format version */
export const PAYLOAD_VERSION = 1;

/**
 * Payload mode flags
 */
export enum PayloadMode {
  TextOnly = 0x01,
  ImageOnly = 0x02,
  Decoy = 0x10,
}

/**
 * Binary payload structure (conceptual):
 *
 * [4] MAGIC        — "SDRP"
 * [1] VERSION      — uint8
 * [1] MODE         — PayloadMode flag byte
 * [1] FLAGS        — reserved
 * [32] SALT        — PBKDF2 salt
 * [12] IV          — AES-GCM nonce
 * [4] PAYLOAD_LEN  — uint32 big-endian, encrypted payload byte length
 * [N] CIPHERTEXT   — AES-GCM encrypted payload (includes 16-byte auth tag)
 *
 * For DECOY mode, two payloads are concatenated:
 * [header + decoy_payload] + [header + real_payload]
 * Both share the same position stream but the decoder walks both.
 *
 * Total header overhead (non-decoy): 4+1+1+1+32+12+4 = 55 bytes
 * Plus AES-GCM auth tag: 16 bytes
 * Minimum overhead per payload: 71 bytes
 */
export const HEADER_BYTES = 4 + 1 + 1 + 1 + 32 + 12 + 4; // 55
export const AES_GCM_TAG_BYTES = 16;
export const MIN_PAYLOAD_OVERHEAD = HEADER_BYTES + AES_GCM_TAG_BYTES; // 71

/** PBKDF2 iteration count */
export const PBKDF2_ITERATIONS = 200_000;

/** PBKDF2 hash */
export const PBKDF2_HASH = 'SHA-256';

/** Derived key length in bits */
export const DERIVED_KEY_BITS = 256;

/** Salt length in bytes */
export const SALT_BYTES = 32;

/** AES-GCM IV length in bytes */
export const IV_BYTES = 12;

/** Domain separation strings for HKDF-style key derivation */
export const KDF_INFO_AES = 'stealthdrop-aes-gcm';
export const KDF_INFO_PRNG = 'stealthdrop-prng';
