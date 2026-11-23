import { DUBOIS_SURFACES } from '../contracts/tokens.js';

function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Serializes a chart's SVG element with resolved archival background and
 * namespaces so it opens cleanly in Illustrator, Figma, or browsers.
 */
export function serializeSvgForExport(svg: SVGSVGElement): string {
  const clone = svg.cloneNode(true) as SVGSVGElement;
  const rect = svg.getBoundingClientRect();
  const width = Math.max(1, Math.round(rect.width || 800));
  const height = Math.max(1, Math.round(rect.height || 500));

  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  if (!clone.getAttribute('viewBox')) {
    clone.setAttribute('viewBox', `0 0 ${width} ${height}`);
  }
  clone.setAttribute('width', String(width));
  clone.setAttribute('height', String(height));

  const bg = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
  bg.setAttribute('x', '0');
  bg.setAttribute('y', '0');
  bg.setAttribute('width', '100%');
  bg.setAttribute('height', '100%');
  bg.setAttribute('fill', DUBOIS_SURFACES.parchment);
  clone.insertBefore(bg, clone.firstChild);

  return new XMLSerializer().serializeToString(clone);
}

export function exportSvgElement(
  svg: SVGSVGElement,
  filename = 'dubois-plate.svg'
): void {
  const xml = serializeSvgForExport(svg);
  const blob = new Blob([xml], { type: 'image/svg+xml;charset=utf-8' });
  triggerDownload(blob, filename.endsWith('.svg') ? filename : `${filename}.svg`);
}

export async function exportSvgAsPng(
  svg: SVGSVGElement,
  filename = 'dubois-plate.png',
  pixelRatio = 2
): Promise<void> {
  const xml = serializeSvgForExport(svg);
  const rect = svg.getBoundingClientRect();
  const width = Math.max(1, Math.round(rect.width || 800));
  const height = Math.max(1, Math.round(rect.height || 500));

  const svgBlob = new Blob([xml], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(svgBlob);

  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error('Failed to load serialized SVG'));
      image.src = url;
    });

    const canvas = document.createElement('canvas');
    canvas.width = width * pixelRatio;
    canvas.height = height * pixelRatio;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.scale(pixelRatio, pixelRatio);
    ctx.fillStyle = DUBOIS_SURFACES.parchment;
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(img, 0, 0, width, height);

    const pngBlob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, 'image/png')
    );
    if (pngBlob) {
      triggerDownload(
        pngBlob,
        filename.endsWith('.png') ? filename : `${filename}.png`
      );
    }
  } finally {
    URL.revokeObjectURL(url);
  }
}
