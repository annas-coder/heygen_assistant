import { useRef, useState } from 'react';
import StreamingAvatar, {
  AvatarQuality,
  StreamingEvents
} from "@heygen/streaming-avatar";

function App() {
  // State management
  const [avatar, setAvatar] = useState<StreamingAvatar | null>(null);
  const [sessionData, setSessionData] = useState<any>(null);
  const [currentMode, setCurrentMode] = useState<"text" | "voice">("text");
  const [voiceStatus, setVoiceStatus] = useState<string>("");
  const [userInput, setUserInput] = useState<string>("");
  const [isSessionActive, setIsSessionActive] = useState<boolean>(false);
  const [isVoiceModeEnabled, setIsVoiceModeEnabled] = useState<boolean>(false);

  // Refs for DOM elements
  const videoRef = useRef<HTMLVideoElement>(null);

  // Helper function to fetch access token
  async function fetchAccessToken(): Promise<string> {
    const apiKey = "ZWI4OTE3NGJiMTJkNDE0YWFhMDc2ZDY3YTRmNTYwYmEtMTc1ODc5MDYxMA==";
    const response = await fetch(
      "https://api.heygen.com/v1/streaming.create_token",
      {
        method: "POST",
        headers: { "x-api-key": apiKey },
      }
    );

    const { data } = await response.json();
    return data.token;
  }

  // Initialize streaming avatar session
  async function initializeAvatarSession() {
    try {
      const token = await fetchAccessToken();
      const newAvatar = new StreamingAvatar({ token });

      // Add event listeners
      newAvatar.on(StreamingEvents.STREAM_READY, handleStreamReady);
      newAvatar.on(StreamingEvents.STREAM_DISCONNECTED, handleStreamDisconnected);
      
      // Add voice chat event listeners
      newAvatar.on(StreamingEvents.USER_START, () => {
        setVoiceStatus("Listening...");
      });
      newAvatar.on(StreamingEvents.USER_STOP, () => {
        setVoiceStatus("Processing...");
      });
      newAvatar.on(StreamingEvents.AVATAR_START_TALKING, () => {
        setVoiceStatus("Avatar is speaking...");
      });
      newAvatar.on(StreamingEvents.AVATAR_STOP_TALKING, () => {
        setVoiceStatus("Waiting for you to speak...");
      });
      
      const newSessionData = await newAvatar.createStartAvatar({
        quality: AvatarQuality.High,
        avatarName: "Wayne_20240711",
        disableIdleTimeout: true,
        language: "en",
      });

      console.log("Session data:", newSessionData);
      
      setAvatar(newAvatar);
      setSessionData(newSessionData);
      setIsSessionActive(true);
    } catch (error) {
      console.error("Error initializing avatar session:", error);
    }
  }

  // Handle when avatar stream is ready
  function handleStreamReady(event: any) {
    if (event.detail && videoRef.current) {
      videoRef.current.srcObject = event.detail;
      videoRef.current.onloadedmetadata = () => {
        videoRef.current?.play().catch(console.error);
      };
      setIsVoiceModeEnabled(true); // Enable voice mode after stream is ready
    } else {
      console.error("Stream is not available");
    }
  }

  // Handle stream disconnection
  function handleStreamDisconnected() {
    console.log("Stream disconnected");
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsSessionActive(false);
    setIsVoiceModeEnabled(false);
  }

  // End the avatar session
  async function terminateAvatarSession() {
    if (!avatar || !sessionData) return;

    try {
      await avatar.stopAvatar();
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
      setAvatar(null);
      setSessionData(null);
      setIsSessionActive(false);
      setIsVoiceModeEnabled(false);
      setCurrentMode("text");
    } catch (error) {
      console.error("Error terminating avatar session:", error);
    }
  }

  // Handle speaking event
  async function handleSpeak() {
    if (avatar && userInput.trim()) {
      try {
        await avatar.speak({
          text: userInput,
        });
        setUserInput(""); // Clear input after speaking
      } catch (error) {
        console.error("Error speaking:", error);
      }
    }
  }

  // Start voice chat
  async function startVoiceChat() {
    if (!avatar) return;
    
    try {
      await avatar.startVoiceChat();
      setVoiceStatus("Waiting for you to speak...");
    } catch (error) {
      console.error("Error starting voice chat:", error);
      setVoiceStatus("Error starting voice chat");
    }
  }

  // Switch between text and voice modes
  async function switchMode(mode: "text" | "voice") {
    if (currentMode === mode) return;
    
    setCurrentMode(mode);
    
    if (mode === "text") {
      if (avatar) {
        try {
          await avatar.closeVoiceChat();
        } catch (error) {
          console.error("Error closing voice chat:", error);
        }
      }
    } else {
      if (avatar) {
        await startVoiceChat();
      }
    }
  }

  // Handle Enter key press in text input
  function handleKeyPress(event: React.KeyboardEvent) {
    if (event.key === 'Enter') {
      handleSpeak();
    }
  }

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center',
      padding: '20px',
      fontFamily: 'Arial, sans-serif'
    }}>
      <h1>Interactive Avatar Demo (Vite + TypeScript)</h1>

      {/* Video Section */}
      <div style={{ 
        width: 'fit-content', 
        marginBottom: '20px',
        border: '2px solid #ccc',
        borderRadius: '10px',
        overflow: 'hidden'
      }}>
        <video 
          ref={videoRef}
          autoPlay 
          playsInline 
          style={{ width: '400px', height: '300px', display: 'block' }}
        />
      </div>

      {/* Controls Section */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
        
        {/* Session Controls */}
        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            onClick={initializeAvatarSession}
            disabled={isSessionActive}
            style={{
              padding: '10px 20px',
              backgroundColor: isSessionActive ? '#ccc' : '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: isSessionActive ? 'not-allowed' : 'pointer'
            }}
          >
            Start Session
          </button>
          <button 
            onClick={terminateAvatarSession}
            disabled={!isSessionActive}
            style={{
              padding: '10px 20px',
              backgroundColor: !isSessionActive ? '#ccc' : '#dc3545',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: !isSessionActive ? 'not-allowed' : 'pointer'
            }}
          >
            End Session
          </button>
        </div>

        {/* Mode switching buttons */}
        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            onClick={() => switchMode("text")}
            style={{
              padding: '10px 20px',
              border: '2px solid #007bff',
              background: currentMode === "text" ? '#007bff' : 'white',
              color: currentMode === "text" ? 'white' : '#007bff',
              cursor: 'pointer',
              borderRadius: '5px'
            }}
          >
            Text Mode
          </button>
          <button 
            onClick={() => switchMode("voice")}
            disabled={!isVoiceModeEnabled}
            style={{
              padding: '10px 20px',
              border: '2px solid #007bff',
              background: currentMode === "voice" ? '#007bff' : 'white',
              color: currentMode === "voice" ? 'white' : '#007bff',
              cursor: !isVoiceModeEnabled ? 'not-allowed' : 'pointer',
              borderRadius: '5px',
              opacity: !isVoiceModeEnabled ? 0.5 : 1
            }}
          >
            Voice Mode
          </button>
        </div>

        {/* Text mode controls */}
        {currentMode === "text" && (
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <input
              type="text"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type something to talk to the avatar..."
              style={{
                padding: '10px',
                fontSize: '16px',
                border: '2px solid #ccc',
                borderRadius: '5px',
                width: '300px'
              }}
            />
            <button 
              onClick={handleSpeak}
              style={{
                padding: '10px 20px',
                backgroundColor: '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer'
              }}
            >
              Speak
            </button>
          </div>
        )}

        {/* Voice mode controls */}
        {currentMode === "voice" && (
          <div style={{
            textAlign: 'center',
            padding: '20px',
            fontSize: '18px',
            fontWeight: 'bold',
            color: '#007bff',
            minHeight: '60px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '2px solid #007bff',
            borderRadius: '10px',
            backgroundColor: '#f8f9fa'
          }}>
            {voiceStatus || "Voice mode ready - start speaking!"}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
