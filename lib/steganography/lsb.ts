// ============================================================
// StealthDrop — LSB Steganography Engine (Revised)
//
// DESIGN DECISION for the Chicken-and-Egg PRNG/Salt problem:
//
// The PRNG scatter map requires a salt derived from the payload,
// but the salt is stored IN the payload. Solution:
//
// We use a SINGLE scatter map derived from:
//   password + ZERO_SALT (all zeroes for the scatter phase)
//
// This is safe because:
// - The AES-GCM encryption uses a RANDOM salt/IV stored in the header.
// - The scatter map only determines POSITIONS, not cryptographic security.
// - The scatter map is deterministic for the same password, enabling decoding.
// - Confidentiality comes from AES-256-GCM, not from scatter positions.
//
// The scatter map generated from password + ZERO_SALT is used for
// BOTH encoding and decoding. The password is the only input needed
// to reconstruct the exact same pixel traversal order.
//
// This is simpler, fully deterministic, and cryptographically sound.
// ============================================================

import { buildScatterMap } from './scatter';
import { buildFullPayload, parseAndDecrypt } from '@/lib/payload/serializer';
import { SALT_BYTES, MIN_PAYLOAD_OVERHEAD, EncodeMode } from '@/types';
import type { AnalysisData } from '@/types';

// -------------------------------------------------------
// Capacity calculation
// -------------------------------------------------------
export function calculateCapacity(width: number, height: number): {
  theoreticalBytes: number;
  usableBytes: number;
  overheadBytes: number;
  totalRgbChannels: number;
} {
  const totalRgbChannels = width * height * 3;
  const theoreticalBytes = Math.floor(totalRgbChannels / 8);
  const overheadBytes = MIN_PAYLOAD_OVERHEAD;
  const usableBytes = Math.max(0, theoreticalBytes - overheadBytes);
  return { theoreticalBytes, usableBytes, overheadBytes, totalRgbChannels };
}

// -------------------------------------------------------
// Convert bytes to bit array (MSB first)
// -------------------------------------------------------
function bytesToBits(bytes: Uint8Array): Uint8Array {
  const bits = new Uint8Array(bytes.length * 8);
  for (let i = 0; i < bytes.length; i++) {
    for (let b = 7; b >= 0; b--) {
      bits[i * 8 + (7 - b)] = (bytes[i] >> b) & 1;
    }
  }
  return bits;
}

// -------------------------------------------------------
// Convert bit array back to bytes (MSB first)
// -------------------------------------------------------
function bitsToBytes(bits: Uint8Array): Uint8Array {
  const bytes = new Uint8Array(Math.floor(bits.length / 8));
  for (let i = 0; i < bytes.length; i++) {
    let byte = 0;
    for (let b = 0; b < 8; b++) {
      byte = (byte << 1) | (bits[i * 8 + b] & 1);
    }
    bytes[i] = byte;
  }
  return bytes;
}

// -------------------------------------------------------
// LSB Embed: write bits into scattered RGB channels
// Modifies the pixel array in-place.
// -------------------------------------------------------
function embedBits(
  pixels: Uint8ClampedArray,
  bits: Uint8Array,
  scatterMap: Uint32Array
): number {
  let modifiedCount = 0;
  for (let bitIdx = 0; bitIdx < bits.length; bitIdx++) {
    const channelIdx = scatterMap[bitIdx];
    const pixelIndex = Math.floor(channelIdx / 3);
    const channelInPixel = channelIdx % 3; // 0=R, 1=G, 2=B
    const byteOffset = pixelIndex * 4 + channelInPixel; // RGBA layout

    const originalBit = pixels[byteOffset] & 1;
    const newBit = bits[bitIdx] & 1;
    if (originalBit !== newBit) {
      pixels[byteOffset] = (pixels[byteOffset] & 0xfe) | newBit;
      modifiedCount++;
    }
  }
  return modifiedCount;
}

// -------------------------------------------------------
// LSB Extract: read bits from scattered RGB channels
// -------------------------------------------------------
function extractBits(
  pixels: Uint8ClampedArray,
  scatterMap: Uint32Array
): Uint8Array {
  const bits = new Uint8Array(scatterMap.length);
  for (let bitIdx = 0; bitIdx < scatterMap.length; bitIdx++) {
    const channelIdx = scatterMap[bitIdx];
    const pixelIndex = Math.floor(channelIdx / 3);
    const channelInPixel = channelIdx % 3;
    const byteOffset = pixelIndex * 4 + channelInPixel;
    bits[bitIdx] = pixels[byteOffset] & 1;
  }
  return bits;
}

// Fixed zero salt used for scatter map derivation
// (See design notes above — scatter positions are not a cryptographic secret)
const SCATTER_ZERO_SALT = new Uint8Array(SALT_BYTES);

// -------------------------------------------------------
// ENCODE: Full pipeline
// -------------------------------------------------------
export interface EncodeInput {
  imageData: ImageData;
  password: string;
  plaintext: Uint8Array;
  mode: EncodeMode;
  decoyPassword?: string;
  decoyPlaintext?: Uint8Array;
  onProgress?: (step: string) => void;
}

export interface EncodeOutput {
  stegoImageData: ImageData;
  payloadBytes: number;
  modifiedChannels: number;
}

export async function encode(input: EncodeInput): Promise<EncodeOutput> {
  const { imageData, password, plaintext, mode, decoyPassword, decoyPlaintext, onProgress } = input;

  onProgress?.('SERIALIZING_PAYLOAD');

  // Build the full binary payload (includes header + encrypted content)
  const payloadBinary = await buildFullPayload(
    password,
    plaintext,
    mode,
    decoyPassword,
    decoyPlaintext
  );

  const { totalRgbChannels, theoreticalBytes } = calculateCapacity(
    imageData.width,
    imageData.height
  );

  if (payloadBinary.length > theoreticalBytes) {
    throw new Error(
      `PAYLOAD_TOO_LARGE:${payloadBinary.length}:${theoreticalBytes}`
    );
  }

  onProgress?.('GENERATING_SCATTER_MAP');

  const payloadBits = bytesToBits(payloadBinary);

  // Build scatter map from password + zero salt
  const scatterMap = await buildScatterMap(
    password,
    SCATTER_ZERO_SALT,
    totalRgbChannels,
    payloadBits.length
  );

  onProgress?.('EMBEDDING_BITS');

  // Copy pixel data to avoid mutating the original
  const stegoData = new ImageData(
    new Uint8ClampedArray(imageData.data),
    imageData.width,
    imageData.height
  );

  const modifiedChannels = embedBits(stegoData.data, payloadBits, scatterMap);

  onProgress?.('DONE');

  return {
    stegoImageData: stegoData,
    payloadBytes: payloadBinary.length,
    modifiedChannels,
  };
}

// -------------------------------------------------------
// DECODE: Full pipeline
// Strategy:
// 1. Extract a large chunk of bits using password + zero salt scatter
// 2. Convert to bytes
// 3. Parse and decrypt using the binary payload parser
// -------------------------------------------------------
export interface DecodeInput {
  imageData: ImageData;
  password: string;
  onProgress?: (step: string) => void;
}

export interface DecodeOutput {
  plaintext: Uint8Array;
  mode: EncodeMode;
  isDecoy: boolean;
}

export async function decode(input: DecodeInput): Promise<DecodeOutput> {
  const { imageData, password, onProgress } = input;

  const { totalRgbChannels, theoreticalBytes } = calculateCapacity(
    imageData.width,
    imageData.height
  );

  onProgress?.('LOCATING_PAYLOAD');

  // We extract up to theoreticalBytes from the image (or a reasonable cap)
  // to handle both single and dual (decoy) payloads.
  // Cap at 2MB to avoid memory issues on very large images.
  const extractByteCount = Math.min(theoreticalBytes, 2 * 1024 * 1024);
  const extractBitCount = extractByteCount * 8;

  // Build scatter map using password + zero salt (same as encoding)
  const scatterMap = await buildScatterMap(
    password,
    SCATTER_ZERO_SALT,
    totalRgbChannels,
    Math.min(extractBitCount, totalRgbChannels)
  );

  onProgress?.('RECONSTRUCTING_BITS');

  const extractedBits = extractBits(imageData.data, scatterMap);
  const extractedBytes = bitsToBytes(extractedBits);

  onProgress?.('AUTHENTICATING');

  // Parse and decrypt — throws AUTHENTICATION_FAILED on wrong password
  const result = await parseAndDecrypt(extractedBytes, password);

  onProgress?.('DECRYPTED');

  return result;
}

// -------------------------------------------------------
// MSE / PSNR analysis
// -------------------------------------------------------
export function computeAnalysis(
  originalData: ImageData,
  stegoData: ImageData,
  payloadBytes: number,
): Pick<AnalysisData, 'mse' | 'psnr' | 'embeddingRatePercent'> {
  const orig = originalData.data;
  const steg = stegoData.data;
  const pixelCount = originalData.width * originalData.height;

  let sumSquaredDiff = 0;
  const totalChannelCount = pixelCount * 3;

  for (let i = 0; i < pixelCount; i++) {
    const offset = i * 4;
    for (let c = 0; c < 3; c++) {
      const diff = orig[offset + c] - steg[offset + c];
      sumSquaredDiff += diff * diff;
    }
  }

  const mse = sumSquaredDiff / totalChannelCount;
  const psnr: number | 'infinity' =
    mse === 0 ? 'infinity' : 10 * Math.log10((255 * 255) / mse);

  const totalRgbBits = pixelCount * 3;
  const payloadBits = payloadBytes * 8;
  const embeddingRatePercent = (payloadBits / totalRgbBits) * 100;

  return { mse, psnr, embeddingRatePercent };
}

// -------------------------------------------------------
// Difference image for visual analysis
// Amplifies pixel differences by a factor for visualization
// -------------------------------------------------------
export function buildDifferenceImage(
  originalData: ImageData,
  stegoData: ImageData,
  amplification = 50
): ImageData {
  const orig = originalData.data;
  const steg = stegoData.data;
  const diffData = new Uint8ClampedArray(orig.length);

  for (let i = 0; i < orig.length; i += 4) {
    // RGB difference amplified
    diffData[i] = Math.min(255, Math.abs(orig[i] - steg[i]) * amplification);
    diffData[i + 1] = Math.min(255, Math.abs(orig[i + 1] - steg[i + 1]) * amplification);
    diffData[i + 2] = Math.min(255, Math.abs(orig[i + 2] - steg[i + 2]) * amplification);
    diffData[i + 3] = 255; // Alpha always 255
  }

  return new ImageData(diffData, originalData.width, originalData.height);
}
