'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useLanguage } from '../layout';
import { apiUrl } from '../../lib/api';
import { 
  MessageSquare, 
  Send, 
  Mic, 
  MicOff,
  Volume2, 
  VolumeX, 
  FileUp, 
  Sparkles, 
  BookOpen, 
  ArrowRight,
  Loader2 
} from 'lucide-react';

interface ChatMsg {
  role: 'user' | 'assistant';
  message: string;
  sources?: string[];
  audio?: string;
}

export default function Chatbot() {
  const { language } = useLanguage();
  const [messages, setMessages] = useState<ChatMsg[]>([
    {
      role: 'assistant',
      message: "Hello! I am your AgriVerse AI Decision Assistant. I have access to ICAR manuals, KVK guidelines, and Ministry of Agriculture databases. How can I help you today?",
      sources: ["AgriVerse Knowledge Base"]
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [voiceMode, setVoiceMode] = useState(false);
  const [isListening, setIsListening] = useState(false);
  
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll to bottom of chat
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSend = async (textToSend: string) => {
    if (!textToSend.trim()) return;
    
    // Add user message
    const userMsg: ChatMsg = { role: 'user', message: textToSend };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch(apiUrl('/api/v1/chatbot/query'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: "user_session_1",
          message: textToSend,
          language: language,
          voice_response: voiceMode
        })
      });
      const data = await res.json();
      
      const assistantMsg: ChatMsg = {
        role: 'assistant',
        message: data.message,
        sources: data.sources,
        audio: data.audio_base64
      };

      setMessages((prev) => [...prev, assistantMsg]);

      // If voice mode is active and we got audio, play it
      if (voiceMode && data.audio_base64) {
        playMockAudio();
      }

    } catch (err) {
      console.error("Error querying chatbot:", err);
      // Fallback
      setMessages((prev) => [...prev, {
        role: 'assistant',
        message: "I'm having trouble reaching the AgriVerse RAG vector index. Please check if the backend server is online.",
        sources: ["System Gateway"]
      }]);
    } finally {
      setLoading(false);
    }
  };

  // Play a mock beep/chime to simulate text-to-speech
  const playMockAudio = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(440, audioCtx.currentTime); // A4 note
      gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
      
      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.3); // 300ms beep
    } catch (e) {
      console.error("Audio playback error:", e);
    }
  };

  // Handle local PDF upload
  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      setPdfFile(selected);
      setUploading(true);
      setUploadStatus(null);

      const formData = new FormData();
      formData.append('file', selected);

      try {
        const res = await fetch(apiUrl('/api/v1/chatbot/upload-pdf'), {
          method: 'POST',
          body: formData
        });
        const data = await res.json();
        setUploadStatus(`Successfully indexed: ${data.filename} (${data.chunks_extracted} chunks)`);
        
        // Add status message to chat
        setMessages((prev) => [...prev, {
          role: 'assistant',
          message: `I have successfully parsed and indexed the document "${selected.name}". You can now ask questions directly referencing its contents!`,
          sources: ["Uploaded Manual Indexer"]
        }]);
      } catch (err) {
        console.error("Error uploading PDF:", err);
        setUploadStatus("Failed to index PDF. Backend offline.");
      } finally {
        setUploading(false);
      }
    }
  };

  // Speech Recognition Simulator
  const toggleListening = () => {
    if (isListening) {
      setIsListening(false);
    } else {
      setIsListening(true);
      // Simulate speech-to-text after 3 seconds
      setTimeout(() => {
        setIsListening(false);
        setInput("What are the PM-Kisan subsidy requirements?");
      }, 3000);
    }
  };

  const suggestedQuestions = [
    "What is the organic treatment for tomato blight?",
    "How can I apply for PMFBY crop insurance?",
    "What is the recommended NPK ratio for Wheat?",
    "How does drip irrigation save water?"
  ];

  return (
    <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-4 gap-8 pb-16 h-[calc(100vh-10rem)]">
      
      {/* Left Column: Knowledge Base PDF uploads */}
      <div className="lg:col-span-1 space-y-6 flex flex-col h-full">
        
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-5 flex-1 overflow-y-auto">
          <h3 className="font-bold text-slate-800 dark:text-slate-200 text-sm flex items-center gap-2">
            <BookOpen className="h-4.5 w-4.5 text-emerald-500" />
            Knowledge Base
          </h3>
          
          <div className="space-y-4 text-xs">
            <p className="text-slate-500 leading-relaxed">
              Upload local PDF manuals, soil test reports, or farm guidelines to add them to the local RAG vector store.
            </p>

            {/* File Upload Box */}
            <div className="border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl p-4 text-center hover:border-emerald-500 transition-all cursor-pointer relative">
              <input type="file" onChange={handlePdfUpload} className="absolute inset-0 opacity-0 cursor-pointer" accept="application/pdf" />
              <FileUp className="h-8 w-8 text-slate-400 mx-auto mb-2" />
              <p className="font-bold text-slate-700 dark:text-slate-300">Upload Guideline PDF</p>
              <p className="text-[10px] text-slate-400 mt-0.5">Max size 25MB</p>
            </div>

            {uploading && (
              <div className="flex items-center gap-1.5 text-emerald-600 font-semibold">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Parsing document...
              </div>
            )}

            {uploadStatus && (
              <p className="p-2.5 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-300 rounded-lg font-semibold leading-normal">
                {uploadStatus}
              </p>
            )}
          </div>

          <div className="border-t border-slate-100 dark:border-slate-800 pt-4 space-y-3">
            <h4 className="text-xs font-bold text-slate-500">Indexed Sources:</h4>
            <ul className="text-[10px] space-y-2 text-slate-600 dark:text-slate-400 font-medium">
              <li>• ICAR Pest Mgmt Manual (2024)</li>
              <li>• KVK Fertilizer Guidelines</li>
              <li>• PMKSY Irrigation Handbook</li>
              <li>• Ministry of Agri Schemes 2025</li>
            </ul>
          </div>
        </div>

      </div>

      {/* Right Column: Chat Dialog Box */}
      <div className="lg:col-span-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm flex flex-col h-full overflow-hidden">
        
        {/* Header */}
        <header className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 rounded-xl">
              <MessageSquare className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 dark:text-slate-200 text-sm flex items-center gap-1">
                AgriVerse Decision Support Bot
                <Sparkles className="h-3.5 w-3.5 text-emerald-500" />
              </h3>
              <p className="text-[10px] text-slate-500">Retrieval-Augmented Generation (RAG) active</p>
            </div>
          </div>

          {/* Voice Response Switch */}
          <button 
            onClick={() => {
              setVoiceMode(!voiceMode);
              if(!voiceMode) playMockAudio();
            }}
            className={`p-2 rounded-xl border transition-all cursor-pointer ${
              voiceMode 
                ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400" 
                : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400"
            }`}
            title="Toggle Read Aloud (TTS)"
          >
            {voiceMode ? <Volume2 className="h-4.5 w-4.5" /> : <VolumeX className="h-4.5 w-4.5" />}
          </button>
        </header>

        {/* Message Panel */}
        <div className="flex-1 p-6 overflow-y-auto space-y-6">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex gap-3 max-w-[85%] ${
              msg.role === 'user' ? 'ml-auto flex-row-reverse' : ''
            }`}>
              {/* Avatar */}
              <div className={`h-8 w-8 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                msg.role === 'user' ? 'bg-slate-700 text-white' : 'bg-gradient-to-tr from-emerald-500 to-teal-500 text-white'
              }`}>
                {msg.role === 'user' ? 'U' : 'AI'}
              </div>

              {/* Bubble */}
              <div className="space-y-2">
                <div className={`p-4 rounded-2xl text-xs leading-relaxed ${
                  msg.role === 'user' 
                    ? 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-tr-none' 
                    : 'bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 text-slate-800 dark:text-slate-200 rounded-tl-none'
                }`}>
                  <p className="whitespace-pre-line">{msg.message}</p>
                </div>

                {/* Citations / RAG sources */}
                {msg.sources && msg.sources.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 px-2">
                    {msg.sources.map((src, sIdx) => (
                      <span key={sIdx} className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-500 text-[9px] font-bold rounded">
                        📖 Source: {src}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex gap-3 max-w-[80%]">
              <div className="h-8 w-8 rounded-lg bg-emerald-500 text-white flex items-center justify-center font-bold text-xs shrink-0">
                AI
              </div>
              <div className="p-4 bg-emerald-50/20 dark:bg-emerald-950/10 rounded-2xl rounded-tl-none flex items-center gap-2 text-xs text-slate-500">
                <Loader2 className="h-4 w-4 animate-spin text-emerald-500" />
                Searching manuals and generating prescription...
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef}></div>
        </div>

        {/* Suggested Questions */}
        <div className="px-6 py-2 border-t border-slate-100 dark:border-slate-800 flex gap-2 overflow-x-auto whitespace-nowrap scrollbar-none">
          {suggestedQuestions.map((q) => (
            <button
              key={q}
              onClick={() => handleSend(q)}
              className="px-3 py-1.5 bg-slate-50 hover:bg-emerald-50 dark:bg-slate-800 dark:hover:bg-slate-800/80 text-[10px] font-bold rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 transition-all cursor-pointer shrink-0"
            >
              {q}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <footer className="p-4 border-t border-slate-100 dark:border-slate-800 flex gap-3 items-center">
          <button 
            onClick={toggleListening}
            className={`p-3 rounded-xl border transition-all cursor-pointer shrink-0 ${
              isListening 
                ? "bg-rose-100 border-rose-300 text-rose-600 animate-pulse" 
                : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500"
            }`}
            title="Speech-to-Text Input"
          >
            {isListening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
          </button>

          <input 
            type="text" 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend(input)}
            placeholder={isListening ? "Listening to your voice..." : "Ask AgriVerse AI (e.g., 'What is the dosage of Tricyclazole?')..."}
            disabled={isListening}
            className="flex-1 px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:outline-none focus:border-emerald-500 text-slate-800 dark:text-slate-100"
          />

          <button 
            onClick={() => handleSend(input)}
            disabled={!input.trim()}
            className="p-3 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white rounded-xl shadow-md cursor-pointer shrink-0"
          >
            <Send className="h-5 w-5" />
          </button>
        </footer>

      </div>

    </div>
  );
}
