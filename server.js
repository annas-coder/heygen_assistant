require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { WebSocketServer } = require('ws');
const http = require('http');

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('dist')); // Serve React build files

// Store connected clients (your avatar app)
let avatarClients = new Set();

// WebSocket connection handling
wss.on('connection', (ws) => {
  console.log('New WebSocket connection established');
  avatarClients.add(ws);

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      console.log('Received from avatar app:', data);
      
      // Handle different message types from avatar
      if (data.type === 'session_started') {
        console.log('Avatar session started');
      } else if (data.type === 'user_spoke') {
        console.log('User spoke:', data.text);
        // Could trigger n8n workflow here
      }
    } catch (error) {
      console.error('Error parsing WebSocket message:', error);
    }
  });

  ws.on('close', () => {
    console.log('WebSocket connection closed');
    avatarClients.delete(ws);
  });
});

// Broadcast message to all connected avatar clients
function broadcastToAvatars(message) {
  avatarClients.forEach(client => {
    if (client.readyState === 1) { // WebSocket.OPEN
      client.send(JSON.stringify(message));
    }
  });
}

// ===== n8n WEBHOOK ENDPOINTS =====

// 1. Make avatar speak (triggered by n8n)
app.post('/api/avatar/speak', (req, res) => {
  const { text, voice_settings } = req.body;
  
  if (!text) {
    return res.status(400).json({ error: 'Text is required' });
  }

  // Send message to avatar app via WebSocket
  broadcastToAvatars({
    type: 'speak_command',
    text: text,
    voice_settings: voice_settings || {}
  });

  console.log(`n8n requested avatar to speak: "${text}"`);
  res.json({ 
    success: true, 
    message: 'Speak command sent to avatar',
    text: text
  });
});

// 2. Start/Stop avatar session
app.post('/api/avatar/session/:action', (req, res) => {
  const { action } = req.params;
  
  if (!['start', 'stop'].includes(action)) {
    return res.status(400).json({ error: 'Action must be start or stop' });
  }

  broadcastToAvatars({
    type: 'session_command',
    action: action
  });

  console.log(`n8n requested to ${action} avatar session`);
  res.json({ 
    success: true, 
    message: `Session ${action} command sent to avatar`
  });
});

// 3. Switch avatar mode (text/voice)
app.post('/api/avatar/mode', (req, res) => {
  const { mode } = req.body;
  
  if (!['text', 'voice'].includes(mode)) {
    return res.status(400).json({ error: 'Mode must be text or voice' });
  }

  broadcastToAvatars({
    type: 'mode_command',
    mode: mode
  });

  console.log(`n8n requested to switch to ${mode} mode`);
  res.json({ 
    success: true, 
    message: `Mode switch to ${mode} sent to avatar`
  });
});

// 4. Get avatar status
app.get('/api/avatar/status', (req, res) => {
  res.json({
    connected_clients: avatarClients.size,
    server_status: 'running',
    timestamp: new Date().toISOString()
  });
});

// 5. n8n webhook for receiving workflow data
app.post('/webhook/n8n/:workflow_id', (req, res) => {
  const { workflow_id } = req.params;
  const workflowData = req.body;
  
  console.log(`Received n8n webhook for workflow ${workflow_id}:`, workflowData);

  // Process different workflow types
  switch (workflow_id) {
    case 'chat_response':
      // n8n processed user input and wants avatar to respond
      if (workflowData.response_text) {
        broadcastToAvatars({
          type: 'speak_command',
          text: workflowData.response_text,
          source: 'n8n_workflow'
        });
      }
      break;
      
    case 'scheduled_message':
      // n8n scheduled message
      if (workflowData.message) {
        broadcastToAvatars({
          type: 'speak_command',
          text: workflowData.message,
          source: 'n8n_schedule'
        });
      }
      break;
      
    case 'external_trigger':
      // External system triggered via n8n
      broadcastToAvatars({
        type: 'external_command',
        data: workflowData
      });
      break;
      
    default:
      console.log(`Unknown workflow type: ${workflow_id}`);
  }

  res.json({ 
    success: true, 
    workflow_id: workflow_id,
    processed: true,
    timestamp: new Date().toISOString()
  });
});

// 6. Send user input to n8n LangChain AI Agent (for processing)
app.post('/api/n8n/process-input', async (req, res) => {
  const { user_input, session_id } = req.body;
  
  try {
    // Your n8n LangChain Chat Trigger webhook URL
    const n8nChatTriggerUrl = process.env.N8N_CHAT_WEBHOOK_URL || 'YOUR_N8N_CHAT_WEBHOOK_URL_HERE';
    
    if (n8nChatTriggerUrl === 'YOUR_N8N_CHAT_WEBHOOK_URL_HERE') {
      throw new Error('Please set your n8n chat trigger webhook URL in environment variables');
    }
    
    console.log(`🧠 Sending to LangChain AI Agent: ${user_input}`);
    console.log(`📍 Webhook: ${n8nChatTriggerUrl}`);
    
    // Format data for LangChain Chat Trigger (FIXED: use chatInput instead of message)
    const chatPayload = {
      sessionId: session_id || 'avatar_user',
      chatInput: user_input  // LangChain expects 'chatInput', not 'message'
    };
    
    const response = await fetch(n8nChatTriggerUrl, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'User-Agent': 'HeyGen-Avatar-LangChain/1.0'
      },
      body: JSON.stringify(chatPayload)
    });

    let result;
    const responseText = await response.text();
    
    console.log('🎯 Raw n8n Response:', responseText);
    
    try {
      result = JSON.parse(responseText);
    } catch (parseError) {
      // LangChain might return plain text response
      result = { 
        output: responseText,
        response: responseText,
        raw_response: responseText 
      };
    }
    
    console.log('🎯 Parsed AI Agent Response:', result);
    
    // Check for workflow errors first
    if (result.message && result.message.includes('Error in workflow')) {
      throw new Error('n8n workflow execution error: ' + result.message);
    }
    
    // Extract the AI response for the avatar to speak (LangChain returns 'output')
    let aiResponse = '';
    if (typeof result === 'string') {
      aiResponse = result;
    } else if (result.output) {
      // LangChain AI Agent returns response in 'output' field
      aiResponse = result.output;
    } else if (result.response) {
      aiResponse = result.response;
    } else if (result.text) {
      aiResponse = result.text;
    } else if (result.message && !result.message.includes('Error')) {
      aiResponse = result.message;
    } else {
      aiResponse = result.raw_response || 'I received your message but couldn\'t process it properly.';
    }
    
    console.log('🗣️ Avatar will speak:', aiResponse);
    
    // Send the AI response back to avatar immediately
    broadcastToAvatars({
      type: 'speak_command',
      text: aiResponse,
      source: 'langchain_ai_agent',
      session_id: session_id,
      original_input: user_input
    });
    
    res.json({ 
      success: true, 
      ai_response: aiResponse,
      full_response: result,
      user_input: user_input,
      session_id: session_id,
      webhook_url: n8nChatTriggerUrl,
      processed_at: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Error with LangChain AI Agent:', error);
    
    // Send error message to avatar
    broadcastToAvatars({
      type: 'speak_command',
      text: 'I\'m having trouble processing your request right now. Please try again.',
      source: 'error_handler'
    });
    
    res.status(500).json({ 
      success: false, 
      error: 'Failed to process with LangChain AI Agent',
      details: error.message,
      user_input: user_input
    });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    connected_avatars: avatarClients.size,
    timestamp: new Date().toISOString()
  });
});

const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
  console.log(`🚀 Avatar-n8n Integration Server running on port ${PORT}`);
  console.log(`📡 WebSocket server ready for avatar connections`);
  console.log(`🔗 n8n webhook endpoints available at http://localhost:${PORT}/webhook/n8n/{workflow_id}`);
  console.log(`🎯 Avatar API endpoints available at http://localhost:${PORT}/api/avatar/*`);
});
