# 🔧 n8n LangChain Workflow Troubleshooting

## ❌ **Current Issue: "Error in workflow" (HTTP 500)**

Your n8n workflow is returning:

```json
{ "message": "Error in workflow" }
```

This is a **500 Internal Server Error**, meaning there's an execution error in your LangChain workflow.

## 🧐 **Common Causes & Solutions:**

### **1. OpenAI API Key Issues**

**Most Common Cause**: Invalid or missing OpenAI API credentials.

**Check:**

1. Go to your n8n workflow
2. Click on **"OpenAI Chat Model"** node
3. Check **Credentials** → **"openai(ram sir)"**
4. Verify the API key is valid and has credits

**Fix:**

- Update your OpenAI API key in n8n credentials
- Ensure the API key has sufficient credits
- Test the credentials in n8n

### **2. LangChain Memory Configuration**

**Issue**: Session key format or memory buffer settings.

**Check:**

1. Click on **"Simple Memory"** node
2. Verify **Session Key** setting: `sessionKey = {{$json["sessionId"]}}`
3. Should be: `sessionKey = {{ $json.sessionId }}`

**Fix:**

```javascript
// In Simple Memory node, Session Key should be:
{
  {
    $json.sessionId;
  }
}
```

### **3. Chat Trigger Input Format**

**Issue**: Chat Trigger expecting different data format.

**Current Format** (what we're sending):

```json
{
  "sessionId": "test_user",
  "message": "Hello, how are you?"
}
```

**Try Alternative Format**:

```json
{
  "sessionId": "test_user",
  "chatInput": "Hello, how are you?"
}
```

### **4. AI Agent Configuration**

**Issue**: AI Agent node missing required connections or settings.

**Check:**

1. **AI Agent** node has connections from:
   - ✅ OpenAI Chat Model (ai_languageModel)
   - ✅ Simple Memory (ai_memory)
2. **AI Agent** node receives input from:
   - ✅ Chat Trigger (main)

## 🛠️ **Step-by-Step Fix Guide:**

### **Step 1: Check n8n Execution Logs**

1. **Go to your n8n cloud dashboard**
2. **Click "Executions"** in the left sidebar
3. **Find the failed executions** (red X marks)
4. **Click on a failed execution** to see detailed error

### **Step 2: Test OpenAI Connection**

1. **In your workflow, click "OpenAI Chat Model"**
2. **Click "Test step"** or **"Execute node"**
3. **Check if it returns a response**
4. **If error**: Update API key in credentials

### **Step 3: Fix Memory Session Key**

1. **Click "Simple Memory" node**
2. **In "Session Key" field**, change from:
   ```
   sessionKey = {{$json["sessionId"]}}
   ```
   **To:**
   ```
   {{ $json.sessionId }}
   ```

### **Step 4: Test Chat Trigger Format**

Try this alternative payload format:

```json
{
  "sessionId": "test_user",
  "chatInput": "Hello, how are you?"
}
```

### **Step 5: Simplify for Testing**

**Create a minimal test workflow:**

1. **Chat Trigger** → **Function Node** → **Return Response**

**Function Node Code:**

```javascript
return {
  response: `Echo: ${$json.message || $json.chatInput}`,
  sessionId: $json.sessionId,
};
```

## 🧪 **Testing Different Formats:**

Let me create test scripts for different payload formats:

### **Format 1: Current**

```json
{ "sessionId": "test", "message": "hello" }
```

### **Format 2: chatInput**

```json
{ "sessionId": "test", "chatInput": "hello" }
```

### **Format 3: Simple**

```json
{ "message": "hello" }
```

## 🔍 **Debug Your Workflow:**

### **Method 1: n8n Execution Logs**

1. **n8n Dashboard** → **Executions**
2. **Find the 500 error execution**
3. **Click to see detailed error message**
4. **Look for specific error (OpenAI, Memory, etc.)**

### **Method 2: Manual Test in n8n**

1. **Open your workflow in n8n**
2. **Click "Test workflow" button**
3. **Manually trigger with test data**
4. **See which node fails**

### **Method 3: Simplify Workflow**

**Temporarily remove complexity:**

1. **Disconnect Memory** from AI Agent
2. **Test with just**: Chat Trigger → AI Agent → OpenAI
3. **If works**: Memory is the issue
4. **If fails**: OpenAI credentials issue

## 🎯 **Most Likely Solutions:**

### **Solution 1: Fix OpenAI API Key**

```
1. Go to n8n → Credentials → "openai(ram sir)"
2. Update with valid OpenAI API key
3. Save and test
```

### **Solution 2: Fix Memory Session Key**

```
Simple Memory node → Session Key field:
Change: sessionKey = {{$json["sessionId"]}}
To: {{ $json.sessionId }}
```

### **Solution 3: Alternative Chat Input**

```javascript
// Try changing our integration to send:
{
  "sessionId": "avatar_user",
  "chatInput": user_input  // instead of "message"
}
```

## 🚀 **Quick Test Script:**

I'll create a test script that tries multiple formats to find what works:

```javascript
// Test multiple payload formats
const formats = [
  { sessionId: "test", message: "hello" },
  { sessionId: "test", chatInput: "hello" },
  { message: "hello" },
  { chatInput: "hello" },
  { sessionId: "test", input: "hello" },
];
```

## 📋 **Action Items:**

1. **Check n8n execution logs** for specific error
2. **Verify OpenAI API key** is valid and has credits
3. **Fix Memory session key format** if needed
4. **Test different input formats**
5. **Simplify workflow** for testing

**Let me know what you find in the n8n execution logs, and I'll help you fix the specific error!** 🔧
