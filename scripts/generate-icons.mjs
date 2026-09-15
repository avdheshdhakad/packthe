import fs from 'fs';
import zlib from 'zlib';

function createPNG(width, height, r, g, b, hasShield = true) {
  // Create RGBA buffer
  const buffer = Buffer.alloc(width * height * 4);
  const cx = width / 2;
  const cy = height / 2;
  const radius = width * 0.44;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Background rounded shape
      const inCircle = dist <= radius;
      if (inCircle) {
        // Gradient blue
        const factor = y / height;
        const pr = Math.round(r + (37 - r) * factor);
        const pg = Math.round(g + (99 - g) * factor);
        const pb = Math.round(b + (235 - b) * factor);

        // Center checkmark/symbol check
        let isWhite = false;
        // Checkmark coordinates normalized
        const nx = (x - cx) / radius;
        const ny = (y - cy) / radius;
        
        // Simple tick mark line segments
        // Segment 1: (-0.35, 0.05) to (-0.05, 0.35)
        // Segment 2: (-0.05, 0.35) to (0.45, -0.3)
        if (nx >= -0.4 && nx <= 0.5 && ny >= -0.35 && ny <= 0.45) {
          // dist to seg 1
          const d1 = Math.abs((0.35 - 0.05)*nx - (-0.05 - (-0.35))*ny + (-0.35*0.35 - (-0.05)*0.05)) / Math.hypot(0.3, 0.3);
          // dist to seg 2
          const d2 = Math.abs((-0.3 - 0.35)*nx - (0.45 - (-0.05))*ny + (-0.05*(-0.3) - 0.45*0.35)) / Math.hypot(-0.65, 0.5);

          if ((d1 < 0.08 && nx <= 0.0 && ny >= 0.0) || (d2 < 0.08 && nx >= -0.1 && nx <= 0.45)) {
            isWhite = true;
          }
        }

        if (isWhite) {
          buffer[idx] = 255;
          buffer[idx + 1] = 255;
          buffer[idx + 2] = 255;
          buffer[idx + 3] = 255;
        } else {
          buffer[idx] = pr;
          buffer[idx + 1] = pg;
          buffer[idx + 2] = pb;
          buffer[idx + 3] = 255;
        }
      } else {
        buffer[idx] = 0;
        buffer[idx + 1] = 0;
        buffer[idx + 2] = 0;
        buffer[idx + 3] = 0;
      }
    }
  }

  // Build PNG chunks: Signature, IHDR, IDAT, IEND
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // Bit depth
  ihdrData[9] = 6; // Color type 6 (RGBA)
  ihdrData[10] = 0; // Compression
  ihdrData[11] = 0; // Filter
  ihdrData[12] = 0; // Interlace
  const ihdrChunk = makeChunk('IHDR', ihdrData);

  // Scanlines with filter byte 0
  const scanlines = Buffer.alloc(height * (width * 4 + 1));
  for (let y = 0; y < height; y++) {
    scanlines[y * (width * 4 + 1)] = 0; // No filter
    buffer.copy(
      scanlines,
      y * (width * 4 + 1) + 1,
      y * width * 4,
      (y + 1) * width * 4
    );
  }

  const compressed = zlib.deflateSync(scanlines);
  const idatChunk = makeChunk('IDAT', compressed);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function makeChunk(type, data) {
  const len = data.length;
  const chunk = Buffer.alloc(len + 12);
  chunk.writeUInt32BE(len, 0);
  chunk.write(type, 4, 4, 'ascii');
  data.copy(chunk, 8);
  const crc = crc32(chunk.subarray(4, len + 8));
  chunk.writeInt32BE(crc, len + 8);
  return chunk;
}

function crc32(buf) {
  let c = ~0;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let j = 0; j < 8; j++) {
      c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
    }
  }
  return ~c;
}

if (!fs.existsSync('public')) {
  fs.mkdirSync('public', { recursive: true });
}

// Generate PNG icons
fs.writeFileSync('public/pwa-192x192.png', createPNG(192, 192, 59, 130, 246));
fs.writeFileSync('public/pwa-512x512.png', createPNG(512, 512, 59, 130, 246));
fs.writeFileSync('public/pwa-maskable-512x512.png', createPNG(512, 512, 37, 99, 235));
fs.writeFileSync('public/apple-touch-icon.png', createPNG(180, 180, 59, 130, 246));
fs.writeFileSync('public/favicon.ico', createPNG(64, 64, 59, 130, 246));

console.log('Successfully generated all PWA & Mobile PNG icons in /public!');
