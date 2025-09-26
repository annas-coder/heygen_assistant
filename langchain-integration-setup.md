# 🧠 LangChain AI Agent Integration Setup

Your n8n workflow uses **LangChain AI Agent with GPT-4 and Memory** - perfect for intelligent avatar conversations!

## 🎯 **Your Workflow Structure:**

```
Chat Trigger → AI Agent → OpenAI GPT-4.1-mini → Memory Buffer
```

**Key Features:**

- 🧠 **AI Agent**: LangChain conversational agent
- 💭 **Memory**: Remembers conversation context per session
- 🚀 **GPT-4.1-mini**: Latest OpenAI model
- 📡 **Chat Trigger**: Webhook ID `be9313fc-404c-4874-bc51-8d2d857cb939`

## 🚀 **Setup Steps:**

### **Step 1: Get Your Chat Trigger URL**

Your chat trigger webhook URL should look like:

```
https://your-instance.app.n8n.cloud/webhook/be9313fc-404c-4874-bc51-8d2d857cb939
```

**To find it:**

1. Open your n8n workflow
2. Click on the **"When chat message received"** node
3. Copy the **Production URL**

### **Step 2: Configure the Integration**

1. **Edit `n8n-cloud-config.env`**:

   ```env
   N8N_CHAT_WEBHOOK_URL=https://your-instance.app.n8n.cloud/webhook/be9313fc-404c-4874-bc51-8d2d857cb939
   ```

   Replace `your-instance` with your actual n8n cloud instance name.

2. **Load environment variables**:

   ```bash
   # Windows
   copy n8n-cloud-config.env .env

   # Mac/Linux
   cp n8n-cloud-config.env .env
   ```

### **Step 3: Install Dependencies & Start**

```bash
# Install required packages
npm install express cors body-parser ws concurrently

# Start the integration server
npm run server

# In another terminal, start avatar app
npm run dev
```

## 🔄 **How It Works:**

```
1. User types message → Avatar App
2. Avatar App → Integration Server
3. Integration Server → n8n Chat Trigger
4. Chat Trigger → AI Agent → OpenAI GPT-4 → Memory
5. AI Response → Integration Server
6. Integration Server → Avatar speaks response
```

## 📡 **Data Flow:**

### **Avatar → n8n (Input)**

```json
{
  "sessionId": "avatar_user",
  "message": "What is the Burj Khalifa?",
  "timestamp": "2024-01-01T12:00:00.000Z",
  "source": "heygen_avatar"
}
```

### **n8n → Avatar (Output)**

The AI Agent's response text will be automatically spoken by the avatar.

## 🧪 **Testing Your Integration:**

### **Test 1: Direct Chat Trigger Test**

```bash
curl -X POST "https://your-instance.app.n8n.cloud/webhook/be9313fc-404c-4874-bc51-8d2d857cb939" \
  -H "Content-Type: application/json" \
  -d '{"sessionId": "test_user", "message": "Hello, how are you?"}'
```

### **Test 2: Full Avatar Integration Test**

1. **Start your servers**: `npm run server` and `npm run dev`
2. **Open avatar**: http://localhost:5177
3. **Start session** and type: "Tell me about the Burj Khalifa"
4. **Avatar should speak** the AI agent's response

### **Test 3: Memory Test**

1. **Ask**: "What is 2+2?"
2. **Then ask**: "What did I just ask you?"
3. **AI should remember** the previous question due to memory buffer

## 🎛️ **Advanced Configuration:**

### **Custom Session Management**

Each avatar user gets their own memory session:

```javascript
// In your n8n workflow, sessions are managed by:
sessionId: session_id || "avatar_user";
```

### **Memory Buffer Settings**

Your workflow uses **Simple Memory (Buffer Window)** which:

- ✅ Remembers conversation history
- ✅ Maintains context across messages
- ✅ Automatically manages session keys

### **AI Agent Capabilities**

Your AI Agent can:

- 🧠 **Reason** through complex questions
- 💭 **Remember** previous conversations
- 🔄 **Chain** multiple thoughts together
- 🎯 **Provide** contextual responses

## 🔧 **Troubleshooting:**

### **Common Issues:**

1. **"AI Agent not responding"**

   - Check your OpenAI API credentials in n8n
   - Verify chat trigger webhook URL is correct
   - Check n8n execution logs

2. **"Memory not working"**

   - Ensure sessionId is being passed correctly
   - Check Simple Memory node configuration
   - Verify session key format

3. **"Avatar not speaking responses"**
   - Check integration server logs
   - Verify WebSocket connection
   - Test direct API endpoint

### **Debug Commands:**

```bash
# Check server health
curl http://localhost:3001/health

# Test AI processing
curl -X POST http://localhost:3001/api/n8n/process-input \
  -H "Content-Type: application/json" \
  -d '{"user_input": "Hello AI!", "session_id": "debug_user"}'

# Check avatar connection
# Look for "n8n" green indicator in avatar status bar
```

## 🎉 **What Your Avatar Can Now Do:**

✅ **Intelligent Conversations** - Powered by GPT-4.1-mini  
✅ **Remember Context** - Maintains conversation history  
✅ **Complex Reasoning** - LangChain AI Agent capabilities  
✅ **Session Management** - Different users, different memories  
✅ **Real-time Responses** - Instant avatar speech

## 📈 **Next Steps:**

### **Enhance Your AI Agent:**

1. **Add Tools** - Calculator, web search, APIs
2. **Custom Prompts** - Specialized knowledge domains
3. **Multiple Agents** - Different personalities/roles
4. **External Data** - Connect databases, APIs

### **Example Tool Addition:**

In your n8n workflow, you can add tool nodes:

```
Chat Trigger → AI Agent → [Calculator Tool] → OpenAI → Memory
                      → [Web Search Tool] ↗
                      → [Database Tool] ↗
```

**Your LangChain AI Agent integration is ready! 🚀**

The avatar will now have intelligent conversations with memory, powered by your GPT-4 AI agent!
