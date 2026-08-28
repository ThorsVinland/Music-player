import { Buffer } from 'buffer';

// Polyfill global Buffer for music-metadata-browser in React Native
if (typeof global.Buffer === 'undefined') {
  global.Buffer = Buffer;
}

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system/legacy';

const ARTWORK_CACHE_PREFIX = '@art_cache_v2_';
const memoryCache = new Map<string, string | null>();

/**
 * Parse ID3v2 APIC (Attached Picture) tag directly from a Buffer.
 * This avoids any dependency on music-metadata-browser and its Stream API.
 */
function extractApicFromBuffer(buf: Buffer): { data: Buffer; mime: string } | null {
  // ID3v2 header: "ID3" + version (2 bytes) + flags (1 byte) + size (4 bytes syncsafe)
  if (buf.length < 10) return null;
  
  const isID3 = buf[0] === 0x49 && buf[1] === 0x44 && buf[2] === 0x33;
  if (!isID3) {
    const isOgg = buf[0] === 0x4f && buf[1] === 0x67 && buf[2] === 0x67 && buf[3] === 0x53; // 'O', 'g', 'g', 'S'
    if (isOgg) {
      console.log(`[Diagnostic] Ogg file detected with wrong extension, ID3 not applicable`);
    } else {
      console.log(`[Diagnostic] ID3 Header not found. buf[0..2]: ${buf[0]}, ${buf[1]}, ${buf[2]}`);
    }
    return null;
  }

  // Decode the syncsafe integer for the tag size (bytes 6-9)
  const tagSize =
    ((buf[6] & 0x7f) << 21) |
    ((buf[7] & 0x7f) << 14) |
    ((buf[8] & 0x7f) << 7) |
    (buf[9] & 0x7f);

  const id3Version = buf[3]; // 3 or 4

  let offset = 10;
  const tagEnd = Math.min(10 + tagSize, buf.length);

  while (offset < tagEnd - 10) {
    // Frame ID: 4 bytes for ID3v2.3/v2.4, 3 bytes for ID3v2.2
    const frameId =
      id3Version >= 3
        ? buf.slice(offset, offset + 4).toString('latin1')
        : buf.slice(offset, offset + 3).toString('latin1');

    const idLen = id3Version >= 3 ? 4 : 3;
    const sizeLen = id3Version >= 3 ? 4 : 3;
    const flagsLen = id3Version >= 3 ? 2 : 0;
    const headerLen = idLen + sizeLen + flagsLen;

    let frameSize: number;
    if (id3Version >= 3) {
      if (id3Version === 4) {
        // ID3v2.4 uses syncsafe integers for frame sizes
        frameSize =
          ((buf[offset + 4] & 0x7f) << 21) |
          ((buf[offset + 5] & 0x7f) << 14) |
          ((buf[offset + 6] & 0x7f) << 7) |
          (buf[offset + 7] & 0x7f);
      } else {
        // ID3v2.3 uses regular integers
        frameSize =
          (buf[offset + 4] << 24) |
          (buf[offset + 5] << 16) |
          (buf[offset + 6] << 8) |
          buf[offset + 7];
      }
    } else {
      frameSize =
        (buf[offset + 3] << 16) |
        (buf[offset + 4] << 8) |
        buf[offset + 5];
    }

    if (frameSize <= 0 || frameSize > 20_000_000) break;

    const apicId = id3Version >= 3 ? 'APIC' : 'PIC';

    if (frameId === apicId) {
      if (offset + headerLen + frameSize > buf.length) {
        // The image data extends beyond the buffer we read.
        const requiredLength = offset + headerLen + frameSize;
        throw new Error(`TRUNCATED_APIC:${requiredLength}`);
      }

      const frameData = buf.slice(offset + headerLen, offset + headerLen + frameSize);
      const textEncoding = frameData[0];
      // Skip text encoding byte
      let i = 1;
      // Read MIME type (null-terminated)
      const mimeEnd = frameData.indexOf(0, i);
      if (mimeEnd === -1) break;
      const mime = frameData.slice(i, mimeEnd).toString('latin1');
      i = mimeEnd + 1;
      // Skip picture type byte
      i += 1;
      
      // Skip description
      let descEnd = -1;
      if (textEncoding === 1 || textEncoding === 2) {
        // UTF-16 description (terminated by two null bytes)
        for (let j = i; j < frameData.length - 1; j++) {
          if (frameData[j] === 0 && frameData[j + 1] === 0) {
            descEnd = j;
            i = j + 2;
            break;
          }
        }
      } else {
        // ISO-8859-1 or UTF-8 (terminated by one null byte)
        descEnd = frameData.indexOf(0, i);
        if (descEnd !== -1) {
          i = descEnd + 1;
        }
      }
      
      if (descEnd === -1) break;

      // Remaining bytes are the image data
      const imageData = frameData.slice(i);
      if (imageData.length > 0) {
        return { data: imageData, mime: mime || 'image/jpeg' };
      }
    }

    offset += headerLen + frameSize;
  }

  return null;
}

import * as mm from 'music-metadata-browser';

class ConcurrencyQueue {
  private queue: (() => void)[] = [];
  private activeCount = 0;
  private readonly concurrency: number;

  constructor(concurrency: number) {
    this.concurrency = concurrency;
  }

  async enqueue<T>(task: () => Promise<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      this.queue.push(async () => {
        try {
          const result = await task();
          resolve(result);
        } catch (e) {
          reject(e);
        } finally {
          this.activeCount--;
          this.next();
        }
      });
      this.next();
    });
  }

  private next() {
    if (this.activeCount < this.concurrency && this.queue.length > 0) {
      this.activeCount++;
      const task = this.queue.shift();
      task?.();
    }
  }
}

const extractQueue = new ConcurrencyQueue(4); // Max 4 concurrent extractions

export function getMemoryCachedArt(uri: string | null | undefined): string | null {
  if (!uri) return null;
  if (memoryCache.has(uri)) {
    return memoryCache.get(uri) || null;
  }
  return null;
}

/**
 * Extract embedded album cover artwork from audio file URI (ID3 / APIC tag).
 * Uses a pure-JS ID3 parser with in-memory and persistent caching.
 */
export async function getEmbeddedArt(uri: string | null | undefined): Promise<string | null> {
  if (!uri) return null;

  // 1. Check in-memory cache first (instant 0ms)
  const memCached = getMemoryCachedArt(uri);
  if (memCached) return memCached;

  // 2. Check persistent storage cache
  try {
    const cachedArt = await AsyncStorage.getItem(ARTWORK_CACHE_PREFIX + uri);
    if (cachedArt !== null) {
      if (cachedArt === 'NULL') {
        memoryCache.set(uri, null);
        console.log(`[Diagnostic] Cache hit (No Artwork) for ${uri.split('/').pop()}`);
        return null;
      }
      if (cachedArt.startsWith('file://')) {
        const info = await FileSystem.getInfoAsync(cachedArt);
        if (info.exists && info.size && info.size > 0) {
          memoryCache.set(uri, cachedArt);
          console.log(`[Diagnostic] Cache hit for ${uri.split('/').pop()}`);
          return cachedArt;
        }
      } else {
        // Fallback for legacy base64 data URIs
        memoryCache.set(uri, cachedArt);
        console.log(`[Diagnostic] Cache hit (Base64) for ${uri.split('/').pop()}`);
        return cachedArt;
      }
    }
  } catch {
    // ignore storage error and proceed
  }

  // Simple string hashing function to generate safe ASCII filenames
  const hashString = (str: string) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash).toString(36);
  };

  // Enqueue the heavy extraction task to prevent locking JS thread and causing lag
  return extractQueue.enqueue(async () => {
    // Check cache again in case it was resolved while waiting in queue
    if (memoryCache.has(uri)) return memoryCache.get(uri) || null;

  // Yield to JS thread to prevent blocking UI during scrolling
  await new Promise(resolve => setTimeout(resolve, 0));

  try {
    const isM4a = uri.toLowerCase().endsWith('.m4a') || uri.toLowerCase().endsWith('.mp4');
    const CHUNK_SIZE = isM4a ? 512 * 1024 : 256 * 1024; // M4A might need a bit more space for 'moov'

    // Read initial chunk
    let base64Data = await FileSystem.readAsStringAsync(uri, {
      encoding: 'base64',
      position: 0,
      length: CHUNK_SIZE,
    });

    // Yield again before heavy synchronous buffer processing
    await new Promise(resolve => setTimeout(resolve, 0));

    let buffer = Buffer.from(base64Data, 'base64');
    let picture: { data: Buffer | Uint8Array, mime: string } | null = null;

    try {
      if (isM4a) {
        // Use music-metadata-browser for MP4/M4A containers directly from memory buffer
        const metadata = await mm.parseBuffer(buffer, 'audio/mp4', {
          duration: false,
          skipPostHeaders: true,
        });

        const cover = metadata.common.picture && metadata.common.picture.length > 0
          ? mm.selectCover(metadata.common.picture) || metadata.common.picture[0]
          : null;
          
        if (cover && cover.data) {
          picture = { data: cover.data, mime: cover.format || 'image/jpeg' };
        }
      } else {
        // Use custom pure JS ID3 parser for MP3
        picture = extractApicFromBuffer(buffer);
      }
    } catch (e: any) {
      if (!isM4a && e.message && e.message.startsWith('TRUNCATED_APIC:')) {
        const requiredLength = parseInt(e.message.split(':')[1], 10);
        console.log(`[Diagnostic] ${uri?.split('/').pop()}: Image truncated. Re-reading exact required length: ${requiredLength} bytes`);
        
        base64Data = await FileSystem.readAsStringAsync(uri, {
          encoding: 'base64',
          position: 0,
          length: requiredLength,
        });
        
        await new Promise(resolve => setTimeout(resolve, 0));
        buffer = Buffer.from(base64Data, 'base64');
        picture = extractApicFromBuffer(buffer);
      } else {
        throw e;
      }
    }

    if (picture) {
      const base64Art = Buffer.from(picture.data).toString('base64');
      
      const safeName = 'art_' + hashString(uri) + '.jpg';
      const cacheDir = FileSystem.cacheDirectory + 'artwork/';
      
      const dirInfo = await FileSystem.getInfoAsync(cacheDir);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(cacheDir, { intermediates: true });
      }
      
      const fileUri = cacheDir + safeName;
      await FileSystem.writeAsStringAsync(fileUri, base64Art, { encoding: FileSystem.EncodingType.Base64 });

      // Sanity check for diagnostics
      const verifyInfo = await FileSystem.getInfoAsync(fileUri);
      console.log(`[Diagnostic] Saved artwork for ${uri.split('/').pop()}: ${verifyInfo.exists ? verifyInfo.size + ' bytes' : 'FAILED'} -> ${fileUri}`);
      
      memoryCache.set(uri, fileUri);
      AsyncStorage.setItem(ARTWORK_CACHE_PREFIX + uri, fileUri).catch(() => {});
      
      return fileUri;
    } else {
      memoryCache.set(uri, null);
      AsyncStorage.setItem(ARTWORK_CACHE_PREFIX + uri, 'NULL').catch(() => {});
      return null;
    }
  } catch (e) {
    console.log('[getEmbeddedArt] Error for', uri?.split('/').pop(), ':', e);
    memoryCache.set(uri, null);
    return null;
  }
  });
}