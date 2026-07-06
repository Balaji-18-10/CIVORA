/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { AlertTriangle, ThumbsUp, MapPin, Sparkles } from "lucide-react";
import { Complaint } from "../types";

interface DuplicateWarningProps {
  duplicates: Complaint[];
  onSupportDuplicate: (complaintId: string) => void;
  isVoting: boolean;
}

export default function DuplicateWarning({ duplicates, onSupportDuplicate, isVoting }: DuplicateWarningProps) {
  if (duplicates.length === 0) return null;

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-3" id="duplicate-protection-panel">
      <div className="flex items-start space-x-2.5">
        <div className="bg-amber-100 p-1.5 rounded-lg text-amber-700 shrink-0 border border-amber-200">
          <AlertTriangle className="h-5 w-5" />
        </div>
        <div>
          <h4 className="font-mono text-xs font-bold tracking-wider text-amber-800 uppercase">
            INTELLIGENT DUPLICATE SPAM WARNING
          </h4>
          <p className="text-[11px] text-slate-700 mt-0.5">
            We detected active complaints matching this category within <span className="font-bold text-amber-700">20 meters</span> of your location.
          </p>
        </div>
      </div>

      <div className="space-y-2.5 pt-1">
        {duplicates.map((dup) => (
          <div
            key={dup.id}
            className="bg-white border border-slate-200 rounded-lg p-3 flex flex-wrap items-center justify-between gap-3 hover:border-slate-300 transition-all shadow-sm"
          >
            <div className="space-y-1 max-w-md">
              <div className="flex items-center space-x-1.5 text-[10px] font-mono text-slate-500">
                <span className="bg-slate-100 px-1.5 py-0.5 rounded font-bold text-slate-700">{dup.id}</span>
                <span>•</span>
                <span className="flex items-center text-red-600 font-semibold">
                  <MapPin className="h-3 w-3 mr-0.5" />
                  {dup.locationName}
                </span>
              </div>
              <h5 className="font-bold text-xs text-slate-900">{dup.title}</h5>
              <p className="text-[10px] text-slate-500 line-clamp-1">{dup.description}</p>
            </div>

            <button
              onClick={() => onSupportDuplicate(dup.id)}
              disabled={isVoting}
              className="flex items-center space-x-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 px-3 py-1.5 rounded text-xs font-bold font-mono transition-all disabled:opacity-50 cursor-pointer shadow-sm"
            >
              <ThumbsUp className="h-3.5 w-3.5" />
              <span>{isVoting ? "VOTING..." : "SUPPORT COMPLAINT (+15 PTS)"}</span>
            </button>
          </div>
        ))}
      </div>

      <div className="flex items-center space-x-1.5 text-[9px] font-mono text-slate-500 border-t border-amber-200/60 pt-2 font-medium">
        <Sparkles className="h-3.5 w-3.5 text-amber-500 animate-spin" style={{ animationDuration: "8s" }} />
        <span>By supporting instead of creating duplicate records, you preserve municipality dispatch bandwidth.</span>
      </div>
    </div>
  );
}
