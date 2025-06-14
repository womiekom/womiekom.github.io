
import React from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, Volume2, VolumeX } from 'lucide-react';

interface DetectionStatusProps {
  isModelLoaded: boolean;
  isCameraActive: boolean;
  isDetecting: boolean;
  soundEnabled: boolean;
  confidence: number;
  detectionResult: string;
  onToggleSound: () => void;
}

const DetectionStatus: React.FC<DetectionStatusProps> = ({
  isModelLoaded,
  isCameraActive,
  isDetecting,
  soundEnabled,
  confidence,
  detectionResult,
  onToggleSound
}) => {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Detection Status</h2>
      
      <div className="space-y-3">
        <div className="flex items-center justify-between p-3 border rounded-lg">
          <span>Model Status:</span>
          <span className={`font-medium ${isModelLoaded ? 'text-green-600' : 'text-yellow-600'}`}>
            {isModelLoaded ? 'Loaded' : 'Loading...'}
          </span>
        </div>
        
        <div className="flex items-center justify-between p-3 border rounded-lg">
          <span>Camera Status:</span>
          <span className={`font-medium ${isCameraActive ? 'text-green-600' : 'text-muted-foreground'}`}>
            {isCameraActive ? 'Active' : 'Inactive'}
          </span>
        </div>
        
        <div className="flex items-center justify-between p-3 border rounded-lg">
          <span>Detection Status:</span>
          <span className={`font-medium ${isDetecting ? 'text-green-600' : 'text-muted-foreground'}`}>
            {isDetecting ? 'Scanning...' : 'Stopped'}
          </span>
        </div>
        
        <div className="flex items-center justify-between p-3 border rounded-lg">
          <span>Warning Sounds:</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleSound}
          >
            {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
          </Button>
        </div>

        {confidence > 0 && (
          <div className="p-3 border rounded-lg">
            <span className="text-sm text-muted-foreground">Confidence:</span>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
              <div 
                className="bg-red-500 h-2 rounded-full transition-all duration-300" 
                style={{ width: `${confidence * 100}%` }}
              ></div>
            </div>
            <span className="text-sm font-medium">{(confidence * 100).toFixed(1)}%</span>
          </div>
        )}
      </div>

      {detectionResult && (
        <Alert className={detectionResult.includes('DETECTED') ? 'border-red-500 bg-red-50' : 'border-green-500 bg-green-50'}>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="font-medium">
            {detectionResult}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default DetectionStatus;
