import React, { useState } from "react";

export default function HeyGenChat() {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [videoUrl, setVideoUrl] = useState("");

  const handleAsk = async () => {
    try {
      const response = await fetch("http://localhost:4000/heygen", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question })
      });
      const data = await response.json();
      setAnswer(data.answer);
      if (data.video_url) setVideoUrl(data.video_url);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div>
      <h1>HeyGen AI Chat</h1>
      <input
        type="text"
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
        placeholder="Ask a question..."
      />
      <button onClick={handleAsk}>Ask</button>

      {answer && <p>Answer: {answer}</p>}

      {videoUrl && (
        <video width="400" controls>
          <source src={videoUrl} type="video/mp4" />
          Your browser does not support HTML video.
        </video>
      )}
    </div>
  );
}
