"use client";

import { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import Sidebar from "../components/Sidebar";

export default function Chat() {

  const [historyData, setHistoryData] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  // ================= LOAD HISTORY =================
  useEffect(() => {

    const unsub = onAuthStateChanged(auth, async (u) => {

      if (!u) return;

      const profileId = localStorage.getItem("activeProfile");
      if (!profileId) return;

      const snap = await getDocs(
        collection(db, "profiles", profileId, "reports")
      );

      const reports: any[] = [];

      snap.forEach((doc) => {
        reports.push(doc.data());
      });

      setHistoryData(reports);

    });

    return () => unsub();

  }, []);

  // ================= SEND MESSAGE =================
  async function sendMessage(customText?: string) {

    const text = customText || input;

    if (!text.trim()) return;

    const userMsg = { role: "user", content: text };

    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: text,
          reports: historyData, // 🔥 ALL REPORTS CONTEXT
          conversation: messages
        }),
      });

      const data = await res.json();

      const aiMsg = {
        role: "assistant",
        content: data.reply || "No response from AI",
      };

      setMessages(prev => [...prev, aiMsg]);

    } catch (err) {
      console.error(err);

      setMessages(prev => [
        ...prev,
        { role: "assistant", content: "Error connecting to AI" }
      ]);
    }

    setLoading(false);
  }

  // ================= CLEAR CHAT =================
  function clearChat() {
    setMessages([]);
  }

  // ================= SUGGESTIONS =================
  const suggestions = [
    "Why is my sugar increasing?",
    "Should I be worried about my cholesterol?",
    "What lifestyle changes should I make?",
    "Is my BP trend dangerous?",
  ];

  return (
    <div className="flex min-h-screen bg-gray-900 text-white">

      <Sidebar />

      <main className="flex-1 p-6 flex flex-col">

        <div className="flex justify-between items-center mb-4">
          <h1 className="text-3xl font-bold text-blue-400">
            🤖 AI Health Assistant
          </h1>

          <button
            onClick={clearChat}
            className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded font-semibold"
          >
            Clear Chat
          </button>
        </div>

        {/* Chat Window */}
        <div className="flex-1 overflow-y-auto space-y-6 bg-gray-800 p-6 rounded-2xl shadow-inner">

          {messages.length === 0 && (
            <div className="text-gray-400">
              Ask anything about your health history.
            </div>
          )}

          {messages.map((m, i) => (
            <div
              key={i}
              className={`p-4 rounded-xl max-w-xl shadow ${
                m.role === "user"
                  ? "bg-blue-600 ml-auto"
                  : "bg-gray-700"
              }`}
            >
              {m.content}
            </div>
          ))}

          {loading && (
            <div className="bg-gray-700 p-3 rounded w-fit animate-pulse">
              AI is typing...
            </div>
          )}

        </div>

        {/* Suggestions */}
        {messages.length === 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {suggestions.map((s, i) => (
              <button
                key={i}
                onClick={() => sendMessage(s)}
                className="bg-gray-700 hover:bg-gray-600 px-3 py-2 rounded text-sm"
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {/* Input */}
        <div className="mt-4 flex gap-2">

          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about your health..."
            className="flex-1 p-3 rounded bg-gray-800 border border-gray-700"
          />

          <button
            onClick={() => sendMessage()}
            className="bg-green-600 hover:bg-green-700 px-6 rounded font-semibold"
          >
            Send
          </button>

        </div>

      </main>

    </div>
  );
}