
import { useState, useRef } from 'react';

export const useCameraManagement = () => {
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [error, setError] = useState<string>('');
  const videoRef = useRef<HTMLVideoElement>(null);

  const startCamera = async () => {
    try {
      setError('');
      const constraints = { 
        video: { 
          width: 640, 
          height: 480,
          facingMode: 'environment'
        } 
      };
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setIsCameraActive(true);
        console.log('Camera started successfully');
      }
    } catch (err) {
      setError('Failed to access camera. Please ensure camera permissions are granted.');
      console.error('Camera error:', err);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  };

  return {
    isCameraActive,
    setIsCameraActive,
    videoRef,
    startCamera,
    stopCamera,
    error,
    setError
  };
};
