import React, { useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import { CropData } from '../types';

interface MemePreviewProps {
  imageSrc: string | null;
  crop: CropData | null;
  text: string;
  fontSize: number;
  textYOffset: number;
}

interface MemePreviewHandle {
  download: () => void;
}

/**
 * Renders text with word wrapping on a canvas. This function works for languages
 * with or without spaces between words by checking character by character.
 * @param ctx The canvas rendering context.
 * @param text The text to render.
 * @param x The horizontal center for the text.
 * @param y The vertical position for the bottom line of text.
 * @param maxWidth The maximum width for a line of text.
 * @param lineHeight The height of each line.
 */
const wrapText = (
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number
) => {
  const characters = text.split('');
  let line = '';
  const lines: string[] = [];

  for (let n = 0; n < characters.length; n++) {
    const testLine = line + characters[n];
    const metrics = ctx.measureText(testLine);
    const testWidth = metrics.width;
    if (testWidth > maxWidth && n > 0) {
      lines.push(line);
      line = characters[n];
    } else {
      line = testLine;
    }
  }
  lines.push(line);

  // Draw lines from the bottom up
  let currentY = y;
  for (let i = lines.length - 1; i >= 0; i--) {
    ctx.strokeText(lines[i], x, currentY);
    ctx.fillText(lines[i], x, currentY);
    currentY -= lineHeight;
  }
};


const MemePreview = forwardRef<MemePreviewHandle, MemePreviewProps>(({ imageSrc, crop, text, fontSize, textYOffset }, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const PREVIEW_SIZE = 512;

  useImperativeHandle(ref, () => ({
    download: () => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const link = document.createElement('a');
      link.download = 'meme.png';
      link.href = canvas.toDataURL('image/png');
      link.click();
    },
  }));

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx || !canvas) return;

    // Clear canvas
    ctx.fillStyle = '#2d3748'; // bg-gray-800
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (!imageSrc || !crop || crop.width === 0 || crop.height === 0) {
      ctx.fillStyle = '#a0aec0'; // text-gray-500
      ctx.font = '20px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Your meme will appear here', canvas.width / 2, canvas.height / 2);
      return;
    }

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = imageSrc;
    img.onload = () => {
      ctx.drawImage(
        img,
        crop.x,
        crop.y,
        crop.width,
        crop.height,
        0,
        0,
        canvas.width,
        canvas.height
      );
      
      // Draw text
      const calculatedFontSize = fontSize;
      ctx.font = `bold ${calculatedFontSize}px Impact, sans-serif`;
      ctx.fillStyle = 'white';
      ctx.strokeStyle = 'black';
      ctx.lineWidth = calculatedFontSize / 15;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      
      const x = canvas.width / 2;
      const y = canvas.height - textYOffset;
      const maxWidth = canvas.width * 0.9; // Use 90% of canvas width for text
      const lineHeight = calculatedFontSize * 1.2;

      wrapText(ctx, text, x, y, maxWidth, lineHeight);
    };
     img.onerror = () => {
        ctx.fillStyle = '#f56565'; // text-red-500
        ctx.font = '20px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Error loading image', canvas.width / 2, canvas.height / 2);
    }

  }, [imageSrc, crop, text, fontSize, textYOffset]);

  return <canvas ref={canvasRef} width={PREVIEW_SIZE} height={PREVIEW_SIZE} className="max-w-full max-h-full rounded-lg" />;
});

MemePreview.displayName = 'MemePreview';

export default MemePreview;