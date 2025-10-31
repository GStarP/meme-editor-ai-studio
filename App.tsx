import React, { useState, useRef, useCallback, useEffect } from 'react';
import ImageCropper from './components/ImageCropper';
import MemePreview from './components/MemePreview';
import FloatingPreview from './components/FloatingPreview';
import { CropData } from './types';

// The GoogleGenAI import is now done dynamically inside the event handler.

const isInAIStudio = !!window.aistudio

// Fix: Changed function declaration to a const with an explicit React.FC type to fix type inference issue.
const App: React.FC = () => {
  const [sourceImage, setSourceImage] = useState<string | null>(null);
  const [memeText, setMemeText] = useState<string>('你好呀');
  const [fontSize, setFontSize] = useState<number>(51);
  const [textYOffset, setTextYOffset] = useState<number>(30);
  const [crop, setCrop] = useState<CropData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isAiModeEnabled, setIsAiModeEnabled] = useState(false);
  const [isVerifyingKey, setIsVerifyingKey] = useState(false);
  const [showFloatingPreview, setShowFloatingPreview] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const memePreviewRef = useRef<{ download: () => void }>(null);
  const previewTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024); // lg breakpoint in tailwind
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError('Please upload a valid image file.');
        return;
      }
      setError(null);
      const reader = new FileReader();
      reader.onload = () => {
        setSourceImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleDownloadClick = () => {
    memePreviewRef.current?.download();
  };
  
  const onCropChange = useCallback((newCrop: CropData) => {
    setCrop(newCrop);
    if (isMobile) {
      setShowFloatingPreview(true);
      if (previewTimeoutRef.current) {
        window.clearTimeout(previewTimeoutRef.current);
      }
      previewTimeoutRef.current = window.setTimeout(() => {
        setShowFloatingPreview(false);
      }, 2500); // Hide after 2.5 seconds
    }
  }, [isMobile]);

  const handleAiModeToggle = async () => {
    if (isAiModeEnabled) {
      setIsAiModeEnabled(false);
      return;
    }

    setIsVerifyingKey(true);
    try {
      const { GoogleGenAI } = await import('@google/genai');
      // Initialize with the API key from the environment.
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      // A simple test call to ensure the service is available.
      await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: 'hello' });
      
      setIsAiModeEnabled(true);
    } catch (error) {
      console.error("Failed to connect to Gemini service:", error);
      window.alert("Could not enable AI Mode. The Gemini service might be unavailable. Please check your connection and try again.");
      setIsAiModeEnabled(false);
    } finally {
      setIsVerifyingKey(false);
    }
  };


  return (
    <div className="min-h-screen bg-gray-900 text-white font-sans">
      <FloatingPreview
        isVisible={showFloatingPreview}
        imageSrc={sourceImage}
        crop={crop}
        text={memeText}
        fontSize={fontSize}
        textYOffset={textYOffset}
      />
      <header className="bg-gray-800/80 backdrop-blur-sm sticky top-0 z-10 shadow-lg">
        <nav className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <h1 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">
            Meme Editor
          </h1>
          {
            isInAIStudio && <div className="flex items-center space-x-3">
              <span className={`text-sm font-medium ${isAiModeEnabled ? 'text-indigo-400' : 'text-gray-400'}`}>
                AI Mode
              </span>
              <label htmlFor="ai-toggle" className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  id="ai-toggle" 
                  className="sr-only peer" 
                  checked={isAiModeEnabled}
                  onChange={handleAiModeToggle}
                  disabled={isVerifyingKey}
                />
                <div className="w-11 h-6 bg-gray-600 rounded-full peer peer-focus:ring-2 peer-focus:ring-indigo-500 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600 peer-disabled:opacity-50 peer-disabled:cursor-wait"></div>
                {isVerifyingKey && <div className="absolute -left-1 -top-1 w-8 h-8 rounded-full border-2 border-transparent border-t-indigo-400 animate-spin"></div>}
              </label>
            </div>
          }
        </nav>
      </header>
      
      <main className="p-4 sm:p-6 lg:p-8">
        <div className="container mx-auto max-w-7xl">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Panel: Controls */}
            <div className="bg-gray-800 p-6 rounded-xl shadow-lg flex flex-col gap-6">
              <h2 className="text-2xl font-semibold border-b border-gray-700 pb-3">1. Upload & Crop</h2>
              
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
                accept="image/*"
              />
              <button
                onClick={handleUploadClick}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-lg transition-transform transform hover:scale-105"
              >
                {sourceImage ? 'Change Image' : 'Upload Image'}
              </button>
              {error && <p className="text-red-400 text-center">{error}</p>}
              
              <div className="w-full aspect-square bg-gray-900 rounded-lg flex items-center justify-center overflow-hidden">
                {sourceImage ? (
                  <ImageCropper src={sourceImage} onCropChange={onCropChange} />
                ) : (
                  <p className="text-gray-500">Uploaded image will appear here</p>
                )}
              </div>

              <div>
                <h2 className="text-2xl font-semibold border-b border-gray-700 pb-3 mb-4">2. Add Text</h2>
                <div className="space-y-4">
                  <input
                    type="text"
                    value={memeText}
                    onChange={(e) => setMemeText(e.target.value)}
                    placeholder="Enter your meme text"
                    className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="font-size" className="block text-sm font-medium text-gray-400 mb-2">Font Size</label>
                      <select
                        id="font-size"
                        value={fontSize}
                        onChange={(e) => setFontSize(Number(e.target.value))}
                        className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value={42}>Small (42px)</option>
                        <option value={51}>Medium (51px)</option>
                        <option value={64}>Large (64px)</option>
                      </select>
                    </div>
                    <div>
                      <label htmlFor="text-offset" className="block text-sm font-medium text-gray-400 mb-2">
                        Vertical Position ({textYOffset}px)
                      </label>
                      <input
                        id="text-offset"
                        type="range"
                        min="10"
                        max="100"
                        value={textYOffset}
                        onChange={(e) => setTextYOffset(Number(e.target.value))}
                        className="w-full h-3 bg-gray-600 rounded-lg appearance-none cursor-pointer align-middle mt-4"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Panel: Preview & Download */}
            <div className="bg-gray-800 p-6 rounded-xl shadow-lg flex flex-col gap-6">
              <h2 className="text-2xl font-semibold border-b border-gray-700 pb-3">3. Preview & Download</h2>
              <div className="w-full aspect-square bg-gray-900 rounded-lg flex items-center justify-center">
                <MemePreview 
                    ref={memePreviewRef} 
                    imageSrc={sourceImage} 
                    crop={crop} 
                    text={memeText}
                    fontSize={fontSize}
                    textYOffset={textYOffset}
                  />
              </div>
              <button
                onClick={handleDownloadClick}
                disabled={!sourceImage || !crop}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg transition-transform transform hover:scale-105 disabled:bg-gray-600 disabled:cursor-not-allowed disabled:transform-none"
              >
                Download Meme
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
