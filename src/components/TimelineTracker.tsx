/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { CheckCircle2, Circle, Clock, User, ShieldCheck, HelpCircle, Image, Sparkles } from "lucide-react";
import { Complaint, ComplaintStatus } from "../types";

interface TimelineTrackerProps {
  complaint: Complaint;
}

const WORKFLOW_STEPS = [
  { status: ComplaintStatus.REPORTED, label: "Reported" },
  { status: ComplaintStatus.AI_VERIFIED, label: "AI Scored" },
  { status: ComplaintStatus.ACCEPTED, label: "Officer Approved" },
  { status: ComplaintStatus.CREW_ASSIGNED, label: "Crew Dispatched" },
  { status: ComplaintStatus.REPAIR_STARTED, label: "Work Begun" },
  { status: ComplaintStatus.QUALITY_INSPECTION, label: "AI Quality Audit" },
  { status: ComplaintStatus.COMPLETED, label: "Completed" },
  { status: ComplaintStatus.CLOSED, label: "Archived Closed" },
];

export default function TimelineTracker({ complaint }: React.PropsWithChildren<TimelineTrackerProps>) {
  const getStepIndex = (currentStatus: ComplaintStatus) => {
    // Group active worker intermediate states together to keep timeline clean
    if (
      currentStatus === ComplaintStatus.CREW_ON_ROUTE ||
      currentStatus === ComplaintStatus.REPAIR_IN_PROGRESS
    ) {
      return 4; // Map intermediate work states to Work Begun index
    }
    const idx = WORKFLOW_STEPS.findIndex((step) => step.status === currentStatus);
    return idx === -1 ? 0 : idx;
  };

  const activeStepIdx = getStepIndex(complaint.status);

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-5" id="complaint-tracking-timeline">
      {/* Title */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="space-y-0.5">
          <span className="text-[10px] font-mono text-blue-600 uppercase tracking-widest font-bold">
            Live Complaint Progress Tracker
          </span>
          <h4 className="font-bold text-slate-900 text-sm">Complaint {complaint.id}</h4>
        </div>
        <span className="bg-slate-50 px-2.5 py-1 rounded text-[10px] font-mono border border-slate-200 text-slate-600 font-semibold">
          ETA: {complaint.status === "CLOSED" ? "Resolved" : "4 Hours Max"}
        </span>
      </div>

      {/* Interactive Progress Line */}
      <div className="relative pt-2 pb-6">
        <div className="absolute top-[26px] left-4 right-4 h-1 bg-slate-100 rounded-full" />
        <div
          className="absolute top-[26px] left-4 h-1 bg-blue-500 rounded-full transition-all duration-700"
          style={{ width: `${(activeStepIdx / (WORKFLOW_STEPS.length - 1)) * 100}%` }}
        />

        <div className="relative flex justify-between">
          {WORKFLOW_STEPS.map((step, idx) => {
            const isCompleted = idx < activeStepIdx;
            const isActive = idx === activeStepIdx;

            return (
              <div key={idx} className="flex flex-col items-center group relative w-12 text-center">
                <div
                  className={`h-7 w-7 rounded-full flex items-center justify-center border-2 transition-all ${
                    isCompleted
                      ? "bg-blue-50 border-blue-500 text-blue-600"
                      : isActive
                      ? "bg-white border-blue-600 text-blue-600 scale-110 shadow-md ring-4 ring-blue-500/10"
                      : "bg-slate-50 border-slate-200 text-slate-400"
                  }`}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : isActive ? (
                    <Clock className="h-4 w-4 animate-spin" style={{ animationDuration: "3s" }} />
                  ) : (
                    <Circle className="h-2 w-2" />
                  )}
                </div>
                <span
                  className={`mt-2 text-[9px] font-mono tracking-tight text-center truncate w-14 absolute top-7 ${
                    isActive ? "text-blue-600 font-bold" : isCompleted ? "text-slate-700" : "text-slate-400"
                  }`}
                >
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Dispatch Allocation Cards */}
      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100">
        <div className="bg-slate-50 p-3 rounded-lg border border-slate-200/60 flex items-center space-x-3">
          <div className="bg-blue-50 p-2 rounded text-blue-600 shrink-0 border border-blue-100">
            <User className="h-4 w-4" />
          </div>
          <div>
            <span className="text-[9px] font-mono text-slate-500 block font-semibold">ASSIGNED REVIEW OFFICER</span>
            <span className="font-bold text-xs text-slate-800">
              {complaint.assignedOfficerName || "Auto Queue Allocation"}
            </span>
          </div>
        </div>

        <div className="bg-slate-50 p-3 rounded-lg border border-slate-200/60 flex items-center space-x-3">
          <div className="bg-indigo-50 p-2 rounded text-indigo-600 shrink-0 border border-indigo-100">
            <User className="h-4 w-4" />
          </div>
          <div>
            <span className="text-[9px] font-mono text-slate-500 block font-semibold">DISPATCHED CREW TASKFORCE</span>
            <span className="font-bold text-xs text-slate-800">
              {complaint.assignedCrewName || "Pending Dispatch Optimization"}
            </span>
          </div>
        </div>
      </div>

      {/* Before / After Photo Comparisons */}
      {(complaint.beforeImageUrl || complaint.afterImageUrl) && (
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 space-y-3">
          <span className="text-[10px] font-mono tracking-widest text-slate-500 uppercase font-bold block">
            Quality Inspection Imagery Comparisons
          </span>

          <div className="grid grid-cols-2 gap-3">
            {/* Before Photo */}
            <div className="space-y-1 text-center">
              <span className="text-[9px] font-mono text-red-600 font-bold uppercase tracking-wider block">
                BEFORE (REPORTED)
              </span>
              <div className="h-24 w-full bg-slate-100 rounded overflow-hidden border border-slate-200 flex items-center justify-center">
                {complaint.beforeImageUrl && complaint.beforeImageUrl.startsWith("data:image") ? (
                  <img src={complaint.beforeImageUrl} alt="Before Damage" className="h-full w-full object-cover" />
                ) : (
                  <Image className="h-6 w-6 text-slate-400" />
                )}
              </div>
            </div>

            {/* After Photo */}
            <div className="space-y-1 text-center">
              <span className="text-[9px] font-mono text-emerald-700 font-bold uppercase tracking-wider block">
                AFTER (WORK COMPLETED)
              </span>
              <div className="h-24 w-full bg-slate-100 rounded overflow-hidden border border-slate-200 flex items-center justify-center">
                {complaint.afterImageUrl ? (
                  complaint.afterImageUrl.startsWith("data:image") ? (
                    <img src={complaint.afterImageUrl} alt="After Repair" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex flex-col items-center text-emerald-600">
                      <ShieldCheck className="h-6 w-6" />
                      <span className="text-[8px] font-mono mt-1 font-bold">REPAIRED</span>
                    </div>
                  )
                ) : (
                  <HelpCircle className="h-6 w-6 text-slate-300" />
                )}
              </div>
            </div>
          </div>

          {/* Gemini Quality verification result report */}
          {complaint.aiVerificationResult && (
            <div className="bg-emerald-50 border border-emerald-200 rounded p-2.5 space-y-1.5 mt-2 animate-fadeIn">
              <div className="flex items-center space-x-1 text-[9px] text-emerald-700 font-mono font-bold">
                <Sparkles className="h-3.5 w-3.5" />
                <span>GEMINI QUALITY VERIFICATION AUDIT</span>
              </div>
              <p className="text-[10px] text-slate-700 leading-relaxed italic">{complaint.aiVerificationResult}</p>
            </div>
          )}
        </div>
      )}

      {/* Full Audit History logs */}
      <div className="space-y-2">
        <span className="text-[9px] font-mono tracking-widest text-slate-500 uppercase block font-semibold">
          Platform Case Audit Logs
        </span>
        <div className="space-y-2 max-h-32 overflow-y-auto pr-1">
          {complaint.history.map((log, index) => (
            <div key={index} className="flex space-x-2 text-[10px] font-mono border-l border-slate-200 pl-2 ml-1">
              <span className="text-slate-400 shrink-0">[{new Date(log.updatedAt).toLocaleTimeString()}]</span>
              <div className="space-y-0.5">
                <span className="font-bold text-slate-800 block">{log.updatedBy}: {log.status.replace("_", " ")}</span>
                <span className="text-slate-500 leading-relaxed block">{log.comment}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
