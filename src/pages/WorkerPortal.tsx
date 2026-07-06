/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import {
  Briefcase,
  MapPin,
  Clock,
  Sparkles,
  Camera,
  CheckCircle,
  TrendingUp,
  Navigation,
  FileText,
  AlertTriangle,
  Upload,
} from "lucide-react";
import { Complaint, Crew, ComplaintStatus } from "../types";

interface WorkerPortalProps {
  onLogout: () => void;
}

const AFTER_MOCK_PHOTOS = [
  {
    name: "Repaired Pothole",
    category: "Pothole",
    url: "https://images.unsplash.com/photo-1599740831119-070df4449af3?auto=format&fit=crop&w=600&q=80",
    description: "Perfectly hot-rolled asphalt patching.",
    base64: "data:image/jpeg;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  },
  {
    name: "Cleaned Waste Area",
    category: "Garbage",
    url: "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=600&q=80",
    description: "Asphalt swept clean, debris hauled.",
    base64: "data:image/jpeg;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
  },
  {
    name: "Glowing Lamp Post",
    category: "Streetlight",
    url: "https://images.unsplash.com/photo-1473116763269-255ea7b2b5f1?auto=format&fit=crop&w=600&q=80",
    description: "Functional light luminaire repaired.",
    base64: "data:image/jpeg;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mN88B9QDwADjwGAX3691QAAAABJRU5ErkJggg==",
  },
];

export default function WorkerPortal({ onLogout }: WorkerPortalProps) {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [assignedJobs, setAssignedJobs] = useState<Complaint[]>([]);
  const [selectedJob, setSelectedJob] = useState<Complaint | null>(null);

  const [afterImage, setAfterImage] = useState("");
  const [afterPreviewUrl, setAfterPreviewUrl] = useState<string | null>(null);
  const [isSubmittingWork, setIsSubmittingWork] = useState(false);

  const loadWorkerJobs = async () => {
    try {
      const res = await fetch("/api/complaints");
      const data: Complaint[] = await res.json();
      setComplaints(data);

      // Filter complaints where the crew is allocated to "Rapid Roadways Crew A" (our default worker crew)
      const workerJobs = data.filter(
        (c) =>
          c.assignedCrewName === "Rapid Roadways Crew A" &&
          c.status !== "CLOSED" &&
          c.status !== "COMPLETED"
      );
      setAssignedJobs(workerJobs);

      // Auto select first job if none selected
      if (workerJobs.length > 0 && !selectedJob) {
        setSelectedJob(workerJobs[0]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadWorkerJobs();
    const interval = setInterval(loadWorkerJobs, 8000);
    return () => clearInterval(interval);
  }, []);

  // Update complaint workflow status stage
  const handleUpdateStatusStage = async (compId: string, nextStatus: ComplaintStatus) => {
    try {
      const res = await fetch(`/api/complaints/${compId}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus, comment: `Crew marked status update: ${nextStatus.replace("_", " ")}` }),
      });
      const data = await res.json();
      setSelectedJob(data);
      loadWorkerJobs();
    } catch (err) {
      console.error(err);
    }
  };

  // Upload after repair photo and trigger verification
  const handleCompleteRepairJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedJob || !afterImage) return;

    setIsSubmittingWork(true);
    try {
      const res = await fetch(`/api/complaints/${selectedJob.id}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ afterImageUrl: afterImage }),
      });
      const data = await res.json();
      setSelectedJob(null);
      setAfterImage("");
      setAfterPreviewUrl(null);
      loadWorkerJobs();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmittingWork(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const processFile = async (file: File) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      setAfterPreviewUrl(base64String);
      setAfterImage(base64String);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-slate-50 text-slate-800" id="worker-portal-view">
      {/* Sidebar jobs menu */}
      <div className="w-full lg:w-80 bg-white border-b lg:border-b-0 lg:border-r border-slate-200 flex flex-col justify-between shrink-0 shadow-sm">
        <div>
          {/* Logo brand */}
          <div className="p-6 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="bg-emerald-600 h-9 w-9 rounded-lg flex items-center justify-center font-black text-white font-sans tracking-tight">
                CRW
              </div>
              <div>
                <h1 className="font-extrabold tracking-tight font-sans text-lg text-slate-900">CIVORA</h1>
                <span className="text-[10px] font-mono tracking-widest text-emerald-600 block uppercase font-bold">
                  RAPID TEAM A
                </span>
              </div>
            </div>
            <button
              onClick={onLogout}
              className="text-[10px] font-mono tracking-wider hover:text-red-655 text-slate-550 transition-all uppercase font-bold cursor-pointer"
            >
              LOGOUT
            </button>
          </div>

          {/* Active Work list */}
          <div className="p-4 space-y-3">
            <span className="text-[9px] font-mono tracking-widest text-slate-400 uppercase font-bold block px-2">
              Assigned Dispatch Orders
            </span>

            <div className="space-y-1.5">
              {assignedJobs.length === 0 ? (
                <div className="text-center py-10 text-slate-400 font-mono text-xs font-semibold">
                  No active jobs. All works up-to-date!
                </div>
              ) : (
                assignedJobs.map((job) => (
                  <button
                    key={job.id}
                    onClick={() => setSelectedJob(job)}
                    className={`w-full text-left p-3 rounded-lg border transition-all text-xs font-mono block cursor-pointer ${
                      selectedJob?.id === job.id
                        ? "bg-emerald-50 border-emerald-200 text-emerald-800 font-bold shadow-sm"
                        : "bg-slate-50 border-slate-200 hover:border-slate-300 text-slate-650"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1 text-[9px]">
                      <span className="text-slate-500 font-bold">{job.id}</span>
                      <span className={`px-1.5 rounded font-bold ${
                        selectedJob?.id === job.id ? "bg-emerald-100 text-emerald-800" : "bg-slate-200 text-slate-700"
                      }`}>
                        {job.status.replace("_", " ")}
                      </span>
                    </div>
                    <span className="font-bold text-slate-850 line-clamp-1">{job.title}</span>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Dispatch base contact */}
        <div className="p-6 border-t border-slate-200 text-center space-y-1">
          <span className="text-[9px] font-mono text-slate-400 uppercase tracking-widest block font-bold">
            CITIZEN CORP BASE CHANNEL
          </span>
          <p className="text-[10px] text-slate-650 font-medium">Radio Frequency: VHF 142.85 MHz</p>
        </div>
      </div>

      {/* Main Task View */}
      <div className="flex-1 flex flex-col min-w-0 bg-slate-50 overflow-y-auto">
        <div className="p-6 lg:p-8 space-y-6">
          <div className="space-y-1">
            <h2 className="text-2xl font-black font-sans tracking-tight text-slate-900">
              Field Work Order Terminal
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              Mark dispatches, update physical work parameters, and submit completed imagery for verification.
            </p>
          </div>

          {selectedJob ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fadeIn">
              {/* Left Details column */}
              <div className="lg:col-span-2 space-y-5">
                {/* Job Info card */}
                <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4 shadow-sm">
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
                    <div className="space-y-1">
                      <span className="bg-slate-100 px-2.5 py-0.5 rounded border border-slate-200 text-[10px] font-mono text-emerald-700 font-bold">
                        ACTIVE ORDER: {selectedJob.id}
                      </span>
                      <h3 className="text-lg font-bold text-slate-900">{selectedJob.title}</h3>
                    </div>

                    <span className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-2.5 py-1 text-xs font-mono font-bold rounded">
                      {selectedJob.status.replace("_", " ")}
                    </span>
                  </div>

                  <p className="text-xs text-slate-650 leading-relaxed italic bg-slate-50 p-3.5 rounded-lg border border-slate-200 font-medium">
                    "{selectedJob.description}"
                  </p>

                  <div className="flex items-center space-x-2 text-xs font-mono text-slate-500 pt-1 font-semibold">
                    <MapPin className="h-4 w-4 text-emerald-600" />
                    <span>Location: {selectedJob.locationName}</span>
                  </div>
                </div>

                {/* Workflow Status advancement buttons */}
                <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3 shadow-sm">
                  <h4 className="font-bold text-xs uppercase font-mono tracking-wider text-slate-700">
                    Dispatch Status Stages Action
                  </h4>

                  <div className="flex flex-wrap gap-2">
                    {/* Stage 1: Mark On Route */}
                    {(selectedJob.status === ComplaintStatus.CREW_ASSIGNED || selectedJob.status === "ACCEPTED") && (
                      <button
                        onClick={() => handleUpdateStatusStage(selectedJob.id, ComplaintStatus.CREW_ON_ROUTE)}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-mono text-[11px] font-bold px-4 py-2.5 rounded transition-all uppercase cursor-pointer shadow-sm"
                      >
                        Start Journey: On Route
                      </button>
                    )}

                    {/* Stage 2: Mark repair started */}
                    {selectedJob.status === ComplaintStatus.CREW_ON_ROUTE && (
                      <button
                        onClick={() => handleUpdateStatusStage(selectedJob.id, ComplaintStatus.REPAIR_STARTED)}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-mono text-[11px] font-bold px-4 py-2.5 rounded transition-all uppercase cursor-pointer shadow-sm"
                      >
                        Arrived: Start Repair Work
                      </button>
                    )}

                    {/* Stage 3: Mark repair in progress */}
                    {selectedJob.status === ComplaintStatus.REPAIR_STARTED && (
                      <button
                        onClick={() => handleUpdateStatusStage(selectedJob.id, ComplaintStatus.REPAIR_IN_PROGRESS)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-mono text-[11px] font-bold px-4 py-2.5 rounded transition-all uppercase cursor-pointer shadow-sm"
                      >
                        Update progress: In Progress
                      </button>
                    )}

                    {selectedJob.status === ComplaintStatus.REPAIR_IN_PROGRESS && (
                      <span className="text-[11px] font-mono text-slate-500 italic font-semibold">
                        Progress active. Ready to upload completed repair photo below.
                      </span>
                    )}
                  </div>
                </div>

                {/* Imagery comparison preview */}
                <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3 shadow-sm">
                  <h4 className="font-bold text-xs uppercase font-mono tracking-wider text-slate-700">
                    Job Imagery Records
                  </h4>
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div className="space-y-1">
                      <span className="text-[9px] font-mono text-slate-500 block font-bold">BEFORE WORK</span>
                      <div className="h-32 w-full bg-slate-50 rounded overflow-hidden border border-slate-200 flex items-center justify-center shadow-inner">
                        {selectedJob.beforeImageUrl ? (
                          <img src={selectedJob.beforeImageUrl} alt="Before" className="h-full w-full object-cover" />
                        ) : (
                          <span className="text-[10px] text-slate-400 font-mono font-semibold">No photo registered</span>
                        )}
                      </div>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[9px] font-mono text-emerald-700 block font-bold">AFTER REPAIR PREVIEW</span>
                      <div className="h-32 w-full bg-slate-50 rounded overflow-hidden border border-slate-200 flex items-center justify-center shadow-inner">
                        {afterPreviewUrl ? (
                          <img src={afterPreviewUrl} alt="After" className="h-full w-full object-cover" />
                        ) : (
                          <span className="text-[10px] text-slate-400 font-mono font-semibold">Awaiting photo upload</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Verification form upload Column */}
              <div className="space-y-5">
                {/* Complete & upload Card */}
                <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4 shadow-sm">
                  <div className="flex items-center space-x-1.5 text-xs text-emerald-750 font-mono font-bold">
                    <Camera className="h-4 w-4" />
                    <span>TRANSMIT REPAIR COMPLETION</span>
                  </div>

                  <form onSubmit={handleCompleteRepairJob} className="space-y-4">
                    {/* Drag and drop repair image */}
                    <div
                      onDragEnter={handleDrag}
                      onDragOver={handleDrag}
                      onDrop={handleDrop}
                      className="border-2 border-dashed border-slate-200 bg-slate-50 p-4 rounded-lg text-center cursor-pointer hover:border-slate-350 transition-all shadow-inner"
                      onClick={() => document.getElementById("worker-file")?.click()}
                    >
                      <input
                        type="file"
                        id="worker-file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                      <Upload className="h-6 w-6 text-slate-400 mx-auto mb-1.5" />
                      <span className="text-[11px] font-mono text-slate-500 block font-semibold">
                        Drag and drop or <span className="text-emerald-700 font-extrabold">Browse after image</span>
                      </span>
                    </div>

                    {/* Pre-configured completed mock photo presets (Test Triggers) */}
                    <div className="space-y-1.5">
                      <span className="text-[8px] font-mono text-slate-400 uppercase tracking-widest block font-bold">
                        Completed Job Templates (Test Presets)
                      </span>
                      <div className="grid grid-cols-1 gap-1">
                        {AFTER_MOCK_PHOTOS.map((mock, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => {
                              setAfterPreviewUrl(mock.url);
                              setAfterImage(mock.base64);
                            }}
                            className="bg-slate-50 border border-slate-200 hover:border-slate-350 p-2 rounded text-left text-[10px] font-mono text-slate-600 block truncate font-bold cursor-pointer"
                          >
                            Set {mock.name} Mock
                          </button>
                        ))}
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmittingWork || !afterImage}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-mono text-xs font-bold py-3 rounded-lg transition-all uppercase flex items-center justify-center space-x-1 cursor-pointer shadow-sm"
                    >
                      <CheckCircle className="h-4 w-4" />
                      <span>{isSubmittingWork ? "TRANSMITTING..." : "TRANSMIT COMPLETED REPAIR"}</span>
                    </button>
                  </form>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-slate-400 font-mono text-xs font-bold shadow-sm leading-relaxed">
              No task is currently active. Select an assigned dispatch order from the left sidebar to begin tracking.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
