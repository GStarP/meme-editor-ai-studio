import React, { useState, useRef, useEffect, useCallback } from 'react';
import { CropData } from '../types';

interface ImageCropperProps {
  src: string;
  onCropChange: (crop: CropData) => void;
}

const MIN_CROP_SIZE = 50;

const ImageCropper: React.FC<ImageCropperProps> = ({ src, onCropChange }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const [cropBox, setCropBox] = useState({ x: 0, y: 0, width: MIN_CROP_SIZE, height: MIN_CROP_SIZE });
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState({ x: 1, y: 1 });
  const [imageOffset, setImageOffset] = useState({ x: 0, y: 0 });

  const convertDisplayToSourceCrop = useCallback((displayCrop: typeof cropBox) => {
    // Convert coordinates from container-relative to image-relative before scaling
    return {
      x: (displayCrop.x - imageOffset.x) * scale.x,
      y: (displayCrop.y - imageOffset.y) * scale.y,
      width: displayCrop.width * scale.x,
      height: displayCrop.height * scale.y,
    };
  }, [scale, imageOffset]);

  useEffect(() => {
    if (cropBox.width > 0 && imageRef.current?.complete) {
      onCropChange(convertDisplayToSourceCrop(cropBox));
    }
  }, [cropBox, onCropChange, convertDisplayToSourceCrop]);

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    const container = containerRef.current;
    if (!container) return;

    const { naturalWidth, naturalHeight } = img;
    const { clientWidth: renderedWidth, clientHeight: renderedHeight } = img;
    const { clientWidth: containerWidth, clientHeight: containerHeight } = container;

    if (renderedWidth === 0 || renderedHeight === 0) return;

    setScale({ x: naturalWidth / renderedWidth, y: naturalHeight / renderedHeight });
    
    // Calculate the image's offset within the flex container
    const offsetX = (containerWidth - renderedWidth) / 2;
    const offsetY = (containerHeight - renderedHeight) / 2;
    setImageOffset({ x: offsetX, y: offsetY });
    
    const size = Math.min(renderedWidth, renderedHeight) * 0.8;
    const initialCrop = {
      x: offsetX + (renderedWidth - size) / 2,
      y: offsetY + (renderedHeight - size) / 2,
      width: size,
      height: size,
    };
    setCropBox(initialCrop);
  };
  
  const getEventPos = useCallback((e: MouseEvent | React.MouseEvent | TouchEvent | React.TouchEvent) => {
    if (!containerRef.current) return { x: 0, y: 0 };
    const rect = containerRef.current.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };
  }, []);

  const handleInteractionStart = useCallback((e: React.MouseEvent | React.TouchEvent, action: 'drag' | 'resize') => {
    e.preventDefault();
    e.stopPropagation();
    const pos = getEventPos(e);
    setStartPos(pos);
    if (action === 'drag') {
      setIsDragging(true);
    } else {
      setIsResizing(true);
    }
  }, [getEventPos]);

  const handleInteractionMove = useCallback((e: MouseEvent | TouchEvent) => {
    if (!isDragging && !isResizing) return;
    if (e.cancelable) e.preventDefault();
    e.stopPropagation();
    
    const img = imageRef.current;
    if (!img) return;

    const pos = getEventPos(e);
    const deltaX = pos.x - startPos.x;
    const deltaY = pos.y - startPos.y;
    
    const { clientWidth: imageClientWidth, clientHeight: imageClientHeight } = img;

    setCropBox(prev => {
      let newCrop = { ...prev };
      if (isResizing) {
        const delta = Math.max(deltaX, deltaY);
        let newSize = prev.width + delta;
        
        // Clamp resize against minimum size and image boundaries
        newSize = Math.max(MIN_CROP_SIZE, newSize);
        const maxAllowedSizeX = (imageOffset.x + imageClientWidth) - prev.x;
        const maxAllowedSizeY = (imageOffset.y + imageClientHeight) - prev.y;
        newSize = Math.min(newSize, maxAllowedSizeX, maxAllowedSizeY);

        newCrop.width = newSize;
        newCrop.height = newSize;
      } else if (isDragging) {
        newCrop.x = prev.x + deltaX;
        newCrop.y = prev.y + deltaY;
      }
      
      // Enforce boundaries for the crop box based on image offset and dimensions
      const minX = imageOffset.x;
      const minY = imageOffset.y;
      const maxX = imageOffset.x + imageClientWidth - newCrop.width;
      const maxY = imageOffset.y + imageClientHeight - newCrop.height;
      
      newCrop.x = Math.max(minX, Math.min(newCrop.x, maxX));
      newCrop.y = Math.max(minY, Math.min(newCrop.y, maxY));
      
      return newCrop;
    });

    setStartPos(pos);
  }, [isDragging, isResizing, startPos, imageOffset, getEventPos]);

  const handleInteractionEnd = useCallback(() => {
    setIsDragging(false);
    setIsResizing(false);
  }, []);

  useEffect(() => {
    if (isDragging || isResizing) {
      window.addEventListener('mousemove', handleInteractionMove);
      window.addEventListener('mouseup', handleInteractionEnd);
      window.addEventListener('touchmove', handleInteractionMove, { passive: false });
      window.addEventListener('touchend', handleInteractionEnd);
      window.addEventListener('touchcancel', handleInteractionEnd);
      return () => {
        window.removeEventListener('mousemove', handleInteractionMove);
        window.removeEventListener('mouseup', handleInteractionEnd);
        window.removeEventListener('touchmove', handleInteractionMove);
        window.removeEventListener('touchend', handleInteractionEnd);
        window.removeEventListener('touchcancel', handleInteractionEnd);
      };
    }
  }, [isDragging, isResizing, handleInteractionMove, handleInteractionEnd]);

  return (
    <div ref={containerRef} className="relative w-full h-full select-none flex items-center justify-center">
      <img
        ref={imageRef}
        src={src}
        onLoad={handleImageLoad}
        alt="Upload preview"
        className="max-w-full max-h-full object-contain"
        draggable={false}
      />
      
      {/* Overlay - show only when image is loaded */}
      {imageRef.current?.complete && cropBox.width > 0 && (
        <>
            <div
                className="absolute top-0 left-0 w-full h-full bg-black/50"
                style={{
                clipPath: `path('M0 0 H${containerRef.current?.clientWidth ?? 0} V${containerRef.current?.clientHeight ?? 0} H0 Z M${cropBox.x} ${cropBox.y} H${cropBox.x + cropBox.width} V${cropBox.y + cropBox.height} H${cropBox.x} Z')`,
                clipRule: 'evenodd',
                }}
            ></div>

            {/* Crop Box */}
            <div
                className="absolute border-2 border-dashed border-white cursor-move"
                style={{
                left: cropBox.x,
                top: cropBox.y,
                width: cropBox.width,
                height: cropBox.height,
                touchAction: 'none'
                }}
                onMouseDown={(e) => handleInteractionStart(e, 'drag')}
                onTouchStart={(e) => handleInteractionStart(e, 'drag')}
            >
                {/* Resize Handle */}
                <div
                className="absolute -bottom-2 -right-2 w-4 h-4 bg-white rounded-full cursor-nwse-resize"
                onMouseDown={(e) => handleInteractionStart(e, 'resize')}
                onTouchStart={(e) => handleInteractionStart(e, 'resize')}
                ></div>
            </div>
        </>
      )}
    </div>
  );
};

export default ImageCropper;
