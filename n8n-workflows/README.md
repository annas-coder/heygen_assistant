# n8n Workflows for HeyGen Avatar Integration

This directory contains example n8n workflows that integrate with your HeyGen Avatar application.

## 🚀 Quick Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Start the Integration Server

```bash
npm run server
```

### 3. Start Your Avatar App

```bash
npm run dev
```

### 4. Run Both Together

```bash
npm run dev:full
```

## 🔗 Integration Endpoints

### Avatar Control Endpoints (for n8n → Avatar)

- `POST http://localhost:3001/api/avatar/speak` - Make avatar speak
- `POST http://localhost:3001/api/avatar/session/start` - Start avatar session
- `POST http://localhost:3001/api/avatar/session/stop` - Stop avatar session
- `POST http://localhost:3001/api/avatar/mode` - Switch mode (text/voice)
- `GET http://localhost:3001/api/avatar/status` - Get avatar status

### n8n Webhook Endpoints (for n8n workflows)

- `POST http://localhost:3001/webhook/n8n/chat_response` - Process chat responses
- `POST http://localhost:3001/webhook/n8n/scheduled_message` - Handle scheduled messages
- `POST http://localhost:3001/webhook/n8n/external_trigger` - Handle external triggers

### User Input Processing (Avatar → n8n)

- `POST http://localhost:3001/api/n8n/process-input` - Send user input to n8n

## 📋 Example Use Cases

### 1. **AI Chat Assistant**

- User types message → Avatar speaks it
- n8n processes input with OpenAI/ChatGPT
- n8n sends response back → Avatar speaks response

### 2. **Scheduled Announcements**

- n8n cron trigger at specific times
- Sends message to avatar to announce
- Perfect for reminders, news, weather updates

### 3. **External System Integration**

- Email received → n8n processes → Avatar announces
- Slack message → n8n formats → Avatar speaks
- Database changes → n8n detects → Avatar notifies

### 4. **Smart Home Integration**

- IoT sensor data → n8n processes → Avatar reports
- Voice commands → n8n controls devices → Avatar confirms

## 🛠️ n8n Workflow Examples

### Example 1: Make Avatar Speak

```json
{
  "method": "POST",
  "url": "http://localhost:3001/api/avatar/speak",
  "headers": {
    "Content-Type": "application/json"
  },
  "body": {
    "text": "Hello! This message came from n8n workflow.",
    "voice_settings": {}
  }
}
```

### Example 2: Process User Input

```json
{
  "method": "POST",
  "url": "http://localhost:3001/webhook/n8n/chat_response",
  "body": {
    "response_text": "Thank you for your message! I processed it with AI.",
    "original_input": "{{ $json.user_input }}",
    "processing_time": "2.3s"
  }
}
```

### Example 3: Scheduled Message

```json
{
  "method": "POST",
  "url": "http://localhost:3001/webhook/n8n/scheduled_message",
  "body": {
    "message": "Good morning! It's 9 AM. Time for your daily briefing.",
    "schedule_type": "daily",
    "time": "09:00"
  }
}
```

## 🔧 Configuration

### Environment Variables

Create a `.env` file:

```
N8N_WEBHOOK_URL=http://localhost:5678/webhook/process-user-input
PORT=3001
AVATAR_WS_PORT=3001
```

### n8n Webhook URLs

In your n8n workflows, use these webhook URLs:

- **Incoming from Avatar**: `http://localhost:5678/webhook/process-user-input`
- **Outgoing to Avatar**: `http://localhost:3001/webhook/n8n/{workflow_id}`

## 📊 Workflow Templates

### 1. **AI Chat Workflow**

1. **Webhook** - Receive user input from avatar
2. **OpenAI** - Process input with GPT
3. **HTTP Request** - Send response back to avatar
4. **Function** - Log conversation

### 2. **Scheduled Announcements**

1. **Cron** - Trigger at specific times
2. **Function** - Generate message content
3. **HTTP Request** - Send to avatar speak endpoint
4. **Slack** - Optional notification

### 3. **Email Integration**

1. **Email Trigger** - New email received
2. **Function** - Extract and format content
3. **HTTP Request** - Make avatar announce email
4. **Database** - Log email processing

### 4. **Smart Home Integration**

1. **Webhook** - IoT sensor data
2. **Function** - Process sensor values
3. **Switch** - Route based on conditions
4. **HTTP Request** - Send alerts to avatar

## 🎯 Real-Time Communication

The integration uses **WebSockets** for real-time communication:

- Avatar app connects to `ws://localhost:3001`
- Server broadcasts n8n commands to avatar
- Avatar sends status updates back to server
- n8n can trigger immediate avatar actions

## 🔍 Monitoring & Debugging

### Server Logs

The integration server logs all activities:

- WebSocket connections/disconnections
- n8n webhook calls
- Avatar command executions
- Error messages

### Status Endpoints

- `GET http://localhost:3001/health` - Server health check
- `GET http://localhost:3001/api/avatar/status` - Avatar connection status

### Browser Console

Check browser console for:

- WebSocket connection status
- n8n command reception
- Avatar response logs

## 🚨 Troubleshooting

### Common Issues:

1. **Avatar not responding to n8n commands**

   - Check WebSocket connection in browser console
   - Verify server is running on port 3001
   - Ensure avatar session is active

2. **n8n webhooks failing**

   - Verify webhook URLs are correct
   - Check CORS settings
   - Confirm server endpoints are accessible

3. **WebSocket connection issues**
   - Check firewall settings
   - Verify port 3001 is available
   - Restart both server and avatar app

### Debug Commands:

```bash
# Check if server is running
curl http://localhost:3001/health

# Test avatar speak endpoint
curl -X POST http://localhost:3001/api/avatar/speak \
  -H "Content-Type: application/json" \
  -d '{"text": "Test message from curl"}'

# Check avatar status
curl http://localhost:3001/api/avatar/status
```

## 🎉 Advanced Features

### Custom Commands

You can extend the integration by adding custom command types:

```javascript
// In server.js, add new command type
case 'custom_animation':
  broadcastToAvatars({
    type: 'custom_animation',
    animation: message.animation_type,
    duration: message.duration
  });
  break;
```

### Batch Operations

Send multiple commands in sequence:

```json
{
  "type": "batch_commands",
  "commands": [
    { "type": "speak_command", "text": "First message" },
    { "type": "mode_command", "mode": "voice" },
    { "type": "speak_command", "text": "Second message" }
  ]
}
```

Now your HeyGen Avatar is fully integrated with n8n! 🎉
