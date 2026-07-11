import React, { createContext, useState, useContext, useRef } from 'react';
import { CallSession } from '../types';
import toast from 'react-hot-toast';

interface CallContextType {
  callSession: CallSession | null;
  localStream: MediaStream | null;
  screenStream: MediaStream | null;
  startCall: (callerId: string, receiverId: string) => Promise<void>;
  endCall: () => void;
  toggleVideo: () => void;
  toggleAudio: () => void;
  startScreenShare: () => Promise<void>;
  stopScreenShare: () => void;
}

const CallContext = createContext<CallContextType | undefined>(undefined);

export const CallProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [callSession, setCallSession] = useState<CallSession | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);

  const startCall = async (callerId: string, receiverId: string): Promise<void> => {
    let stream: MediaStream | null = null;
    let hasVideo = false;
    let hasAudio = false;

    // Try camera + mic first
    try {
      stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      hasVideo = true;
      hasAudio = true;
    } catch {
      // Fall back to audio only (e.g. no camera on this device)
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: false, audio: true });
        hasAudio = true;
        toast('No camera found — joining with audio only', { icon: 'ℹ️' });
      } catch {
        // Fall back to video only (e.g. no mic on this device)
        try {
          stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
          hasVideo = true;
          toast('No microphone found — joining with video only', { icon: 'ℹ️' });
        } catch {
          // No devices at all — still let the mock call proceed
          toast('No camera/mic detected — starting in mock mode', { icon: 'ℹ️' });
        }
      }
    }

    localStreamRef.current = stream;
    setLocalStream(stream);

    const newSession: CallSession = {
      id: `call-${Date.now()}`,
      callerId,
      receiverId,
      status: 'ongoing',
      isVideoOn: hasVideo,
      isAudioOn: hasAudio,
      isScreenSharing: false,
      startedAt: new Date().toISOString(),
      endedAt: null,
    };

    setCallSession(newSession);
    toast.success('Call started');
  };

  const endCall = (): void => {
    localStreamRef.current?.getTracks().forEach(track => track.stop());
    screenStreamRef.current?.getTracks().forEach(track => track.stop());

    localStreamRef.current = null;
    screenStreamRef.current = null;
    setLocalStream(null);
    setScreenStream(null);

    setCallSession(prev =>
      prev ? { ...prev, status: 'ended', endedAt: new Date().toISOString() } : null
    );

    toast.success('Call ended');

    setTimeout(() => setCallSession(null), 300);
  };
const toggleVideo = (): void => {
    if (!callSession) return;
    const videoTrack = localStreamRef.current?.getVideoTracks()[0];
    if (videoTrack) {
      // Real camera track exists - flip it
      videoTrack.enabled = !videoTrack.enabled;
      setCallSession(prev => (prev ? { ...prev, isVideoOn: videoTrack.enabled } : null));
    } else {
      // Mock mode (no camera device) - just flip the UI state
      setCallSession(prev => (prev ? { ...prev, isVideoOn: !prev.isVideoOn } : null));
    }
  };

  const toggleAudio = (): void => {
    if (!callSession) return;
    const audioTrack = localStreamRef.current?.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;
      setCallSession(prev => (prev ? { ...prev, isAudioOn: audioTrack.enabled } : null));
    } else {
      setCallSession(prev => (prev ? { ...prev, isAudioOn: !prev.isAudioOn } : null));
    }
  };

  const startScreenShare = async (): Promise<void> => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
      screenStreamRef.current = stream;
      setScreenStream(stream);
      setCallSession(prev => (prev ? { ...prev, isScreenSharing: true } : null));

      stream.getVideoTracks()[0].onended = () => {
        stopScreenShare();
      };

      toast.success('Screen sharing started');
    } catch (error) {
      toast.error('Could not start screen sharing');
    }
  };

  const stopScreenShare = (): void => {
    screenStreamRef.current?.getTracks().forEach(track => track.stop());
    screenStreamRef.current = null;
    setScreenStream(null);
    setCallSession(prev => (prev ? { ...prev, isScreenSharing: false } : null));
  };

  const value: CallContextType = {
    callSession,
    localStream,
    screenStream,
    startCall,
    endCall,
    toggleVideo,
    toggleAudio,
    startScreenShare,
    stopScreenShare,
  };

  return <CallContext.Provider value={value}>{children}</CallContext.Provider>;
};

export const useCall = (): CallContextType => {
  const context = useContext(CallContext);
  if (context === undefined) {
    throw new Error('useCall must be used within a CallProvider');
  }
  return context;
};