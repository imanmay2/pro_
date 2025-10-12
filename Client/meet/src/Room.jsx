import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { io } from "socket.io-client";
import { Mic, MicOff, Video, VideoOff } from "lucide-react";
import AnimatedBoy from "./components/AnimatedBoy";
import FloatingParticles from "./components/FloatingParticles";

// Connect to backend Socket.io server
const socket = io("http://localhost:3000");

export default function Room() {
  const { roomId } = useParams();
  const videoRef = useRef(null);

  const [joined, setJoined] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);

  const localStreamRef = useRef(null);
  const peerConnections = useRef({});
  const remoteStreams = useRef({});
  const [remoteVideos, setRemoteVideos] = useState([]);

  // Start camera & mic and join room
  useEffect(() => {
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });

        localStreamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }

        setJoined(true);

        socket.emit("join-room", roomId);

        socket.on("user-joined", async (userId) => {
          const pc = createPeerConnection(userId, stream);
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          socket.emit("signal", { to: userId, signal: { sdp: offer } });
        });

        socket.on("signal", async ({ from, data }) => {
          let pc = peerConnections.current[from];
          if (!pc) pc = createPeerConnection(from, stream);

          if (data.sdp) {
            await pc.setRemoteDescription(new RTCSessionDescription(data.sdp));
            if (data.sdp.type === "offer") {
              const answer = await pc.createAnswer();
              await pc.setLocalDescription(answer);
              socket.emit("signal", { to: from, signal: { sdp: answer } });
            }
          }

          if (data.candidate) {
            await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
          }
        });

        socket.on("user-left", (userId) => {
          const stream = remoteStreams.current[userId];
          if (stream) setRemoteVideos((prev) => prev.filter((s) => s !== stream));

          const pc = peerConnections.current[userId];
          if (pc) pc.close();

          delete peerConnections.current[userId];
          delete remoteStreams.current[userId];
        });
      } catch (err) {
        console.error("Camera/Mic error:", err);
        alert("Please allow camera and microphone access!");
      }
    };

    startCamera();
  }, [roomId]);

  const createPeerConnection = (userId, localStream) => {
    const pc = new RTCPeerConnection();

    localStream.getTracks().forEach((track) => pc.addTrack(track, localStream));

    const remoteStream = new MediaStream();
    remoteStreams.current[userId] = remoteStream;

    pc.ontrack = (event) => {
      event.streams[0].getTracks().forEach((track) => remoteStream.addTrack(track));

      setRemoteVideos((prev) => {
        if (!prev.includes(remoteStream)) return [...prev, remoteStream];
        return prev;
      });
    };

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit("signal", { to: userId, signal: { candidate: event.candidate } });
      }
    };

    peerConnections.current[userId] = pc;
    return pc;
  };

  // Toggle Mic
  const toggleMute = () => {
    const audioTrack = localStreamRef.current?.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;
      setIsMuted(!audioTrack.enabled);
    }
  };

  // Toggle Video
  const toggleVideo = () => {
    const videoTrack = localStreamRef.current?.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.enabled = !videoTrack.enabled;
      setIsVideoOff(!videoTrack.enabled);
    }
  };

  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white p-4 overflow-hidden">
      {/* Left side animated boy */}
      <AnimatedBoy />

      {/* Right side floating particles */}
      <FloatingParticles />

      <h1 className="text-2xl font-bold mb-4 animate-pulse z-20">Room ID: {roomId}</h1>

      {/* Self-view with overlay icons */}
      <div className="relative w-[80%] max-w-3xl bg-black rounded-xl overflow-hidden shadow-2xl transition-all duration-700 hover:shadow-blue-500/50 z-20">
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          className={`w-full h-[60vh] object-cover transition-opacity duration-500 ${
            isVideoOff ? "opacity-20" : "opacity-100"
          }`}
        />

        {isVideoOff && (
          <div className="absolute inset-0 flex items-center justify-center">
            <VideoOff className="w-20 h-20 text-red-500 animate-pulse animate-bounce" />
          </div>
        )}

        {isMuted && !isVideoOff && (
          <div className="absolute top-3 left-3 flex items-center justify-center bg-gray-800 p-2 rounded-full animate-ping">
            <MicOff className="w-6 h-6 text-red-500" />
          </div>
        )}
      </div>

      {/* Media Controls */}
      <div className="flex space-x-6 mt-6 z-20">
        <button
          onClick={toggleMute}
          className={`p-4 rounded-full transition transform duration-300 ${
            isMuted
              ? "bg-red-600 scale-125 shadow-lg shadow-red-500/50 animate-pulse"
              : "bg-gray-700 hover:bg-gray-600 hover:scale-110 hover:shadow-lg hover:shadow-blue-500/50"
          }`}
        >
          {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
        </button>

        <button
          onClick={toggleVideo}
          className={`p-4 rounded-full transition transform duration-300 ${
            isVideoOff
              ? "bg-red-600 scale-125 shadow-lg shadow-red-500/50 animate-pulse"
              : "bg-gray-700 hover:bg-gray-600 hover:scale-110 hover:shadow-lg hover:shadow-blue-500/50"
          }`}
        >
          {isVideoOff ? <VideoOff className="w-6 h-6" /> : <Video className="w-6 h-6" />}
        </button>
      </div>

      {/* Remote Videos */}
      <div className="flex flex-wrap gap-4 mt-8 z-20">
        {remoteVideos.map((stream, idx) => (
          <video
            key={idx}
            autoPlay
            playsInline
            ref={(video) => {
              if (video && stream) video.srcObject = stream;
            }}
            className="w-60 h-40 bg-black rounded-lg shadow-lg transition-all duration-500 transform hover:scale-105 hover:shadow-blue-500/40 animate-fadeIn"
          />
        ))}
      </div>
    </div>
  );
}
