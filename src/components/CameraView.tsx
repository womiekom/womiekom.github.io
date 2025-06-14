
import React from 'react';
import { Button } from '@/components/ui/button';
import { Camera } from 'lucide-react';

interface CameraViewProps {
  videoRef: React.RefObject<HTMLVideoElement>;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  isCameraActive: boolean;
  isDetecting: boolean;
  isModelLoaded: boolean;
  onStartCamera: () => void;
  onStopCamera: () => void;
  onToggleDetection: () => void;
}

const CameraView: React.FC<CameraViewProps> = ({
  videoRef,
  canvasRef,
  isCameraActive,
  isDetecting,
  isModelLoaded,
  onStartCamera,
  onStopCamera,
  onToggleDetection
}) => {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold flex items-center gap-2">
        <Camera className="h-5 w-5" />
        Camera View
      </h2>
      
      <div className="relative bg-muted rounded-lg overflow-hidden">
        <video
          ref={videoRef}
          className="w-full h-64 object-cover"
          playsInline
          muted
        />
        <canvas
          ref={canvasRef}
          className="hidden"
        />
        
        {!isCameraActive && (
          <div className="absolute inset-0 flex items-center justify-center bg-muted/80">
            <p className="text-muted-foreground">Camera not started</p>
          </div>
        )}
      </div>

      <div className="flex gap-2 flex-wrap">
        <Button 
          onClick={isCameraActive ? onStopCamera : onStartCamera}
          variant={isCameraActive ? "destructive" : "default"}
        >
          {isCameraActive ? "Stop Camera" : "Start Camera"}
        </Button>
        
        <Button
          onClick={onToggleDetection}
          disabled={!isCameraActive || !isModelLoaded}
          variant={isDetecting ? "destructive" : "default"}
        >
          {isDetecting ? "Stop Detection" : "Start Detection"}
        </Button>
      </div>
    </div>
  );
};

export default CameraView;
