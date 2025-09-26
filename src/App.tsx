import React, { useRef, useState, useEffect } from 'react';
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
  const [selectedAvatarId] = useState<string>("default"); // Use default avatar for now
  const [n8nConnected, setN8nConnected] = useState<boolean>(false);

  // Refs for DOM elements
  const videoRef = useRef<HTMLVideoElement>(null);
  const wsRef = useRef<WebSocket | null>(null);

  // n8n WebSocket connection
  useEffect(() => {
    const connectToN8nServer = () => {
      try {
        const ws = new WebSocket('ws://localhost:3001');
        wsRef.current = ws;

        ws.onopen = () => {
          console.log('Connected to n8n integration server');
          setN8nConnected(true);
          
          // Send initial connection message
          ws.send(JSON.stringify({
            type: 'avatar_connected',
            timestamp: new Date().toISOString()
          }));
        };

        ws.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);
            console.log('Received from n8n server:', message);
            
            // Handle different command types from n8n
            switch (message.type) {
              case 'speak_command':
                if (avatar && message.text) {
                  avatar.speak({ text: message.text });
                  console.log(`n8n made avatar speak: "${message.text}"`);
                }
                break;
                
              case 'session_command':
                if (message.action === 'start') {
                  initializeAvatarSession();
                } else if (message.action === 'stop') {
                  terminateAvatarSession();
                }
                break;
                
              case 'mode_command':
                if (message.mode && ['text', 'voice'].includes(message.mode)) {
                  switchMode(message.mode);
                }
                break;
                
              case 'external_command':
                console.log('External command from n8n:', message.data);
                // Handle custom commands here
                break;
                
              default:
                console.log('Unknown command type:', message.type);
            }
          } catch (error) {
            console.error('Error parsing n8n message:', error);
          }
        };

        ws.onclose = () => {
          console.log('Disconnected from n8n integration server');
          setN8nConnected(false);
          
          // Attempt to reconnect after 5 seconds
          setTimeout(connectToN8nServer, 5000);
        };

        ws.onerror = (error) => {
          console.error('n8n WebSocket error:', error);
          setN8nConnected(false);
        };
        
      } catch (error) {
        console.error('Failed to connect to n8n server:', error);
        setTimeout(connectToN8nServer, 5000);
      }
    };

    connectToN8nServer();

    // Cleanup on component unmount
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [avatar]);

  // Send message to n8n server
  const sendToN8nServer = (message: any) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    }
  };

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
        avatarName: "Wayne_20240711", // Use a known working avatar
        disableIdleTimeout: true,
        language: "en",
      });

      console.log("Session data:", newSessionData);
      
      setAvatar(newAvatar);
      setSessionData(newSessionData);
      setIsSessionActive(true);
      setIsVoiceModeEnabled(true);
      
      // Notify n8n server about session start
      sendToN8nServer({
        type: 'session_started',
        timestamp: new Date().toISOString()
      });
      
      console.log("Avatar session initialized successfully");
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
        
        // Send user input to n8n for processing
        sendUserInputToN8n(userInput);
        
        // Notify n8n server about user speech
        sendToN8nServer({
          type: 'user_spoke',
          text: userInput,
          timestamp: new Date().toISOString()
        });
        
        setUserInput(""); // Clear input after speaking
      } catch (error) {
        console.error("Error speaking:", error);
      }
    }
  }

  // Send user input to n8n for processing (optional)
  const sendUserInputToN8n = async (input: string) => {
    try {
      const response = await fetch('http://localhost:3001/api/n8n/process-input', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_input: input,
          session_id: sessionData?.session_id || 'default',
          timestamp: new Date().toISOString()
        })
      });
      
      const result = await response.json();
      console.log('n8n processing result:', result);
    } catch (error) {
      console.error('Error sending to n8n:', error);
    }
  };

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
      height: '100vh',
      width: '100vw',
      background: '#f8f9fa',
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden'
    }}>
      {/* Compact Header */}
      <div style={{
        textAlign: 'center',
        padding: '20px',
        borderBottom: '1px solid #e9ecef',
        backgroundColor: 'white',
        flexShrink: 0
      }}>
        <h1 style={{
          color: '#1a1a1a',
          fontSize: '2rem',
          fontWeight: '700',
          margin: 0,
          letterSpacing: '-0.02em'
        }}>
          AI Assistant
        </h1>
      </div>

      {/* Main Content Area */}
      <div style={{
        flex: 1,
        display: 'flex',
        gap: '20px',
        padding: '20px',
        overflow: 'hidden'
      }}>
        
        {/* Large Avatar Display */}
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column'
        }}>
          <div style={{ 
            background: 'white',
            borderRadius: '12px',
            padding: '16px',
            boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
            border: '1px solid #e9ecef',
            flex: 1,
            display: 'flex',
            flexDirection: 'column'
          }}>
            <video 
              ref={videoRef}
              autoPlay 
              playsInline 
              style={{ 
                width: '100%', 
                flex: 1,
                borderRadius: '8px',
                backgroundColor: '#000',
                objectFit: 'cover',
                border: '1px solid #e9ecef'
              }}
            />
            
            {/* Status Bar */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginTop: '12px',
              padding: '12px 16px',
              borderRadius: '8px',
              backgroundColor: '#f8f9fa',
              border: '1px solid #e9ecef',
              flexShrink: 0
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <div style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: isSessionActive ? '#28a745' : '#ffc107'
                }}></div>
                <span style={{
                  color: '#495057',
                  fontSize: '14px',
                  fontWeight: '500'
                }}>
                  {isSessionActive ? 'Connected' : 'Disconnected'}
                </span>
              </div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                color: '#6c757d',
                fontSize: '13px',
                fontWeight: '400'
              }}>
                <span>{currentMode === 'text' ? 'Text Mode' : 'Voice Mode'}</span>
                <div style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  backgroundColor: n8nConnected ? '#28a745' : '#dc3545'
                }}></div>
                <span style={{ fontSize: '11px' }}>
                  {n8nConnected ? 'n8n' : 'n8n offline'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Control Panel */}
        <div style={{
          width: '300px',
          display: 'flex',
          flexDirection: 'column',
          flexShrink: 0
        }}>
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '20px',
            boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
            border: '1px solid #e9ecef',
            flex: 1,
            display: 'flex',
            flexDirection: 'column'
          }}>
            
            {/* Session Controls */}
            <div style={{ marginBottom: '24px', flexShrink: 0 }}>
              <h3 style={{ 
                color: '#1a1a1a', 
                marginBottom: '12px',
                fontSize: '16px',
                fontWeight: '600',
                letterSpacing: '-0.01em'
              }}>
                Session
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <button 
                  onClick={initializeAvatarSession}
                  disabled={isSessionActive}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    fontSize: '14px',
                    fontWeight: '600',
                    backgroundColor: isSessionActive ? '#e9ecef' : '#007bff',
                    color: isSessionActive ? '#6c757d' : 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: isSessionActive ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s ease',
                    letterSpacing: '-0.01em'
                  }}
                >
                  {isSessionActive ? 'Active' : 'Start Session'}
                </button>
                <button 
                  onClick={terminateAvatarSession}
                  disabled={!isSessionActive}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    fontSize: '14px',
                    fontWeight: '600',
                    backgroundColor: !isSessionActive ? '#e9ecef' : '#dc3545',
                    color: !isSessionActive ? '#6c757d' : 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: !isSessionActive ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s ease',
                    letterSpacing: '-0.01em'
                  }}
                >
                  End Session
                </button>
              </div>
            </div>

            {/* Mode Selection */}
            <div style={{ marginBottom: '24px', flexShrink: 0 }}>
              <h3 style={{ 
                color: '#1a1a1a', 
                marginBottom: '12px',
                fontSize: '16px',
                fontWeight: '600',
                letterSpacing: '-0.01em'
              }}>
                Mode
              </h3>
              <div style={{ display: 'flex', gap: '6px' }}>
                <button 
                  onClick={() => switchMode("text")}
                  style={{
                    flex: 1,
                    padding: '10px 12px',
                    fontSize: '13px',
                    fontWeight: '500',
                    border: '2px solid #e9ecef',
                    background: currentMode === "text" ? '#007bff' : 'white',
                    color: currentMode === "text" ? 'white' : '#495057',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    letterSpacing: '-0.01em'
                  }}
                >
                  Text
                </button>
                <button 
                  onClick={() => switchMode("voice")}
                  disabled={!isVoiceModeEnabled}
                  style={{
                    flex: 1,
                    padding: '10px 12px',
                    fontSize: '13px',
                    fontWeight: '500',
                    border: '2px solid #e9ecef',
                    background: currentMode === "voice" ? '#007bff' : 'white',
                    color: currentMode === "voice" ? 'white' : '#495057',
                    borderRadius: '6px',
                    cursor: !isVoiceModeEnabled ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s ease',
                    opacity: !isVoiceModeEnabled ? 0.5 : 1,
                    letterSpacing: '-0.01em'
                  }}
                >
                  Voice
                </button>
              </div>
            </div>

            {/* Text Mode Interface */}
            {currentMode === "text" && (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                <h3 style={{ 
                  color: '#1a1a1a', 
                  marginBottom: '12px',
                  fontSize: '16px',
                  fontWeight: '600',
                  letterSpacing: '-0.01em',
                  flexShrink: 0
                }}>
                  Message
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', flex: 1 }}>
                  <textarea
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSpeak();
                      }
                    }}
                    placeholder="Type your message here..."
                    style={{
                      padding: '12px',
                      fontSize: '14px',
                      border: '2px solid #e9ecef',
                      borderRadius: '6px',
                      outline: 'none',
                      transition: 'all 0.2s ease',
                      backgroundColor: 'white',
                      fontFamily: 'inherit',
                      resize: 'none',
                      flex: 1,
                      minHeight: '120px'
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#007bff';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = '#e9ecef';
                    }}
                  />
                  <button 
                    onClick={handleSpeak}
                    disabled={!userInput.trim()}
                    style={{
                      padding: '12px 16px',
                      fontSize: '14px',
                      fontWeight: '600',
                      backgroundColor: !userInput.trim() ? '#e9ecef' : '#28a745',
                      color: !userInput.trim() ? '#6c757d' : 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: !userInput.trim() ? 'not-allowed' : 'pointer',
                      transition: 'all 0.2s ease',
                      letterSpacing: '-0.01em',
                      flexShrink: 0
                    }}
                  >
                    Send Message
                  </button>
                </div>
              </div>
            )}

            {/* Voice Mode Interface */}
            {currentMode === "voice" && (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                <h3 style={{ 
                  color: '#1a1a1a', 
                  marginBottom: '12px',
                  fontSize: '16px',
                  fontWeight: '600',
                  letterSpacing: '-0.01em',
                  flexShrink: 0
                }}>
                  Voice Status
                </h3>
                <div style={{
                  padding: '20px',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#495057',
                  textAlign: 'center',
                  background: '#f8f9fa',
                  borderRadius: '6px',
                  border: '2px solid #e9ecef',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flex: 1
                }}>
                  {voiceStatus || "Ready to listen"}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
