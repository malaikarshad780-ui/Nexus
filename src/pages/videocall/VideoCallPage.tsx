import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCall } from '../../context/CallContext';
import { useAuth } from '../../context/AuthContext';
import {
  Video, VideoOff, Mic, MicOff, PhoneOff, Phone,
  MonitorUp, MonitorX,
} from 'lucide-react';

export const VideoCallPage: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    callSession,
    localStream,
    screenStream,
    startCall,
    endCall,
    toggleVideo,
    toggleAudio,
    startScreenShare,
    stopScreenShare,
  } = useCall();

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const screenVideoRef = useRef<HTMLVideoElement>(null);
  const [elapsed, setElapsed] = useState(0);

  // Attach local camera stream to the video element
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  // Attach screen share stream to its video element
  useEffect(() => {
    if (screenVideoRef.current && screenStream) {
      screenVideoRef.current.srcObject = screenStream;
    }
  }, [screenStream]);

  // Call duration timer
  useEffect(() => {
    if (callSession?.status !== 'ongoing' || !callSession.startedAt) return;
    const interval = setInterval(() => {
      const seconds = Math.floor(
        (Date.now() - new Date(callSession.startedAt as string).getTime()) / 1000
      );
      setElapsed(seconds);
    }, 1000);
    return () => clearInterval(interval);
  }, [callSession?.status, callSession?.startedAt]);

  // Stop any active media if the user navigates away mid-call
  useEffect(() => {
    return () => {
      if (callSession?.status === 'ongoing') {
        endCall();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const formatTime = (totalSeconds: number): string => {
    const mins = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
    const secs = (totalSeconds % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
  };

  const handleStartCall = async (): Promise<void> => {
    if (!user || !userId) return;
    await startCall(user.id, userId);
  };

  const handleEndCall = (): void => {
    endCall();
    navigate(-1);
  };

  const isCallActive = callSession?.status === 'ongoing';

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Video Call</h1>
      <p className="text-sm text-gray-500 mb-6">
        {isCallActive ? `In call with user ${userId}` : `Call user ${userId}`}
      </p>

      <div className="bg-gray-900 rounded-xl overflow-hidden relative aspect-video flex items-center justify-center">
        {!isCallActive && (
          <div className="text-center">
            <div className="w-20 h-20 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <Phone size={32} className="text-gray-300" />
            </div>
            <p className="text-gray-300 mb-4">Ready to start the call</p>
            <button
              onClick={handleStartCall}
              className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-6 py-2.5 rounded-full font-medium transition-colors"
            >
              <Phone size={18} />
              Start Call
            </button>
          </div>
        )}

        {isCallActive && (
          <>
            {/* Screen share takes over the main view if active */}
            {screenStream ? (
              <video
                ref={screenVideoRef}
                autoPlay
                playsInline
                className="w-full h-full object-contain bg-black"
              />
            ) : (
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-cover ${
                  callSession?.isVideoOn ? '' : 'hidden'
                }`}
              />
            )}

            {!callSession?.isVideoOn && !screenStream && (
              <div className="text-center">
                <div className="w-20 h-20 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-2">
                  <VideoOff size={28} className="text-gray-300" />
                </div>
                <p className="text-gray-300 text-sm">Camera is off</p>
              </div>
            )}

            {/* Small self-view thumbnail when screen sharing */}
            {screenStream && (
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className="absolute bottom-4 right-4 w-32 h-24 object-cover rounded-lg border-2 border-gray-700 shadow-lg"
              />
            )}

            <div className="absolute top-4 left-4 bg-black/50 text-white text-sm px-3 py-1 rounded-full">
              {formatTime(elapsed)}
            </div>
          </>
        )}
      </div>

      {isCallActive && (
        <div className="flex items-center justify-center gap-4 mt-6">
          <button
            onClick={toggleAudio}
            title={callSession?.isAudioOn ? 'Mute microphone' : 'Unmute microphone'}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
              callSession?.isAudioOn
                ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                : 'bg-red-100 text-red-600 hover:bg-red-200'
            }`}
          >
            {callSession?.isAudioOn ? <Mic size={20} /> : <MicOff size={20} />}
          </button>

          <button
            onClick={toggleVideo}
            title={callSession?.isVideoOn ? 'Turn off camera' : 'Turn on camera'}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
              callSession?.isVideoOn
                ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                : 'bg-red-100 text-red-600 hover:bg-red-200'
            }`}
          >
            {callSession?.isVideoOn ? <Video size={20} /> : <VideoOff size={20} />}
          </button>

          <button
            onClick={callSession?.isScreenSharing ? stopScreenShare : startScreenShare}
            title={callSession?.isScreenSharing ? 'Stop screen share' : 'Share screen'}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
              callSession?.isScreenSharing
                ? 'bg-primary-100 text-primary-700 hover:bg-primary-200'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {callSession?.isScreenSharing ? <MonitorX size={20} /> : <MonitorUp size={20} />}
          </button>

          <button
            onClick={handleEndCall}
            title="End call"
            className="w-12 h-12 rounded-full bg-red-600 hover:bg-red-700 text-white flex items-center justify-center transition-colors"
          >
            <PhoneOff size={20} />
          </button>
        </div>
      )}
    </div>
  );
};