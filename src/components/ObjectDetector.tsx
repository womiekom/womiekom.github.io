
import React, { useRef, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Camera, AlertTriangle, Volume2, VolumeX, Flashlight } from 'lucide-react';

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
  const [flashEnabled, setFlashEnabled] = useState(false);
  const [confidence, setConfidence] = useState(0);
  const [error, setError] = useState<string>('');
  const audioContextRef = useRef<AudioContext | null>(null);
  const modelRef = useRef<any>(null);
  const detectionLoopRef = useRef<number>(0);

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
      script.onload = async () => {
        console.log('Edge Impulse JS loaded');
        
        // Initialize the Edge Impulse model
        try {
          // @ts-ignore - Edge Impulse global
          const Module = window.Module;
          if (Module && Module._init) {
            await Module._init();
            modelRef.current = Module;
            setIsModelLoaded(true);
            console.log('Edge Impulse model initialized successfully');
          }
        } catch (err) {
          console.error('Model initialization error:', err);
          setError('Failed to initialize Edge Impulse model');
        }
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

  // Start camera with flash support
  const startCamera = async () => {
    try {
      setError('');
      const constraints = { 
        video: { 
          width: 640, 
          height: 480,
          facingMode: 'environment', // Use back camera for better trash detection
          torch: flashEnabled // Enable flash if supported
        } 
      };
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setIsCameraActive(true);
        console.log('Camera started successfully');
        
        // Enable flash if supported
        if (flashEnabled) {
          const track = stream.getVideoTracks()[0];
          if (track.getCapabilities && track.getCapabilities().torch) {
            await track.applyConstraints({ advanced: [{ torch: true }] });
            console.log('Flash enabled');
          }
        }
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

  // Process video frame with Edge Impulse - REPLACE THIS SECTION WITH YOUR MODEL
  const processFrame = async () => {
    if (!videoRef.current || !canvasRef.current || !isModelLoaded || !modelRef.current) return;

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
      
      // Convert ImageData to the format your Edge Impulse model expects
      const features = new Float32Array(canvas.width * canvas.height * 3);
      let featureIndex = 0;
      
      for (let i = 0; i < imageData.data.length; i += 4) {
        // Normalize RGB values to 0-1 range and enhance contrast for flash detection
        const r = imageData.data[i] / 255.0;
        const g = imageData.data[i + 1] / 255.0;
        const b = imageData.data[i + 2] / 255.0;
        
        // Enhance bright areas (where flash illuminates trash)
        const brightness = (r + g + b) / 3;
        const enhancementFactor = brightness > 0.7 ? 1.2 : 1.0;
        
        features[featureIndex++] = Math.min(1.0, r * enhancementFactor);
        features[featureIndex++] = Math.min(1.0, g * enhancementFactor);
        features[featureIndex++] = Math.min(1.0, b * enhancementFactor);
      }
      
      // REPLACE THIS WITH YOUR ACTUAL EDGE IMPULSE MODEL CALL:
      // const result = await modelRef.current.classify(features);
      
      // For now, using a simulation that detects bright areas (simulating trash detection)
      let trashDetected = false;
      let maxConfidence = 0;
      
      // Simple bright area detection (replace with your model)
      const brightPixels = features.filter(value => value > 0.8).length;
      const brightPixelRatio = brightPixels / features.length;
      
      if (brightPixelRatio > 0.1) { // If more than 10% of pixels are bright
        trashDetected = true;
        maxConfidence = Math.min(0.95, brightPixelRatio * 5); // Convert to confidence score
      }
      
      // TODO: Replace above simulation with actual Edge Impulse model call:
      /*
      if (modelRef.current && modelRef.current.classify) {
        const result = await modelRef.current.classify(features);
        if (result && result.classification) {
          const trashClass = result.classification['trash']; // Adjust based on your model's output
          if (trashClass && trashClass.value > 0.6) { // Adjust threshold as needed
            trashDetected = true;
            maxConfidence = trashClass.value;
          }
        }
      }
      */
      
      setConfidence(maxConfidence);
      
      if (trashDetected) {
        setDetectionResult(`🗑️ TRASH DETECTED! (${(maxConfidence * 100).toFixed(1)}% confidence)`);
        playWarningSound();
      } else {
        setDetectionResult('No trash detected - area clear');
      }
      
    } catch (err) {
      console.error('Frame processing error:', err);
      setError('Error processing frame');
    }
  };

  // Start/stop detection
  const toggleDetection = () => {
    if (isDetecting) {
      setIsDetecting(false);
      if (detectionLoopRef.current) {
        cancelAnimationFrame(detectionLoopRef.current);
      }
    } else {
      setIsDetecting(true);
      // Start detection loop
      const detect = () => {
        if (isDetecting) {
          processFrame();
          detectionLoopRef.current = requestAnimationFrame(detect);
        }
      };
      detect();
    }
  };

  // Toggle flash
  const toggleFlash = async () => {
    if (isCameraActive && videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      const track = stream.getVideoTracks()[0];
      
      try {
        if (track.getCapabilities && track.getCapabilities().torch) {
          await track.applyConstraints({ 
            advanced: [{ torch: !flashEnabled }] 
          });
          setFlashEnabled(!flashEnabled);
          console.log(`Flash ${!flashEnabled ? 'enabled' : 'disabled'}`);
        } else {
          setError('Flash not supported on this device');
        }
      } catch (err) {
        console.error('Flash toggle error:', err);
        setError('Failed to toggle flash');
      }
    }
  };

  // Load model on component mount
  useEffect(() => {
    loadModel();
  }, []);

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">🗑️ Under-Table Trash Detection</h1>
        <p className="text-muted-foreground">
          Position phone on right side, facing left under table with flash enabled
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
            Under-Table Camera View
          </h2>
          
          <div className="relative bg-muted rounded-lg overflow-hidden">
            <video
              ref={videoRef}
              className="w-full h-64 object-cover transform -scale-x-100" // Mirror for better UX
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

            {/* Flash indicator */}
            {flashEnabled && isCameraActive && (
              <div className="absolute top-2 right-2 bg-yellow-500 text-white p-1 rounded">
                <Flashlight className="h-4 w-4" />
              </div>
            )}
          </div>

          <div className="flex gap-2 flex-wrap">
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

            <Button
              onClick={toggleFlash}
              disabled={!isCameraActive}
              variant={flashEnabled ? "secondary" : "outline"}
            >
              <Flashlight className="h-4 w-4 mr-2" />
              Flash {flashEnabled ? "ON" : "OFF"}
            </Button>
          </div>
        </div>

        {/* Controls & Status */}
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
              <span>Flash Status:</span>
              <span className={`font-medium ${flashEnabled ? 'text-yellow-600' : 'text-muted-foreground'}`}>
                {flashEnabled ? 'ON' : 'OFF'}
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
      </div>

      <div className="text-sm text-muted-foreground bg-blue-50 p-4 rounded-lg">
        <p><strong>Setup Instructions:</strong></p>
        <ol className="list-decimal list-inside space-y-1 mt-2">
          <li>Upload your Edge Impulse files to the public folder</li>
          <li>Position phone on the RIGHT side of table</li>
          <li>Point camera LEFT towards under-table area</li>
          <li>Enable flash for better trash visibility</li>
          <li>Start detection - system will alert when trash is found</li>
        </ol>
        
        <p className="mt-3"><strong>⚠️ Code Integration Needed:</strong></p>
        <p>Replace the simulation in <code>processFrame()</code> with your actual Edge Impulse model calls. Look for the TODO comment in the code.</p>
      </div>
    </div>
  );
};

export default ObjectDetector;
