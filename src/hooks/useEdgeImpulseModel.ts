
import { useState, useRef, useEffect } from 'react';

interface UseEdgeImpulseModelProps {
  wasmUrl: string;
  jsUrl: string;
}

export const useEdgeImpulseModel = ({ wasmUrl, jsUrl }: UseEdgeImpulseModelProps) => {
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const [error, setError] = useState<string>('');
  const modelRef = useRef<any>(null);

  const loadModel = async () => {
    try {
      setError('');
      console.log('Loading Edge Impulse model...');
      
      const script = document.createElement('script');
      script.src = jsUrl;
      script.onload = async () => {
        console.log('Edge Impulse JS loaded');
        
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

  useEffect(() => {
    loadModel();
  }, [jsUrl]);

  return {
    isModelLoaded,
    error,
    setError,
    modelRef: modelRef.current
  };
};
