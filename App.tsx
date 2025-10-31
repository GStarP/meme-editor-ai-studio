import React, { useState, useRef, useCallback } from 'react';
import ImageCropper from './components/ImageCropper';
import MemePreview from './components/MemePreview';
import { CropData } from './types';

function App() {
  const [sourceImage, setSourceImage] = useState<string | null>(null);
  const [memeText, setMemeText] = useState<string>('你好呀');
  const [fontSize, setFontSize] = useState<number>(51);
  const [textYOffset, setTextYOffset] = useState<number>(30);
  const [crop, setCrop] = useState<CropData | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const memePreviewRef = useRef<{ download: () => void }>(null);

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
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 text-white font-sans p-4 sm:p-6 lg:p-8">
      <div className="container mx-auto max-w-7xl">
        <header className="text-center mb-8">
          <h1 className="text-4xl sm:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">
            Meme Generator
          </h1>
          <p className="text-gray-400 mt-2 text-lg">Create your own meme in seconds!</p>
        </header>

        <main className="grid grid-cols-1 lg:grid-cols-2 gap-8">
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
            
            <div className="w-full aspect-square bg-gray-700/50 rounded-lg flex items-center justify-center overflow-hidden">
              {sourceImage ? (
                <ImageCropper src={sourceImage} onCropChange={onCropChange} />
              ) : (
                 <p className="text-gray-500">Image preview will appear here</p>
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
        </main>
      </div>
    </div>
  );
}

export default App;