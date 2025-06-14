
import { useState, useRef } from 'react';

interface UseDetectionLoopProps {
  videoRef: React.RefObject<HTMLVideoElement>;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  isModelLoaded: boolean;
  model: any;
  onDetectionResult: (result: string, confidence: number) => void;
  onPlayWarningSound: () => void;
  onError: (error: string) => void;
}

export const useDetectionLoop = ({
  videoRef,
  canvasRef,
  isModelLoaded,
  model,
  onDetectionResult,
  onPlayWarningSound,
  onError
}: UseDetectionLoopProps) => {
  const [isDetecting, setIsDetecting] = useState(false);
  const detectionLoopRef = useRef<number>(0);

  const processFrame = async () => {
    if (!videoRef.current || !canvasRef.current || !isModelLoaded || !model) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    ctx.drawImage(videoRef.current, 0, 0);

    try {
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      
      const features = new Float32Array(canvas.width * canvas.height * 3);
      let featureIndex = 0;
      
      for (let i = 0; i < imageData.data.length; i += 4) {
        const r = imageData.data[i] / 255.0;
        const g = imageData.data[i + 1] / 255.0;
        const b = imageData.data[i + 2] / 255.0;
        
        features[featureIndex++] = r;
        features[featureIndex++] = g;
        features[featureIndex++] = b;
      }
      
      let trashDetected = false;
      let maxConfidence = 0;
      
      if (model && model.classify) {
        const result = await model.classify(features);
        console.log('Edge Impulse result:', result);
        
        if (result && result.classification) {
          const trashClass = result.classification['Trash']; 
          if (trashClass && trashClass.value > 0.6) {
            trashDetected = true;
            maxConfidence = trashClass.value;
          }
        }
      }
      
      if (trashDetected) {
        onDetectionResult(`🗑️ TRASH DETECTED! (${(maxConfidence * 100).toFixed(1)}% confidence)`, maxConfidence);
        onPlayWarningSound();
      } else {
        onDetectionResult('No trash detected - area clear', maxConfidence);
      }
      
    } catch (err) {
      console.error('Frame processing error:', err);
      onError('Error processing frame');
    }
  };

  const toggleDetection = () => {
    if (isDetecting) {
      setIsDetecting(false);
      if (detectionLoopRef.current) {
        cancelAnimationFrame(detectionLoopRef.current);
      }
    } else {
      setIsDetecting(true);
      const detect = () => {
        if (isDetecting) {
          processFrame();
          detectionLoopRef.current = requestAnimationFrame(detect);
        }
      };
      detect();
    }
  };

  return {
    isDetecting,
    toggleDetection
  };
};
