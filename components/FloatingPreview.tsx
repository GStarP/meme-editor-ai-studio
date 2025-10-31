import React, { useRef, useEffect } from 'react';
import { CropData } from '../types';

interface FloatingPreviewProps {
  isVisible: boolean;
  imageSrc: string | null;
  crop: CropData | null;
  text: string;
  fontSize: number;
  textYOffset: number;
}

const PREVIEW_SIZE = 176;
const BASE_SIZE = 512; // The size of the main preview canvas for scaling
const scaleFactor = PREVIEW_SIZE / BASE_SIZE;

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

  let currentY = y;
  for (let i = lines.length - 1; i >= 0; i--) {
    ctx.strokeText(lines[i], x, currentY);
    ctx.fillText(lines[i], x, currentY);
    currentY -= lineHeight;
  }
};


const FloatingPreview: React.FC<FloatingPreviewProps> = ({ isVisible, imageSrc, crop, text, fontSize, textYOffset }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx || !canvas || !imageSrc || !crop || crop.width === 0 || crop.height === 0) {
      return;
    }

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = imageSrc;
    img.onload = () => {
      ctx.fillStyle = '#1a202c';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
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
      
      const scaledFontSize = fontSize * scaleFactor;
      ctx.font = `bold ${scaledFontSize}px Impact, sans-serif`;
      ctx.fillStyle = 'white';
      ctx.strokeStyle = 'black';
      ctx.lineWidth = scaledFontSize / 15;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      
      const x = canvas.width / 2;
      const y = canvas.height - (textYOffset * scaleFactor);
      const maxWidth = canvas.width * 0.9;
      const lineHeight = scaledFontSize * 1.2;

      wrapText(ctx, text, x, y, maxWidth, lineHeight);
    };

  }, [imageSrc, crop, text, fontSize, textYOffset, isVisible]);

  return (
    <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 transition-all duration-300 ease-in-out ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-8'} pointer-events-none`}>
        <canvas 
            ref={canvasRef} 
            width={PREVIEW_SIZE} 
            height={PREVIEW_SIZE} 
            className="rounded-lg shadow-2xl border-2 border-gray-700" 
        />
    </div>
  );
};

export default FloatingPreview;