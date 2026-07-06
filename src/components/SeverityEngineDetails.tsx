/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { Sparkles, ShieldCheck, ShieldAlert, Award, CalendarClock, DollarSign } from "lucide-react";

interface SeverityEngineDetailsProps {
  priorityScore: number;
  riskScore: number;
  severity: "Low" | "Medium" | "High" | "Critical";
  estimatedCost: number;
  estimatedHours: number;
  factors?: string[];
}

export default function SeverityEngineDetails({
  priorityScore,
  riskScore,
  severity,
  estimatedCost,
  estimatedHours,
  factors = ["Auto-detected traffic congestion impact", "Vicinity to municipal school zone", "Vulnerability to heavy rainfall logging"],
}: SeverityEngineDetailsProps) {
  const getSeverityBg = (sev: string) => {
    switch (sev) {
      case "Critical":
        return "bg-red-50 text-red-700 border-red-200";
      case "High":
        return "bg-amber-55 text-amber-800 border-amber-200";
      case "Medium":
        return "bg-blue-50 text-blue-700 border-blue-200";
      default:
        return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  const getGaugeColor = (score: number) => {
    if (score > 80) return "bg-red-500";
    if (score > 55) return "bg-amber-500";
    return "bg-blue-500";
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4" id="severity-scoring-panel">
      <div className="flex items-center space-x-2">
        <div className="bg-blue-50 p-1.5 rounded-lg border border-blue-100">
          <Sparkles className="h-5 w-5 text-blue-600" />
        </div>
        <div>
          <h4 className="font-mono text-xs font-bold tracking-wider text-slate-800 uppercase">
            AI Priority & Severity Calculation Engine
          </h4>
          <p className="text-[11px] text-slate-500">Real-time parameters derived from deep municipal telemetry</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Priority Gauge */}
        <div className="bg-slate-50 rounded-lg p-3 border border-slate-200/80">
          <span className="text-[9px] font-mono tracking-widest text-slate-500 block mb-1 font-semibold">
            MUNICIPAL PRIORITY INDEX
          </span>
          <div className="flex items-end justify-between">
            <span className="text-2xl font-black font-mono text-slate-900">{priorityScore}/100</span>
            <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${getSeverityBg(severity)}`}>
              {severity.toUpperCase()}
            </span>
          </div>
          <div className="w-full bg-slate-200 h-2 rounded-full mt-2.5 overflow-hidden">
            <div className={`h-full ${getGaugeColor(priorityScore)} transition-all duration-1000`} style={{ width: `${priorityScore}%` }} />
          </div>
        </div>

        {/* Risk Score */}
        <div className="bg-slate-50 rounded-lg p-3 border border-slate-200/80">
          <span className="text-[9px] font-mono tracking-widest text-slate-500 block mb-1 font-semibold">
            CIVIC INFRASTRUCTURE RISK INDEX
          </span>
          <div className="flex items-end justify-between">
            <span className="text-2xl font-black font-mono text-slate-900">{riskScore}%</span>
            {riskScore > 75 ? (
              <ShieldAlert className="h-5 w-5 text-red-500 shrink-0" />
            ) : (
              <ShieldCheck className="h-5 w-5 text-blue-500 shrink-0" />
            )}
          </div>
          <div className="w-full bg-slate-200 h-2 rounded-full mt-2.5 overflow-hidden">
            <div className={`h-full ${getGaugeColor(riskScore)} transition-all duration-1000`} style={{ width: `${riskScore}%` }} />
          </div>
        </div>
      </div>

      {/* Auto Estimates */}
      <div className="grid grid-cols-2 gap-3 pt-1">
        <div className="bg-slate-50/80 rounded-lg p-3 border border-slate-200/60 flex items-center space-x-3">
          <div className="bg-emerald-100 p-2 rounded text-emerald-700">
            <span className="text-lg font-bold font-mono">₹</span>
          </div>
          <div>
            <span className="text-[9px] font-mono text-slate-500 block">ESTIMATED EXPENDITURE</span>
            <span className="font-bold text-xs text-slate-800 font-mono">
              ₹{estimatedCost.toLocaleString("en-IN")}
            </span>
          </div>
        </div>

        <div className="bg-slate-50/80 rounded-lg p-3 border border-slate-200/60 flex items-center space-x-3">
          <div className="bg-blue-100 p-2 rounded text-blue-700">
            <CalendarClock className="h-4 w-4" />
          </div>
          <div>
            <span className="text-[9px] font-mono text-slate-500 block">ESTIMATED REPAIR TIMELINE</span>
            <span className="font-bold text-xs text-slate-800 font-mono">{estimatedHours} Hours</span>
          </div>
        </div>
      </div>

      {/* Decision Factors */}
      <div className="pt-2">
        <span className="text-[9px] font-mono tracking-widest text-slate-500 uppercase block mb-2 font-semibold">
          Calculated Decision Weight Factors
        </span>
        <div className="space-y-1.5">
          {factors.map((factor, idx) => (
            <div key={idx} className="flex items-center space-x-2 text-[10px] text-slate-700 font-mono">
              <span className="h-1 w-1 rounded-full bg-blue-500 shrink-0" />
              <span>{factor}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
