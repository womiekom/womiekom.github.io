
import React, { useRef, useState } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';
import { useEdgeImpulseModel } from '@/hooks/useEdgeImpulseModel';
import { useCameraManagement } from '@/hooks/useCameraManagement';
import { useAudioManagement } from '@/hooks/useAudioManagement';
import { useDetectionLoop } from '@/hooks/useDetectionLoop';
import CameraView from './CameraView';
import DetectionStatus from './DetectionStatus';
import SetupInstructions from './SetupInstructions';

interface ObjectDetectorProps {
  wasmUrl?: string;
  jsUrl?: string;
}

const ObjectDetector: React.FC<ObjectDetectorProps> = ({ 
  wasmUrl = '/edge-impulse-standalone.wasm',
  jsUrl = '/edge-impulse-standalone.js'
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [detectionResult, setDetectionResult] = useState<string>('');
  const [confidence, setConfidence] = useState(0);

  const { isModelLoaded, error: modelError, setError: setModelError, modelRef } = useEdgeImpulseModel({ wasmUrl, jsUrl });
  const { isCameraActive, setIsCameraActive, videoRef, startCamera, stopCamera, error: cameraError, setError: setCameraError } = useCameraManagement();
  const { soundEnabled, setSoundEnabled, playWarningSound } = useAudioManagement();

  const handleDetectionResult = (result: string, conf: number) => {
    setDetectionResult(result);
    setConfidence(conf);
  };

  const handleError = (error: string) => {
    setModelError(error);
  };

  const { isDetecting, toggleDetection } = useDetectionLoop({
    videoRef,
    canvasRef,
    isModelLoaded,
    model: modelRef,
    onDetectionResult: handleDetectionResult,
    onPlayWarningSound: playWarningSound,
    onError: handleError
  });

  const handleStopCamera = () => {
    stopCamera();
    setIsDetecting(false);
  };

  const error = modelError || cameraError;

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">🗑️ Trash Detection System</h1>
        <p className="text-muted-foreground">
          AI-powered trash detection using your trained Edge Impulse model
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <CameraView
          videoRef={videoRef}
          canvasRef={canvasRef}
          isCameraActive={isCameraActive}
          isDetecting={isDetecting}
          isModelLoaded={isModelLoaded}
          onStartCamera={startCamera}
          onStopCamera={handleStopCamera}
          onToggleDetection={toggleDetection}
        />

        <DetectionStatus
          isModelLoaded={isModelLoaded}
          isCameraActive={isCameraActive}
          isDetecting={isDetecting}
          soundEnabled={soundEnabled}
          confidence={confidence}
          detectionResult={detectionResult}
          onToggleSound={() => setSoundEnabled(!soundEnabled)}
        />
      </div>

      <SetupInstructions />
    </div>
  );
};

export default ObjectDetector;
