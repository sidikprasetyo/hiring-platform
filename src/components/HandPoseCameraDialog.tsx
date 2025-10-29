// components/camera/HandPoseCameraModal.tsx
"use client";

import { useState, useRef, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface HandPoseCameraModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (imageUrl: string) => void;
}

const HAND_POSES = [
  { id: 1, name: "Pose 1", icon: "👆", description: "Index finger up" },
  { id: 2, name: "Pose 2", icon: "✌️", description: "Peace sign" },
  { id: 3, name: "Pose 3", icon: "🤟", description: "Rock sign" }
];

export default function HandPoseCameraModal({ 
  isOpen, 
  onClose, 
  onCapture 
}: HandPoseCameraModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [currentPoseIndex, setCurrentPoseIndex] = useState(0);
  const [poseDetected, setPoseDetected] = useState<boolean | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isDetecting, setIsDetecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Camera lifecycle management
  useEffect(() => {
    if (isOpen && !capturedImage) {
      startCamera();
    }
    
    return () => {
      stopCamera();
    };
  }, [isOpen, capturedImage]);

  const startCamera = async () => {
    try {
      setError(null);
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: "user"
        } 
      });
      
      setStream(mediaStream);
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.error("Camera access error:", err);
      setError("Cannot access camera. Please check your permissions.");
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const simulateHandPoseDetection = () => {
    if (isDetecting || countdown !== null) return;
    
    setIsDetecting(true);
    setError(null);
    
    // Simulate AI detection (replace with MediaPipe/TensorFlow.js)
    setTimeout(() => {
      const isCorrectPose = Math.random() > 0.3; // 70% success rate
      setPoseDetected(isCorrectPose);
      
      if (isCorrectPose) {
        // Success - move to next pose or capture
        if (currentPoseIndex === HAND_POSES.length - 1) {
          startCountdown();
        } else {
          setTimeout(() => {
            setCurrentPoseIndex(prev => prev + 1);
            setPoseDetected(null);
            setIsDetecting(false);
          }, 1000);
        }
      } else {
        // Failed detection
        setTimeout(() => {
          setPoseDetected(null);
          setIsDetecting(false);
        }, 1500);
      }
    }, 2000);
  };

  const startCountdown = () => {
    let count = 3;
    setCountdown(count);
    
    const timer = setInterval(() => {
      count--;
      if (count === 0) {
        clearInterval(timer);
        capturePhoto();
      } else {
        setCountdown(count);
      }
    }, 1000);
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");
    
    if (!context) return;
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    const imageUrl = canvas.toDataURL("image/jpeg", 0.9);
    
    setCapturedImage(imageUrl);
    setCountdown(null);
    stopCamera();
  };

  const handleRetake = () => {
    setCapturedImage(null);
    setCurrentPoseIndex(0);
    setPoseDetected(null);
    setCountdown(null);
    setIsDetecting(false);
    setError(null);
    startCamera();
  };

  const handleSubmit = () => {
    if (capturedImage) {
      onCapture(capturedImage);
      handleClose();
    }
  };

  const handleClose = () => {
    stopCamera();
    setCapturedImage(null);
    setCurrentPoseIndex(0);
    setPoseDetected(null);
    setCountdown(null);
    setIsDetecting(false);
    setError(null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl p-0">
        <DialogHeader className="p-6 pb-4">
          <DialogTitle className="text-xl">Raise Your Hand to Capture</DialogTitle>
          <DialogDescription>
            We&apos;ll take the photo once your hand pose is detected.
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 pb-6 space-y-4">
          {/* Camera Preview */}
          <div className="relative bg-gray-900 rounded-lg overflow-hidden aspect-video">
            {error ? (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
                <div className="text-center text-white px-4">
                  <svg className="w-16 h-16 mx-auto mb-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <p className="text-sm">{error}</p>
                  <button 
                    onClick={startCamera}
                    className="mt-4 px-4 py-2 bg-teal-600 text-white rounded-md text-sm hover:bg-teal-700"
                  >
                    Retry
                  </button>
                </div>
              </div>
            ) : !capturedImage ? (
              <>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
                
                {/* Detection Box Overlay */}
                {poseDetected !== null && (
                  <div
                    className={`absolute left-1/4 top-1/4 w-1/3 h-2/3 border-4 rounded-lg transition-all duration-300 ${
                      poseDetected ? "border-green-500" : "border-red-500"
                    }`}
                  >
                    <div
                      className={`absolute -top-8 left-0 px-3 py-1 rounded text-white text-sm font-medium ${
                        poseDetected ? "bg-green-500" : "bg-red-500"
                      }`}
                    >
                      {poseDetected ? HAND_POSES[currentPoseIndex].name : "Undetected"}
                    </div>
                  </div>
                )}

                {/* Countdown Overlay */}
                {countdown && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
                    <div className="text-center text-white">
                      <p className="text-lg mb-2">Capturing photo in</p>
                      <p className="text-8xl font-bold animate-pulse">{countdown}</p>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <img
                src={capturedImage}
                alt="Captured photo"
                className="w-full h-full object-cover"
              />
            )}
            
            <canvas ref={canvasRef} className="hidden" />
          </div>

          {/* Instructions */}
          <p className="text-sm text-gray-600">
            To take a picture, follow the hand poses in the order shown below. 
            The system will automatically capture the image once the final pose is detected.
          </p>

          {/* Pose Sequence Indicators */}
          <div className="flex items-center justify-center gap-3">
            {HAND_POSES.map((pose, index) => (
              <div key={pose.id} className="flex items-center gap-3">
                <div
                  className={`w-16 h-20 border-2 rounded-lg flex flex-col items-center justify-center transition-all ${
                    index === currentPoseIndex && !capturedImage
                      ? "border-teal-600 bg-teal-50 scale-110"
                      : index < currentPoseIndex
                      ? "border-green-500 bg-green-50"
                      : "border-gray-300 bg-white"
                  }`}
                >
                  <span className="text-2xl">{pose.icon}</span>
                  {index < currentPoseIndex && (
                    <span className="text-xs text-green-600 font-semibold mt-1">✓</span>
                  )}
                </div>
                {index < HAND_POSES.length - 1 && (
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                )}
              </div>
            ))}
          </div>

          {/* Action Buttons */}
          {!capturedImage ? (
            <button
              onClick={simulateHandPoseDetection}
              disabled={isDetecting || countdown !== null || !!error}
              className="w-full bg-teal-600 text-white py-3 rounded-md font-medium hover:bg-teal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isDetecting 
                ? "Detecting pose..." 
                : countdown 
                ? "Capturing..." 
                : "Start Detection"}
            </button>
          ) : (
            <div className="flex gap-3">
              <button
                onClick={handleRetake}
                className="flex-1 bg-white text-gray-700 border-2 border-gray-300 py-3 rounded-md font-medium hover:bg-gray-50 transition-colors"
              >
                Retake photo
              </button>
              <button
                onClick={handleSubmit}
                className="flex-1 bg-teal-600 text-white py-3 rounded-md font-medium hover:bg-teal-700 transition-colors"
              >
                Submit
              </button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}