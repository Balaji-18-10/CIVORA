/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { Mic, MicOff, Sparkles, Languages, Check, ArrowRight } from "lucide-react";

interface VoiceInputProps {
  onExtractSuccess: (extracted: {
    complaint: string;
    location: string | null;
    category: string;
    priority: number;
  }) => void;
}

const VOICE_PRESETS = [
  {
    language: "English",
    label: "English: Pipe Burst near School",
    transcript: "Water is overflowing heavily from a burst pipeline near MG Road primary school, causing major waterlogging right outside the entrance.",
  },
  {
    language: "Tamil",
    label: "Tamil: Garbage Blockage (குப்பை குவியல்)",
    transcript: "சென்னை மெயின் ரோட்டில் பெரிய குப்பை குவியல் சேர்ந்துள்ளது, கழிவுநீர் வெளியேற முடியாமல் துர்நாற்றம் வீசுகிறது. உடனடியாக அகற்றவும்.",
  },
  {
    language: "Hindi",
    label: "Hindi: Hazardous Pothole (बड़ा गढ्ढा)",
    transcript: "सड़क के बीचों-बीच बहुत बड़ा गढ्ढा है जिससे रात को गाड़ियां टकरा रही हैं, बहुत खतरनाक है और दुर्घटना हो सकती है।",
  },
];

export default function VoiceInput({ onExtractSuccess }: VoiceInputProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState("English");
  const [transcript, setTranscript] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [extractionResult, setExtractionResult] = useState<any | null>(null);

  const startRecording = () => {
    setIsRecording(true);
    setTranscript("");
    setExtractionResult(null);

    // Simulate microphone capture and typing effect
    const randomPreset = VOICE_PRESETS.find((p) => p.language === selectedLanguage) || VOICE_PRESETS[0];

    let currentString = "";
    const words = randomPreset.transcript.split(" ");
    let i = 0;

    const interval = setInterval(() => {
      if (i < words.length) {
        currentString += (i === 0 ? "" : " ") + words[i];
        setTranscript(currentString);
        i++;
      } else {
        clearInterval(interval);
        setIsRecording(false);
        // Automatically analyze speech with Gemini NLP on the server!
        analyzeSpeechText(randomPreset.transcript);
      }
    }, 150);
  };

  const stopRecording = () => {
    setIsRecording(false);
  };

  const analyzeSpeechText = async (text: string) => {
    setIsAnalyzing(true);
    try {
      const res = await fetch("/api/ai/voice-extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ voiceText: text, language: selectedLanguage }),
      });
      const data = await res.json();
      if (data.success && data.extracted) {
        setExtractionResult(data.extracted);
        onExtractSuccess(data.extracted);
      }
    } catch (err) {
      console.error("Error analyzing speech text:", err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4" id="voice-compiler-panel">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="bg-blue-50 p-1.5 rounded-lg border border-blue-100">
            <Mic className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h4 className="font-mono text-xs font-bold tracking-wider text-slate-800 uppercase">
              AI Speech Translation & NLP Extraction
            </h4>
            <p className="text-[11px] text-slate-500 font-medium">Speak or select a native language voice sample</p>
          </div>
        </div>

        {/* Language selector */}
        <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-lg border border-slate-200">
          {["English", "Tamil", "Hindi"].map((lang) => (
            <button
              key={lang}
              onClick={() => setSelectedLanguage(lang)}
              disabled={isRecording}
              className={`px-2.5 py-1 text-[10px] rounded font-mono uppercase transition-all cursor-pointer ${
                selectedLanguage === lang ? "bg-white text-blue-600 font-bold border border-slate-200 shadow-sm" : "text-slate-500 hover:text-slate-850"
              }`}
            >
              {lang}
            </button>
          ))}
        </div>
      </div>

      {/* Main Microphone Button & Waveforms */}
      <div className="flex flex-col items-center justify-center py-6 bg-slate-50 rounded-lg border border-slate-200 relative overflow-hidden">
        {isRecording ? (
          <div className="flex items-center space-x-1.5 mb-4">
            <span className="h-4 w-1 bg-blue-500 rounded animate-bounce" style={{ animationDelay: "0ms" }} />
            <span className="h-6 w-1 bg-blue-500 rounded animate-bounce" style={{ animationDelay: "150ms" }} />
            <span className="h-8 w-1 bg-blue-500 rounded animate-bounce" style={{ animationDelay: "300ms" }} />
            <span className="h-5 w-1 bg-blue-500 rounded animate-bounce" style={{ animationDelay: "450ms" }} />
            <span className="h-3 w-1 bg-blue-500 rounded animate-bounce" style={{ animationDelay: "600ms" }} />
          </div>
        ) : (
          <div className="h-8 mb-4" />
        )}

        <button
          onClick={isRecording ? stopRecording : startRecording}
          disabled={isAnalyzing}
          className={`h-16 w-16 rounded-full flex items-center justify-center transition-all shadow-md cursor-pointer ${
            isRecording
              ? "bg-red-500 hover:bg-red-600 animate-pulse text-white ring-4 ring-red-500/10"
              : "bg-blue-600 hover:bg-blue-700 text-white hover:scale-105 active:scale-95 ring-4 ring-blue-500/10"
          }`}
        >
          {isRecording ? <MicOff className="h-7 w-7" /> : <Mic className="h-7 w-7" />}
        </button>

        <p className="mt-4 text-[11px] font-mono tracking-wider text-slate-500 font-semibold">
          {isRecording
            ? `RECORDING ACTIVE (${selectedLanguage})...`
            : isAnalyzing
            ? "GEMINI NLP PARSING AUDIO FEED..."
            : "CLICK MICROPHONE TO SIMULATE SPEECH"}
        </p>
      </div>

      {/* Spoken Transcript Area */}
      {transcript && (
        <div className="bg-white border border-slate-200 rounded-lg p-3 shadow-sm">
          <span className="text-[9px] font-mono tracking-widest text-blue-600 uppercase font-bold block mb-1">
            STT Compiled Transcript
          </span>
          <p className="text-xs text-slate-700 leading-relaxed italic">"{transcript}"</p>
        </div>
      )}

      {/* Gemini NLP Structured Output */}
      {isAnalyzing && (
        <div className="flex items-center justify-center space-x-2 py-2 text-xs font-mono text-blue-600">
          <Sparkles className="h-4 w-4 animate-spin" />
          <span>Gemini AI extracting: Category, Location, Priority...</span>
        </div>
      )}

      {extractionResult && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 space-y-2 animate-fadeIn">
          <div className="flex items-center justify-between border-b border-blue-200/60 pb-1.5">
            <div className="flex items-center space-x-1.5 text-[10px] text-blue-700 font-mono font-bold">
              <Sparkles className="h-3 w-3" />
              <span>GEMINI NLP EXTRACTION SUCCESS</span>
            </div>
            <span className="bg-blue-100 text-blue-800 border border-blue-200 font-mono text-[9px] px-1.5 py-0.5 rounded font-bold">
              AUTO-FILL READY
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs font-mono">
            <div>
              <span className="text-[10px] text-slate-500 block">EXTRACTED CATEGORY</span>
              <span className="font-bold text-slate-800">{extractionResult.category}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 block">PRIORITY METRIC</span>
              <span className="font-bold text-red-600">{extractionResult.priority}/100</span>
            </div>
            <div className="col-span-2">
              <span className="text-[10px] text-slate-500 block">EXTRACTED LOCATION</span>
              <span className="font-bold text-slate-800">
                {extractionResult.location || "Auto-detected GPS Center"}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Presets List */}
      <div className="pt-2 border-t border-slate-100">
        <span className="text-[9px] font-mono tracking-widest text-slate-500 uppercase block mb-2 font-semibold">
          Language Presets (Test Triggers)
        </span>
        <div className="grid grid-cols-1 gap-1.5">
          {VOICE_PRESETS.map((preset, idx) => (
            <button
              key={idx}
              onClick={() => {
                setSelectedLanguage(preset.language);
                setTranscript(preset.transcript);
                analyzeSpeechText(preset.transcript);
              }}
              className="flex items-center justify-between p-2 rounded bg-slate-50 border border-slate-200 hover:border-slate-350 hover:bg-slate-100/50 transition-all text-left text-[11px] cursor-pointer"
            >
              <span className="text-slate-700 font-medium">{preset.label}</span>
              <ArrowRight className="h-3.5 w-3.5 text-slate-400" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
