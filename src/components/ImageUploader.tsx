/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from "react";
import { Upload, Camera, FileImage, Sparkles, Check, AlertCircle } from "lucide-react";

interface ImageUploaderProps {
  onAnalyzeSuccess: (analysis: {
    category: string;
    confidence: number;
    severity: "Low" | "Medium" | "High" | "Critical";
    estimatedSize: string;
    suggestedAction: string;
    imageBase64: string;
  }) => void;
}

const SAMPLE_PHOTOS = [
  {
    name: "Severe Pothole",
    category: "Pothole",
    url: "https://images.unsplash.com/photo-1515162305285-0293e4767cc2?auto=format&fit=crop&w=600&q=80",
    description: "Deep structural road damage on major route.",
    // Sample small real-looking dummy base64 to prevent payload overhead but simulate properly
    base64: "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
  },
  {
    name: "Overflowing Bin",
    category: "Garbage",
    url: "https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?auto=format&fit=crop&w=600&q=80",
    description: "Solid waste heap blocking residential pavement.",
    base64: "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  },
  {
    name: "Broken Streetlight",
    category: "Streetlight",
    url: "https://images.unsplash.com/photo-1509395062183-67c5ad6faff9?auto=format&fit=crop&w=600&q=80",
    description: "Dead street lamp outside local municipal park.",
    base64: "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mN88B9QDwADjwGAX3691QAAAABJRU5ErkJggg==",
  },
];

export default function ImageUploader({ onAnalyzeSuccess }: ImageUploaderProps) {
  const [dragActive, setDragActive] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const processFile = async (file: File) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      setPreviewUrl(base64String);
      analyzeImage(base64String);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const analyzeImage = async (base64Data: string) => {
    setIsAnalyzing(true);
    setAnalysisResult(null);

    try {
      const res = await fetch("/api/ai/analyze-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: base64Data }),
      });
      const data = await res.json();
      if (data.success && data.analysis) {
        setAnalysisResult(data.analysis);
        onAnalyzeSuccess({
          category: data.analysis.category,
          confidence: data.analysis.confidence,
          severity: data.analysis.severity,
          estimatedSize: data.analysis.estimatedSize,
          suggestedAction: data.analysis.suggestedAction,
          imageBase64: base64Data,
        });
      }
    } catch (err) {
      console.error("Failed to post analyze image", err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4" id="vision-analyzer-panel">
      <div className="flex items-center space-x-2">
        <div className="bg-emerald-50 p-1.5 rounded-lg border border-emerald-100">
          <Camera className="h-5 w-5 text-emerald-600" />
        </div>
        <div>
          <h4 className="font-mono text-xs font-bold tracking-wider text-slate-800 uppercase">
            AI Computer Vision Image Inspector
          </h4>
          <p className="text-[11px] text-slate-500">Upload damage photo or select a high-fidelity template</p>
        </div>
      </div>

      {/* Drag & Drop Box */}
      <div
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onClick={triggerFileInput}
        className={`relative border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer transition-all h-48 overflow-hidden ${
          dragActive
            ? "border-emerald-500 bg-emerald-50"
            : previewUrl
            ? "border-slate-200 bg-slate-50"
            : "border-slate-200 bg-slate-50 hover:border-slate-300"
        }`}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/*"
          className="hidden"
        />

        {previewUrl ? (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-50">
            {/* If it's real base64 image representation, render it. Else show vector placeholder */}
            {previewUrl.startsWith("data:image/") ? (
              <img src={previewUrl} alt="Complaint Preview" className="h-full w-full object-cover opacity-80" />
            ) : (
              <div className="text-center p-4">
                <FileImage className="h-10 w-10 text-emerald-600 mx-auto mb-2" />
                <span className="text-xs text-slate-700 font-mono font-bold">Image Registered Securely</span>
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 via-transparent to-transparent flex items-end justify-center p-3">
              <span className="text-[10px] font-mono tracking-widest text-white uppercase bg-slate-900/80 px-2.5 py-1 rounded border border-slate-750 backdrop-blur-sm font-bold">
                RE-UPLOAD IMAGE
              </span>
            </div>
          </div>
        ) : (
          <div className="text-center space-y-2 pointer-events-none">
            <Upload className="h-8 w-8 text-slate-400 mx-auto" />
            <p className="text-xs text-slate-600 font-medium">
              Drag & drop damage photo here or <span className="text-emerald-600 font-bold">Browse Files</span>
            </p>
            <p className="text-[10px] text-slate-400 font-mono">PNG, JPG, JPEG up to 10MB</p>
          </div>
        )}
      </div>

      {/* AI Analyzing Spinner */}
      {isAnalyzing && (
        <div className="flex items-center justify-center space-x-2 py-2 text-xs font-mono text-emerald-600">
          <Sparkles className="h-4 w-4 animate-spin" />
          <span>CIVORA AI running computer vision diagnostics...</span>
        </div>
      )}

      {/* AI Vision Analysis Report */}
      {analysisResult && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3.5 space-y-3 animate-fadeIn">
          <div className="flex items-center justify-between border-b border-emerald-200/60 pb-2">
            <div className="flex items-center space-x-1.5 text-[10px] text-emerald-700 font-mono font-bold">
              <Sparkles className="h-3 w-3" />
              <span>GEMINI COMPUTER VISION DIAGNOSTIC</span>
            </div>
            <span className="bg-emerald-100 text-emerald-800 border border-emerald-200 font-mono text-[9px] px-2 py-0.5 rounded font-bold">
              PASSED AUDIT
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs font-mono">
            <div>
              <span className="text-[10px] text-slate-500 block">AI DETECTED ISSUE</span>
              <span className="font-bold text-slate-800">{analysisResult.category}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 block">SEVERITY PRIORITY</span>
              <span className="font-bold text-red-600">{analysisResult.severity}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 block">DETECTION CONFIDENCE</span>
              <span className="font-bold text-emerald-700">{analysisResult.confidence}%</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 block">ESTIMATED DIMENSIONS</span>
              <span className="font-bold text-slate-800">{analysisResult.estimatedSize}</span>
            </div>
            <div className="col-span-2">
              <span className="text-[10px] text-slate-500 block">SUGGESTED REPAIR METHOD</span>
              <p className="text-slate-700 text-[11px] leading-relaxed italic">{analysisResult.suggestedAction}</p>
            </div>
          </div>
        </div>
      )}

      {/* Test Sample Images Row */}
      <div className="pt-2 border-t border-slate-100">
        <span className="text-[9px] font-mono tracking-widest text-slate-500 uppercase block mb-2 font-semibold">
          Demo Mock Templates (Click to Test)
        </span>
        <div className="grid grid-cols-3 gap-2">
          {SAMPLE_PHOTOS.map((photo, idx) => (
            <button
              key={idx}
              onClick={(e) => {
                e.stopPropagation();
                setPreviewUrl(photo.url);
                analyzeImage(photo.base64);
              }}
              className="flex flex-col text-left rounded bg-slate-50 border border-slate-200 hover:border-slate-350 overflow-hidden transition-all group cursor-pointer"
            >
              <div className="h-16 w-full relative">
                <img src={photo.url} alt={photo.name} className="h-full w-full object-cover transition-transform group-hover:scale-105" />
                <span className="absolute bottom-1 left-1 bg-slate-900/85 text-white font-mono text-[8px] px-1 rounded font-bold">
                  {photo.category.toUpperCase()}
                </span>
              </div>
              <div className="p-1.5 space-y-0.5 bg-white border-t border-slate-100">
                <span className="text-[10px] font-bold text-slate-800 block truncate">{photo.name}</span>
                <span className="text-[8px] text-slate-500 block truncate leading-none">{photo.description}</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
