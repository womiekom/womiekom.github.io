
import React, { useRef, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Camera, AlertTriangle, Volume2, VolumeX } from 'lucide-react';

interface ObjectDetectorProps {
  wasmUrl?: string;
  jsUrl?: string;
}

const ObjectDetector: React.FC<ObjectDetectorProps> = ({ 
  wasmUrl = '/edge-impulse-standalone.wasm',
  jsUrl = '/edge-impulse-standalone.js'
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const [isDetecting, setIsDetecting] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [detectionResult, setDetectionResult] = useState<string>('');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [error, setError] = useState<string>('');
  const audioContextRef = useRef<AudioContext | null>(null);

  // Initialize audio context for warning sounds
  useEffect(() => {
    audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  // Load Edge Impulse model
  const loadModel = async () => {
    try {
      setError('');
      console.log('Loading Edge Impulse model...');
      
      // Load the JavaScript wrapper
      const script = document.createElement('script');
      script.src = jsUrl;
      script.onload = () => {
        console.log('Edge Impulse JS loaded');
        setIsModelLoaded(true);
      };
      script.onerror = () => {
        setError('Failed to load Edge Impulse JavaScript file');
      };
      document.head.appendChild(script);
      
    } catch (err) {
      setError(`Failed to load model: ${err}`);
      console.error('Model loading error:', err);
    }
  };

  // Start camera
  const startCamera = async () => {
    try {
      setError('');
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: 640, height: 480 } 
      });
      
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

  // Stop camera
  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
    setIsDetecting(false);
  };

  // Play warning sound
  const playWarningSound = () => {
    if (!soundEnabled || !audioContextRef.current) return;
    
    try {
      const oscillator = audioContextRef.current.createOscillator();
      const gainNode = audioContextRef.current.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContextRef.current.destination);
      
      oscillator.frequency.setValueAtTime(800, audioContextRef.current.currentTime);
      oscillator.frequency.setValueAtTime(600, audioContextRef.current.currentTime + 0.1);
      oscillator.frequency.setValueAtTime(800, audioContextRef.current.currentTime + 0.2);
      
      gainNode.gain.setValueAtTime(0.3, audioContextRef.current.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContextRef.current.currentTime + 0.3);
      
      oscillator.start(audioContextRef.current.currentTime);
      oscillator.stop(audioContextRef.current.currentTime + 0.3);
    } catch (err) {
      console.error('Sound playback error:', err);
    }
  };

  // Process video frame with Edge Impulse
  const processFrame = async () => {
    if (!videoRef.current || !canvasRef.current || !isModelLoaded) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Draw current video frame to canvas
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    ctx.drawImage(videoRef.current, 0, 0);

    try {
      // Get image data for Edge Impulse
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      
      // Here you would integrate with your specific Edge Impulse model
      // This is a placeholder - you'll need to use the specific API from your Edge Impulse export
      console.log('Processing frame with Edge Impulse model...');
      
      // Example detection result (replace with actual Edge Impulse integration)
      const mockDetection = Math.random() > 0.8 ? 'Object detected!' : 'No object detected';
      setDetectionResult(mockDetection);
      
      if (mockDetection.includes('detected')) {
        playWarningSound();
      }
      
    } catch (err) {
      console.error('Frame processing error:', err);
    }
  };

  // Start/stop detection
  const toggleDetection = () => {
    if (isDetecting) {
      setIsDetecting(false);
    } else {
      setIsDetecting(true);
      // Start detection loop
      const detect = () => {
        if (isDetecting) {
          processFrame();
          requestAnimationFrame(detect);
        }
      };
      detect();
    }
  };

  // Load model on component mount
  useEffect(() => {
    loadModel();
  }, []);

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">Object Detection Warning System</h1>
        <p className="text-muted-foreground">
          Powered by your custom Edge Impulse model
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Camera View */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Camera className="h-5 w-5" />
            Camera Feed
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

          <div className="flex gap-2">
            <Button 
              onClick={isCameraActive ? stopCamera : startCamera}
              variant={isCameraActive ? "destructive" : "default"}
            >
              {isCameraActive ? "Stop Camera" : "Start Camera"}
            </Button>
            
            <Button
              onClick={toggleDetection}
              disabled={!isCameraActive || !isModelLoaded}
              variant={isDetecting ? "destructive" : "default"}
            >
              {isDetecting ? "Stop Detection" : "Start Detection"}
            </Button>
          </div>
        </div>

        {/* Controls & Status */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Status & Controls</h2>
          
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
                {isDetecting ? 'Running' : 'Stopped'}
              </span>
            </div>
            
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <span>Warning Sounds:</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSoundEnabled(!soundEnabled)}
              >
                {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          {detectionResult && (
            <Alert className={detectionResult.includes('detected') ? 'border-red-500 bg-red-50' : ''}>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="font-medium">
                {detectionResult}
              </AlertDescription>
            </Alert>
          )}
        </div>
      </div>

      <div className="text-sm text-muted-foreground">
        <p><strong>Instructions:</strong></p>
        <ol className="list-decimal list-inside space-y-1 mt-2">
          <li>Upload your Edge Impulse files (edge-impulse-standalone.js and .wasm) to the public folder</li>
          <li>Start the camera to begin video feed</li>
          <li>Click "Start Detection" to begin object detection</li>
          <li>When objects are detected, you'll hear warning sounds and see alerts</li>
        </ol>
      </div>
    </div>
  );
};

export default ObjectDetector;
