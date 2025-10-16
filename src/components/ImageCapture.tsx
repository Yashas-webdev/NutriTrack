import { useState, useRef } from 'react';
import { Camera, Upload, X } from 'lucide-react';

interface ImageCaptureProps {
  onImageCapture: (imageFile: File) => void;
}

export function ImageCapture({ onImageCapture }: ImageCaptureProps) {
  const [captureMode, setCaptureMode] = useState<'upload' | 'camera' | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setCaptureMode('camera');
    } catch (err) {
      alert('Unable to access camera. Please check permissions.');
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setCaptureMode(null);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0);
        canvas.toBlob((blob) => {
          if (blob) {
            const file = new File([blob], 'captured-meal.jpg', { type: 'image/jpeg' });
            onImageCapture(file);
            stopCamera();
          }
        }, 'image/jpeg', 0.95);
      }
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      onImageCapture(file);
      setCaptureMode(null);
    }
  };

  if (captureMode === 'camera' && stream) {
    return (
      <div className="fixed inset-0 bg-black z-50 flex flex-col">
        <div className="flex-1 relative">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />
          <canvas ref={canvasRef} className="hidden" />
        </div>

        <div className="bg-gray-900 p-6 flex justify-center gap-4">
          <button
            onClick={stopCamera}
            className="bg-gray-700 hover:bg-gray-600 text-white p-4 rounded-full transition"
          >
            <X className="w-6 h-6" />
          </button>
          <button
            onClick={capturePhoto}
            className="bg-emerald-500 hover:bg-emerald-600 text-white px-8 py-4 rounded-full transition font-medium"
          >
            Capture Photo
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">
        Capture Your Meal
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <button
          onClick={startCamera}
          className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-gray-300 rounded-xl hover:border-emerald-500 hover:bg-emerald-50 transition group"
        >
          <Camera className="w-12 h-12 text-gray-400 group-hover:text-emerald-500 mb-3 transition" />
          <span className="text-gray-700 font-medium">Take Photo</span>
          <span className="text-sm text-gray-500 mt-1">Use your camera</span>
        </button>

        <label className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-gray-300 rounded-xl hover:border-emerald-500 hover:bg-emerald-50 transition cursor-pointer group">
          <Upload className="w-12 h-12 text-gray-400 group-hover:text-emerald-500 mb-3 transition" />
          <span className="text-gray-700 font-medium">Upload Image</span>
          <span className="text-sm text-gray-500 mt-1">From your device</span>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            className="hidden"
          />
        </label>
      </div>
    </div>
  );
}
