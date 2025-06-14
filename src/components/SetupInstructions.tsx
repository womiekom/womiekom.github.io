
import React from 'react';

const SetupInstructions: React.FC = () => {
  return (
    <div className="text-sm text-muted-foreground bg-blue-50 p-4 rounded-lg">
      <p><strong>Setup Instructions:</strong></p>
      <ol className="list-decimal list-inside space-y-1 mt-2">
        <li>Upload your Edge Impulse files (edge-impulse-standalone.js and .wasm) to the public folder</li>
        <li>Start the camera and begin detection</li>
        <li>The system will automatically detect trash using your trained model</li>
        <li>Audio alerts will play when trash is detected (can be toggled off)</li>
      </ol>
    </div>
  );
};

export default SetupInstructions;
