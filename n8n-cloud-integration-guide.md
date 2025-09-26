# 🌐 n8n Cloud Integration Guide

This guide helps you connect your existing n8n cloud workflow to your HeyGen Avatar application.

## 🚀 Quick Setup Steps

### **Step 1: Get Your n8n Cloud Webhook URL**

1. **Open your n8n cloud workflow**
2. **Find the Webhook node** (or add one if you don't have it)
3. **Copy the webhook URL** - it looks like:
   ```
   https://your-instance.app.n8n.cloud/webhook/your-webhook-id
   ```
4. **Save this URL** - you'll need it in Step 3

### **Step 2: Configure Your Workflow to Receive Avatar Data**

Your webhook node should expect this JSON structure from the avatar:

```json
{
  "user_input": "Hello, how are you?",
  "session_id": "avatar_session_123",
  "timestamp": "2024-01-01T12:00:00.000Z",
  "source": "avatar_app",
  "avatar_session_active": true
}
```

### **Step 3: Configure Avatar Integration**

1. **Copy your webhook URL** from Step 1
2. **Replace the URL** in `n8n-cloud-config.env`:
   ```env
   N8N_CLOUD_WEBHOOK_URL=https://your-instance.app.n8n.cloud/webhook/your-webhook-id
   ```
3. **Load the environment variables**:

   ```bash
   # Windows
   copy n8n-cloud-config.env .env

   # Mac/Linux
   cp n8n-cloud-config.env .env
   ```

### **Step 4: Start the Integration Server**

```bash
npm install express cors body-parser ws concurrently
npm run server
```

### **Step 5: Test the Integration**

1. **Start your avatar app**: `npm run dev`
2. **Start a session** and type a message
3. **Check n8n cloud** - your workflow should receive the data
4. **Check browser console** - you should see n8n connection status

## 🔗 **Integration Flow**

```
User types message → Avatar App → Integration Server → n8n Cloud Workflow
                                                            ↓
Avatar speaks response ← Integration Server ← n8n processes & responds
```

## 🛠️ **n8n Cloud Workflow Setup**

### **Method 1: Webhook → Process → HTTP Response (Recommended)**

```
[Webhook] → [Your Processing Nodes] → [HTTP Request to Avatar]
```

**Webhook Node Configuration:**

- **HTTP Method**: POST
- **Path**: `/webhook/your-custom-path`
- **Response**: Return data immediately or use "Respond to Webhook" node

**HTTP Request Node (to send response back to avatar):**

- **URL**: `http://YOUR_PUBLIC_IP:3001/webhook/n8n/chat_response`
- **Method**: POST
- **Body**:

```json
{
  "response_text": "{{ your_processed_response }}",
  "original_input": "{{ $json.user_input }}",
  "session_id": "{{ $json.session_id }}"
}
```

### **Method 2: Webhook Only (Simple)**

```
[Webhook] → [Your Processing Nodes]
```

Just receive the data and process it. The avatar will wait for your response.

## 🌍 **Public Access Setup (Important!)**

Since n8n cloud needs to send responses back to your avatar, you need to make your local server publicly accessible:

### **Option 1: Using ngrok (Recommended)**

```bash
# Install ngrok
npm install -g ngrok

# Expose your local server
ngrok http 3001
```

Copy the ngrok URL (e.g., `https://abc123.ngrok.io`) and use it in your n8n workflow instead of `http://localhost:3001`.

### **Option 2: Using Cloudflare Tunnel**

```bash
# Install cloudflared
# Follow: https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/

# Create tunnel
cloudflared tunnel --url http://localhost:3001
```

### **Option 3: Deploy to Cloud (Production)**

Deploy your integration server to:

- **Heroku**: `git push heroku main`
- **Railway**: `railway deploy`
- **Vercel**: `vercel deploy`

## 📋 **Example n8n Cloud Workflows**

### **1. Simple Echo Workflow**

```json
Webhook → Function → HTTP Request
```

**Function Node Code:**

```javascript
return {
  response_text: `You said: "${
    $json.user_input
  }". Message received at ${new Date().toLocaleTimeString()}!`,
  original_input: $json.user_input,
  session_id: $json.session_id,
};
```

### **2. AI Chat Workflow**

```json
Webhook → OpenAI → Function → HTTP Request
```

**OpenAI Node:**

- **Model**: gpt-3.5-turbo
- **Messages**:
  ```json
  [
    {
      "role": "system",
      "content": "You are a helpful assistant speaking through an avatar."
    },
    { "role": "user", "content": "{{ $json.user_input }}" }
  ]
  ```

### **3. Database + AI Workflow**

```json
Webhook → Database Query → OpenAI → Database Insert → HTTP Request
```

## 🧪 **Testing Your Integration**

### **Test 1: Direct Webhook Test**

```bash
curl -X POST "https://your-instance.app.n8n.cloud/webhook/your-webhook-id" \
  -H "Content-Type: application/json" \
  -d '{"user_input": "Hello from curl!", "session_id": "test_session"}'
```

### **Test 2: Full Avatar Integration Test**

1. Start your avatar app
2. Start a session
3. Type: "Hello, this is a test message"
4. Check n8n cloud execution log
5. Avatar should speak the response

### **Test 3: Server Health Check**

```bash
curl http://localhost:3001/health
```

Should return:

```json
{
  "status": "healthy",
  "connected_avatars": 1,
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

## 🔧 **Troubleshooting**

### **Common Issues:**

1. **"n8n offline" in avatar status**

   - Check if integration server is running
   - Verify WebSocket connection in browser console

2. **Webhook not receiving data**

   - Verify webhook URL in environment config
   - Check n8n cloud execution logs
   - Test webhook with curl

3. **Avatar not speaking n8n responses**

   - Ensure n8n sends response to correct endpoint
   - Check if your server is publicly accessible
   - Verify response format matches expected structure

4. **CORS errors**
   - Server includes CORS headers
   - Check browser network tab for blocked requests

### **Debug Commands:**

```bash
# Check server logs
npm run server

# Test webhook endpoint
curl -X POST http://localhost:3001/api/n8n/process-input \
  -H "Content-Type: application/json" \
  -d '{"user_input": "test", "session_id": "debug"}'

# Check avatar status
curl http://localhost:3001/api/avatar/status
```

## 🎯 **Advanced Features**

### **Custom Commands**

Add custom command handling in your n8n workflow:

```javascript
// In n8n Function node
const input = $json.user_input.toLowerCase();

if (input.includes("weather")) {
  return { command: "get_weather", location: "New York" };
} else if (input.includes("time")) {
  return { command: "get_time", timezone: "UTC" };
} else {
  return { command: "chat", message: input };
}
```

### **Session Management**

Track conversation history:

```javascript
// Store in n8n workflow memory
const sessionId = $json.session_id;
const conversations = $getWorkflowStaticData("global");

if (!conversations[sessionId]) {
  conversations[sessionId] = [];
}

conversations[sessionId].push({
  user: $json.user_input,
  timestamp: $json.timestamp,
});
```

### **Multi-Avatar Support**

Handle multiple avatar instances:

```javascript
// Route based on session_id
const sessionId = $json.session_id;
const avatarType = sessionId.includes("sales")
  ? "sales_avatar"
  : "general_avatar";

return {
  avatar_type: avatarType,
  response_text: `Hello from ${avatarType}!`,
};
```

## 🎉 **You're Ready!**

Your n8n cloud workflow is now connected to your HeyGen avatar!

**Next Steps:**

1. Create more complex workflows
2. Add database integration
3. Connect external APIs
4. Set up monitoring and logging

**Need help?** Check the browser console and server logs for detailed debugging information.
