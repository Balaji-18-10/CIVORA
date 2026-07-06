/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import {
  ShieldAlert,
  Users,
  Clock,
  CheckCircle,
  TrendingUp,
  Map,
  Navigation,
  FileText,
  AlertTriangle,
  CloudRain,
  Settings,
  Briefcase,
  ChevronRight,
  Filter,
  Sparkles,
  Calendar,
  Layers,
  ThumbsUp,
  Award,
} from "lucide-react";
import { Complaint, Crew, PredictionPoint, WeatherAlert } from "../types";
import MapDigitalTwin from "../components/MapDigitalTwin";

interface AuthorityPortalProps {
  onLogout: () => void;
}

export default function AuthorityPortal({ onLogout }: AuthorityPortalProps) {
  const [activeTab, setActiveTab] = useState<"dashboard" | "dispatch" | "predictions" | "verification" | "reports">("dashboard");

  // State caches
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [crews, setCrews] = useState<Crew[]>([]);
  const [predictions, setPredictions] = useState<PredictionPoint[]>([]);
  const [weather, setWeather] = useState<WeatherAlert | null>(null);
  const [analytics, setAnalytics] = useState<any | null>(null);

  // Selected entities
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isDispatching, setIsDispatching] = useState(false);
  const [reportRange, setReportRange] = useState<"daily" | "weekly" | "monthly">("weekly");

  // Filters
  const [filterCategory, setFilterCategory] = useState("All");
  const [filterStatus, setFilterStatus] = useState("All");

  const loadData = async () => {
    try {
      // Parallelize fetches
      const [compRes, crewRes, predRes, weatherRes, analRes] = await Promise.all([
        fetch("/api/complaints"),
        fetch("/api/crews"),
        fetch("/api/predictions"),
        fetch("/api/weather"),
        fetch("/api/analytics"),
      ]);

      const [compData, crewData, predData, weatherData, analData] = await Promise.all([
        compRes.json(),
        crewRes.json(),
        predRes.json(),
        weatherRes.json(),
        analRes.json(),
      ]);

      setComplaints(compData);
      setCrews(crewData);
      setPredictions(predData);
      setWeather(weatherData);
      setAnalytics(analData);
    } catch (err) {
      console.error("Failed to load authority console parameters", err);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 10000); // Poll every 10s for real-time changes
    return () => clearInterval(interval);
  }, []);

  // Smart dispatch trigger
  const handleSmartDispatch = async (compId: string) => {
    setIsDispatching(true);
    try {
      const res = await fetch(`/api/complaints/${compId}/dispatch`, {
        method: "POST",
      });
      const data = await res.json();
      setSelectedComplaint(null);
      loadData();
    } catch (err) {
      console.error(err);
    } finally {
      setIsDispatching(false);
    }
  };

  // Run AI Photo Verification comparison
  const handleRunVerification = async (compId: string) => {
    setIsVerifying(true);
    try {
      const res = await fetch(`/api/ai/verify-repair/${compId}`, {
        method: "POST",
      });
      const data = await res.json();
      setSelectedComplaint(data);
      loadData();
    } catch (err) {
      console.error(err);
    } finally {
      setIsVerifying(false);
    }
  };

  // Sign off and close case
  const handleCloseCase = async (compId: string) => {
    try {
      const res = await fetch(`/api/complaints/${compId}/close`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating: 5, comment: "AI verification audit passed quality benchmarks." }),
      });
      setSelectedComplaint(null);
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "REPORTED":
      case "AI_VERIFIED":
        return "bg-rose-500/10 text-rose-400 border border-rose-500/20";
      case "CREW_ASSIGNED":
        return "bg-amber-500/10 text-amber-400 border border-amber-500/20";
      case "REPAIR_STARTED":
      case "REPAIR_IN_PROGRESS":
        return "bg-violet-500/10 text-violet-400 border border-violet-500/20";
      case "QUALITY_INSPECTION":
        return "bg-indigo-500/15 text-indigo-400 border border-indigo-500/30 animate-pulse";
      case "COMPLETED":
        return "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20";
      default:
        return "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20";
    }
  };

  // Filter complaints based on selection
  const filteredComplaints = complaints.filter((c) => {
    const categoryMatch = filterCategory === "All" || c.category === filterCategory;
    const statusMatch = filterStatus === "All" || c.status === filterStatus;
    return categoryMatch && statusMatch;
  });

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-slate-50 text-slate-800" id="authority-portal-view">
      {/* Control panel sidebar */}
      <div className="w-full lg:w-80 bg-white border-b lg:border-b-0 lg:border-r border-slate-200 flex flex-col justify-between shrink-0 shadow-sm">
        <div>
          {/* Brand header */}
          <div className="p-6 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="bg-indigo-600 h-9 w-9 rounded-lg flex items-center justify-center font-black text-white font-sans tracking-tight">
                CIV
              </div>
              <div>
                <h1 className="font-extrabold tracking-tight font-sans text-lg text-slate-900">CIVORA</h1>
                <span className="text-[10px] font-mono tracking-widest text-indigo-600 block uppercase font-bold">
                  AUTHORITY CONSOLE
                </span>
              </div>
            </div>
            <button
              onClick={onLogout}
              className="text-[10px] font-mono tracking-wider hover:text-red-650 text-slate-550 transition-all uppercase font-bold cursor-pointer"
            >
              LOGOUT
            </button>
          </div>

          {/* Active status indicator */}
          <div className="p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="h-2 w-2 rounded-full bg-emerald-600 animate-pulse" />
              <span className="text-xs font-bold text-slate-700">System Link Secure</span>
            </div>
            <span className="text-[9px] font-mono text-slate-500 font-semibold">Node: CLOUD-RUN-ACTIVE</span>
          </div>

          {/* Left panel navigations */}
          <div className="p-4 space-y-1">
            <button
              onClick={() => {
                setActiveTab("dashboard");
                setSelectedComplaint(null);
              }}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-lg text-xs font-mono uppercase tracking-wider transition-all cursor-pointer ${
                activeTab === "dashboard"
                  ? "bg-indigo-50 border border-indigo-200 text-indigo-700 font-bold"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/50"
              }`}
            >
              <span>Analytics & Twin Map</span>
              <ChevronRight className="h-4 w-4 shrink-0" />
            </button>

            <button
              onClick={() => {
                setActiveTab("dispatch");
                setSelectedComplaint(null);
              }}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-lg text-xs font-mono uppercase tracking-wider transition-all cursor-pointer ${
                activeTab === "dispatch"
                  ? "bg-indigo-50 border border-indigo-200 text-indigo-700 font-bold"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/50"
              }`}
            >
              <span className="flex items-center">
                <Navigation className="h-4 w-4 mr-2 text-indigo-600" />
                Smart Dispatch Queue
              </span>
              <ChevronRight className="h-4 w-4 shrink-0" />
            </button>

            <button
              onClick={() => {
                setActiveTab("predictions");
                setSelectedComplaint(null);
              }}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-lg text-xs font-mono uppercase tracking-wider transition-all cursor-pointer ${
                activeTab === "predictions"
                  ? "bg-indigo-50 border border-indigo-200 text-indigo-700 font-bold"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/50"
              }`}
            >
              <span className="flex items-center">
                <CloudRain className="h-4 w-4 mr-2 text-indigo-600" />
                Predictive Maintenance
              </span>
              <ChevronRight className="h-4 w-4 shrink-0" />
            </button>

            <button
              onClick={() => {
                setActiveTab("verification");
                setSelectedComplaint(null);
              }}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-lg text-xs font-mono uppercase tracking-wider transition-all cursor-pointer ${
                activeTab === "verification"
                  ? "bg-indigo-50 border border-indigo-200 text-indigo-700 font-bold"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/50"
              }`}
            >
              <span className="flex items-center">
                <Sparkles className="h-4 w-4 mr-2 text-indigo-600 animate-pulse" />
                AI Quality Verification
              </span>
              <ChevronRight className="h-4 w-4 shrink-0" />
            </button>

            <button
              onClick={() => {
                setActiveTab("reports");
                setSelectedComplaint(null);
              }}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-lg text-xs font-mono uppercase tracking-wider transition-all cursor-pointer ${
                activeTab === "reports"
                  ? "bg-indigo-50 border border-indigo-200 text-indigo-700 font-bold"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/50"
              }`}
            >
              <span>Performance Reports</span>
              <ChevronRight className="h-4 w-4 shrink-0" />
            </button>
          </div>
        </div>

        {/* System parameters */}
        <div className="p-6 border-t border-slate-200 text-center space-y-1">
          <span className="text-[9px] font-mono text-slate-400 uppercase tracking-widest block font-bold">
            CIVORA CORE TELEMETRY
          </span>
          <p className="text-[10px] text-slate-600 font-medium">Pavement Sensor Grid: 412 Online</p>
        </div>
      </div>

      {/* Main console viewer */}
      <div className="flex-1 flex flex-col min-w-0 bg-slate-50 overflow-y-auto">
        <div className="p-6 lg:p-8 space-y-6">
          {/* TAB 1: EXECUTIVE ANALYTICS & DIGITAL TWIN MAP */}
          {activeTab === "dashboard" && (
            <div className="space-y-6 animate-fadeIn">
              {/* Headline */}
              <div className="space-y-1">
                <h2 className="text-2xl font-black font-sans tracking-tight text-slate-900">
                  Executive Dashboard
                </h2>
                <p className="text-xs text-slate-500">
                  Real-time municipal KPIs, active sensor overlays, and smart city digital twin.
                </p>
              </div>

              {/* KPI metrics cards */}
              {analytics && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-white border border-slate-200 p-4 rounded-xl flex items-center space-x-4 shadow-sm">
                    <div className="bg-red-50 border border-red-150 p-3 rounded-xl text-red-600 shrink-0">
                      <ShieldAlert className="h-5 w-5" />
                    </div>
                    <div>
                      <span className="text-[9px] font-mono text-slate-500 block uppercase font-bold">Today's Complaints</span>
                      <span className="text-lg font-black font-mono text-slate-900">
                        {analytics.kpis.todayComplaints} Active
                      </span>
                    </div>
                  </div>

                  <div className="bg-white border border-slate-200 p-4 rounded-xl flex items-center space-x-4 shadow-sm">
                    <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl text-amber-600 shrink-0">
                      <AlertTriangle className="h-5 w-5" />
                    </div>
                    <div>
                      <span className="text-[9px] font-mono text-slate-500 block uppercase font-bold">Critical Warnings</span>
                      <span className="text-lg font-black font-mono text-slate-900">
                        {analytics.kpis.criticalIssues} Incidents
                      </span>
                    </div>
                  </div>

                  <div className="bg-white border border-slate-200 p-4 rounded-xl flex items-center space-x-4 shadow-sm">
                    <div className="bg-blue-50 border border-blue-150 p-3 rounded-xl text-blue-600 shrink-0">
                      <Clock className="h-5 w-5" />
                    </div>
                    <div>
                      <span className="text-[9px] font-mono text-slate-500 block uppercase font-bold">Avg Resolution Time</span>
                      <span className="text-lg font-black font-mono text-slate-900">
                        {analytics.kpis.resolutionTimeAvg}
                      </span>
                    </div>
                  </div>

                  <div className="bg-white border border-slate-200 p-4 rounded-xl flex items-center space-x-4 shadow-sm">
                    <div className="bg-emerald-50 border border-emerald-150 p-3 rounded-xl text-emerald-600 shrink-0">
                      <CheckCircle className="h-5 w-5" />
                    </div>
                    <div>
                      <span className="text-[9px] font-mono text-slate-500 block uppercase font-bold">Citizen Satisfaction</span>
                      <span className="text-lg font-black font-mono text-slate-900">
                        {analytics.kpis.satisfactionRate} Audit Index
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Digital Twin Maps segment */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <MapDigitalTwin
                    complaints={complaints}
                    crews={crews}
                    predictions={predictions}
                    onSelectComplaint={(c) => setSelectedComplaint(c)}
                    selectedComplaintId={selectedComplaint?.id}
                    showHeatmap={true}
                  />
                </div>

                {/* Left selected complaint detail block inside map */}
                <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
                  <h3 className="font-bold text-xs uppercase font-mono tracking-wider text-slate-700 border-b border-slate-200 pb-2">
                    Case Monitor Panel
                  </h3>

                  {selectedComplaint ? (
                    <div className="space-y-4 animate-fadeIn text-xs font-mono">
                      <div className="space-y-1">
                        <span className="text-[9px] text-indigo-600 font-bold block uppercase">
                          {selectedComplaint.category} ID: {selectedComplaint.id}
                        </span>
                        <h4 className="font-bold text-sm text-slate-900 leading-tight">{selectedComplaint.title}</h4>
                      </div>

                      <div className="space-y-1.5 leading-relaxed text-slate-755">
                        <span className="text-[9px] text-slate-500 block uppercase font-bold">CORE DESCRIPTION</span>
                        <p className="bg-slate-50 p-2.5 rounded border border-slate-200">
                          "{selectedComplaint.description}"
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-[10px]">
                        <div>
                          <span className="text-[8px] text-slate-500 block font-bold">STATUS</span>
                          <span className="font-bold text-slate-800">{selectedComplaint.status.replace("_", " ")}</span>
                        </div>
                        <div>
                          <span className="text-[8px] text-slate-500 block font-bold">SEVERITY SCORE</span>
                          <span className="font-bold text-red-650">{selectedComplaint.priorityScore}/100</span>
                        </div>
                      </div>

                      <div className="pt-2">
                        {selectedComplaint.status === "REPORTED" || selectedComplaint.status === "AI_VERIFIED" ? (
                          <button
                            onClick={() => handleSmartDispatch(selectedComplaint.id)}
                            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white p-2 rounded text-xs font-bold transition-all uppercase cursor-pointer shadow-sm"
                          >
                            AI OPTIMIZED DISPATCH
                          </button>
                        ) : (
                          <span className="text-[10px] text-slate-550 block text-center italic border border-slate-200 p-2 rounded bg-slate-50">
                            Already assigned to: {selectedComplaint.assignedCrewName}
                          </span>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-16 text-slate-400 font-mono text-xs font-medium leading-relaxed">
                      Click any color pin on the digital twin map to pull coordinates and monitor parameters.
                    </div>
                  )}
                </div>
              </div>

              {/* Department breakdown visually appealing custom SVG graph (Type-safe charts) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Custom SVG Bar Chart */}
                <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
                  <h4 className="font-bold text-xs font-mono uppercase tracking-wider text-slate-750 border-b border-slate-200 pb-2">
                    Department Incident Volumes
                  </h4>
                  <div className="h-44 flex items-end justify-between px-4 pt-4">
                    {/* SVG Bar 1 */}
                    <div className="flex flex-col items-center space-y-2 w-12">
                      <div className="w-8 bg-indigo-600 rounded-t h-28 relative group cursor-pointer transition-all hover:bg-indigo-700">
                        <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-[9px] font-mono text-slate-600 font-bold">12</span>
                      </div>
                      <span className="text-[9px] font-mono text-slate-500 font-bold">Roadways</span>
                    </div>

                    {/* SVG Bar 2 */}
                    <div className="flex flex-col items-center space-y-2 w-12">
                      <div className="w-8 bg-indigo-600 rounded-t h-36 relative group cursor-pointer transition-all hover:bg-indigo-700">
                        <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-[9px] font-mono text-slate-600 font-bold">18</span>
                      </div>
                      <span className="text-[9px] font-mono text-slate-500 font-bold">Sanitation</span>
                    </div>

                    {/* SVG Bar 3 */}
                    <div className="flex flex-col items-center space-y-2 w-12">
                      <div className="w-8 bg-indigo-600 rounded-t h-20 relative group cursor-pointer transition-all hover:bg-indigo-700">
                        <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-[9px] font-mono text-slate-600 font-bold">8</span>
                      </div>
                      <span className="text-[9px] font-mono text-slate-500 font-bold">Electrical</span>
                    </div>

                    {/* SVG Bar 4 */}
                    <div className="flex flex-col items-center space-y-2 w-12">
                      <div className="w-8 bg-indigo-600 rounded-t h-16 relative group cursor-pointer transition-all hover:bg-indigo-700">
                        <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-[9px] font-mono text-slate-600 font-bold">5</span>
                      </div>
                      <span className="text-[9px] font-mono text-slate-500 font-bold">Forestry</span>
                    </div>
                  </div>
                </div>

                {/* Active Crew Standings list */}
                <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-3">
                  <h4 className="font-bold text-xs font-mono uppercase tracking-wider text-slate-750 border-b border-slate-200 pb-2">
                    Maintenance Force Telemetry
                  </h4>
                  <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
                    {crews.map((crew) => (
                      <div
                        key={crew.id}
                        className="bg-slate-50 border border-slate-200 p-2.5 rounded-lg flex items-center justify-between text-xs font-mono"
                      >
                        <div className="space-y-0.5">
                          <span className="font-bold text-slate-800">{crew.name}</span>
                          <span className="text-[10px] text-slate-500 block font-semibold">Expertise: {crew.expertise.join(", ")}</span>
                        </div>
                        <span
                          className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                            crew.status === "AVAILABLE" ? "bg-emerald-50 border border-emerald-200 text-emerald-800" : "bg-indigo-50 border border-indigo-200 text-indigo-800"
                          }`}
                        >
                          {crew.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: SMART DISPATCH QUEUE */}
          {activeTab === "dispatch" && (
            <div className="space-y-6">
              <div className="space-y-1">
                <h2 className="text-2xl font-black font-sans tracking-tight text-slate-900">
                  Smart Dispatch Allocation Console
                </h2>
                <p className="text-xs text-slate-500 font-medium">
                  Select raw incoming reports and run geographic crew matching parameters.
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Active List */}
                <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-5 space-y-4 shadow-sm">
                  <h3 className="font-mono text-xs text-slate-700 uppercase font-bold border-b border-slate-100 pb-2">
                    Cases Awaiting Crew Dispatch
                  </h3>

                  <div className="space-y-3">
                    {complaints.filter((c) => c.status === "REPORTED" || c.status === "AI_VERIFIED").length === 0 ? (
                      <div className="text-center py-12 text-slate-400 font-mono text-xs font-semibold">
                        All reported cases have successfully been allocated dispatched crews. Good job!
                      </div>
                    ) : (
                      complaints
                        .filter((c) => c.status === "REPORTED" || c.status === "AI_VERIFIED")
                        .map((comp) => (
                          <div
                            key={comp.id}
                            onClick={() => setSelectedComplaint(comp)}
                            className={`p-4 rounded-xl border transition-all cursor-pointer shadow-sm ${
                              selectedComplaint?.id === comp.id
                                ? "bg-indigo-50/50 border-indigo-500"
                                : "bg-slate-50 border-slate-200 hover:border-slate-300 hover:bg-slate-100/30"
                            }`}
                          >
                            <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
                              <div className="flex items-center space-x-2 text-[10px] font-mono text-slate-500">
                                <span className="bg-slate-200/60 px-2 py-0.5 rounded font-bold text-slate-700">
                                  {comp.id}
                                </span>
                                <span className="text-red-650 uppercase font-bold">{comp.category}</span>
                              </div>
                              <span className="font-mono text-xs text-red-650 font-bold">Severity: {comp.severity}</span>
                            </div>

                            <h4 className="font-extrabold text-sm text-slate-900">{comp.title}</h4>
                            <p className="text-[11px] text-slate-600 mt-1 line-clamp-1 italic font-medium">"{comp.description}"</p>
                          </div>
                        ))
                    )}
                  </div>
                </div>

                {/* Right Dispatch Controller */}
                <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4 shadow-sm">
                  <h3 className="font-mono text-xs text-slate-700 uppercase font-bold border-b border-slate-100 pb-2">
                    Dispatch Optimization Core
                  </h3>

                  {selectedComplaint ? (
                    <div className="space-y-4 text-xs font-mono animate-fadeIn">
                      <div>
                        <span className="text-[8px] text-slate-500 uppercase block font-bold">Active Job Target</span>
                        <span className="font-bold text-slate-900 block text-xs">{selectedComplaint.title}</span>
                      </div>

                      <div>
                        <span className="text-[8px] text-slate-500 uppercase block font-bold">Category Expertise Required</span>
                        <span className="font-bold text-red-650 block text-xs">{selectedComplaint.category} Repair</span>
                      </div>

                      <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-2">
                        <div className="flex items-center space-x-1 text-indigo-600 font-bold text-[10px]">
                          <Sparkles className="h-3.5 w-3.5" />
                          <span>AI OPTIMIZED RECOMMENDATION</span>
                        </div>

                        {/* Recommend closest crew */}
                        <p className="text-[10px] text-slate-600 leading-relaxed font-semibold">
                          Scanning active GPS frequencies of 4 repair units. Recommending closest unit with matching tools and expertise.
                        </p>
                      </div>

                      <button
                        onClick={() => handleSmartDispatch(selectedComplaint.id)}
                        disabled={isDispatching}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-lg text-xs font-bold transition-all uppercase flex items-center justify-center space-x-1.5 cursor-pointer shadow-sm"
                      >
                        <Navigation className="h-3.5 w-3.5 animate-pulse" />
                        <span>{isDispatching ? "PROVISIONING ROUTE..." : "APPROVE & DISPATCH CREW"}</span>
                      </button>
                    </div>
                  ) : (
                    <div className="text-center py-16 text-slate-400 font-mono text-xs font-semibold leading-relaxed">
                      Select a pending complaint from the queue to run smart dispatch calculations.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: PREDICTIVE MAINTENANCE */}
          {activeTab === "predictions" && (
            <div className="space-y-6">
              <div className="space-y-1">
                <h2 className="text-2xl font-black font-sans tracking-tight text-slate-900">
                  Predictive Infrastructure Risk Analytics
                </h2>
                <p className="text-xs text-slate-500 font-medium">
                  Weather telemetry feed, road structural aging indices, and automated preventative maintenance alerts.
                </p>
              </div>

              {/* Weather conditions alert banner */}
              {weather && (
                <div className="bg-indigo-50 border border-indigo-150 rounded-xl p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-5 shadow-sm">
                  <div className="flex items-center space-x-3.5">
                    <div className="bg-indigo-100 p-3 rounded-xl text-indigo-700 shrink-0">
                      <CloudRain className="h-6 w-6" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-slate-900">Heavy Rain Warning: 42mm precipitation forecasted</h4>
                      <p className="text-xs text-slate-600 font-medium mt-0.5">
                        Soil saturation index has reached 88%, resulting in severe drainage backflow and pavement micro-fracture risks.
                      </p>
                    </div>
                  </div>

                  <span className="bg-red-50 border border-red-200 text-red-750 px-3 py-1.5 text-xs font-bold font-mono rounded-lg shrink-0">
                    ROAD FATIGUE RISK: SEVERE
                  </span>
                </div>
              )}

              {/* Prediction details cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {predictions.map((pred) => (
                  <div
                    key={pred.id}
                    className="bg-white border border-slate-200 rounded-xl p-5 space-y-4 shadow-sm"
                  >
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                      <span className="bg-slate-100 px-2 py-0.5 rounded text-[9px] font-mono text-slate-600 font-bold">
                        {pred.id}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold ${
                          pred.riskLevel === "Critical" ? "bg-red-50 border border-red-200 text-red-850" : "bg-amber-50 border border-amber-200 text-amber-850"
                        }`}
                      >
                        {pred.riskLevel.toUpperCase()} RISK
                      </span>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[8px] font-mono text-slate-500 block uppercase font-bold">PREDICTED DAMAGE AREA</span>
                      <h4 className="font-extrabold text-sm text-slate-900">{pred.category} Risk Zone</h4>
                    </div>

                    {/* Contributing weights */}
                    <div className="space-y-1.5">
                      <span className="text-[8px] font-mono text-slate-500 block uppercase font-bold">PREDICTION FATIGUE FACTORS</span>
                      {pred.factors.map((f, i) => (
                        <div key={i} className="flex items-center space-x-1.5 text-[10px] text-slate-600 font-mono font-medium">
                          <span className="h-1.5 w-1.5 bg-indigo-600 rounded-full shrink-0" />
                          <span>{f}</span>
                        </div>
                      ))}
                    </div>

                    {/* Preemptive Actions */}
                    <div className="bg-slate-50 p-3 rounded border border-slate-200 space-y-1 text-[10px] font-mono">
                      <span className="text-[8px] text-slate-500 block font-bold">AI SUGGESTED PREEMPTIVE PROTOCOL</span>
                      <span className="font-bold text-slate-700 italic">"{pred.suggestedAction}"</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: QUALITY INSPECTION / PHOTO VERIFICATION */}
          {activeTab === "verification" && (
            <div className="space-y-6">
              <div className="space-y-1">
                <h2 className="text-2xl font-black font-sans tracking-tight text-slate-900">
                  AI Quality Control & Audit Sign-Off
                </h2>
                <p className="text-xs text-slate-500 font-medium">
                  Audit finished repairs. Run Gemini Vision audits comparing Before and After photos to trigger auto-approvals.
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Pending Verification List */}
                <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-5 space-y-4 shadow-sm">
                  <h3 className="font-mono text-xs text-slate-700 uppercase font-bold border-b border-slate-100 pb-2">
                    Repairs Queue Awaiting Quality Sign-Off
                  </h3>

                  <div className="space-y-3">
                    {complaints.filter((c) => c.status === "QUALITY_INSPECTION").length === 0 ? (
                      <div className="text-center py-12 text-slate-400 font-mono text-xs font-semibold">
                        All active field repairs are either ongoing, or have passed AI audit verification checklists.
                      </div>
                    ) : (
                      complaints
                        .filter((c) => c.status === "QUALITY_INSPECTION")
                        .map((comp) => (
                          <div
                            key={comp.id}
                            onClick={() => setSelectedComplaint(comp)}
                            className={`p-4 rounded-xl border transition-all cursor-pointer shadow-sm ${
                              selectedComplaint?.id === comp.id
                                ? "bg-indigo-50/50 border-indigo-500"
                                : "bg-slate-50 border-slate-200 hover:border-slate-300 hover:bg-slate-100/30"
                            }`}
                          >
                            <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
                              <span className="bg-slate-200 text-slate-700 px-2 py-0.5 rounded font-bold text-[10px] font-mono">
                                {comp.id}
                              </span>
                              <span className="bg-indigo-50 border border-indigo-200 text-indigo-800 px-2 py-0.5 rounded font-bold text-[10px] font-mono animate-pulse">
                                WORK COMPLETED - VERIFY
                              </span>
                            </div>

                            <h4 className="font-extrabold text-sm text-slate-900">{comp.title}</h4>
                            <span className="text-[10px] font-mono text-slate-500 block mt-1 font-semibold">Crew: {comp.assignedCrewName}</span>
                          </div>
                        ))
                    )}
                  </div>
                </div>

                {/* Verification Panel Controller */}
                <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4 shadow-sm">
                  <h3 className="font-mono text-xs text-slate-700 uppercase font-bold border-b border-slate-100 pb-2">
                    Quality Verification Engine
                  </h3>

                  {selectedComplaint ? (
                    <div className="space-y-4 text-xs font-mono animate-fadeIn">
                      <div>
                        <span className="text-[8px] text-slate-500 uppercase block font-bold">Active Audit Target</span>
                        <span className="font-bold text-slate-900 block text-xs">{selectedComplaint.title}</span>
                      </div>

                      {/* Before / After side-by-side previews */}
                      <div className="grid grid-cols-2 gap-3 text-center">
                        <div className="space-y-1">
                          <span className="text-[8px] text-red-650 font-bold block">BEFORE</span>
                          <div className="h-16 w-full bg-slate-100 rounded overflow-hidden border border-slate-200">
                            {selectedComplaint.beforeImageUrl ? (
                              <img src={selectedComplaint.beforeImageUrl} alt="Before" className="h-full w-full object-cover" />
                            ) : (
                              <span className="text-slate-400 block pt-4 font-semibold text-[10px]">No Image</span>
                            )}
                          </div>
                        </div>

                        <div className="space-y-1">
                          <span className="text-[8px] text-emerald-700 font-bold block">AFTER</span>
                          <div className="h-16 w-full bg-slate-100 rounded overflow-hidden border border-slate-200">
                            {selectedComplaint.afterImageUrl ? (
                              <img src={selectedComplaint.afterImageUrl} alt="After" className="h-full w-full object-cover" />
                            ) : (
                              <span className="text-slate-400 block pt-4 font-semibold text-[10px]">No Image</span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Display results from audit if solved */}
                      {selectedComplaint.aiVerified ? (
                        <div className="bg-emerald-50 border border-emerald-150 rounded p-3 space-y-1.5 animate-fadeIn">
                          <div className="flex items-center space-x-1 text-[9px] text-emerald-800 font-bold">
                            <Sparkles className="h-3.5 w-3.5" />
                            <span>GEMINI QUALITY AUDIT VERIFIED SUCCESS</span>
                          </div>
                          <p className="text-[10px] text-slate-650 leading-relaxed italic font-semibold">
                            "{selectedComplaint.aiVerificationResult}"
                          </p>

                          <button
                            onClick={() => handleCloseCase(selectedComplaint.id)}
                            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-2 rounded font-bold tracking-wider text-xs transition-all uppercase mt-2 cursor-pointer shadow-sm"
                          >
                            SIGN OFF & CLOSE CASE
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleRunVerification(selectedComplaint.id)}
                          disabled={isVerifying}
                          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-lg text-xs font-bold transition-all uppercase flex items-center justify-center space-x-1.5 cursor-pointer shadow-sm"
                        >
                          <Sparkles className="h-3.5 w-3.5 animate-spin" style={{ animationDuration: "5s" }} />
                          <span>{isVerifying ? "GEMINI VISION COMPARING..." : "RUN AI PHOTO VERIFICATION"}</span>
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-16 text-slate-400 font-mono text-xs font-semibold leading-relaxed">
                      Select a finished repair from the quality queue to compare Before and After images with Gemini.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: REPORTS GENERATOR */}
          {activeTab === "reports" && (
            <div className="space-y-6 max-w-4xl">
              <div className="space-y-1 flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-black font-sans tracking-tight text-slate-900">
                    Municipal Performance Reports
                  </h2>
                  <p className="text-xs text-slate-500 font-medium">
                    Audit and export budget sheets, crew performance stats, and satisfaction charts.
                  </p>
                </div>

                <div className="flex space-x-1 bg-white p-1 rounded-lg border border-slate-200 shadow-sm">
                  {(["daily", "weekly", "monthly"] as const).map((range) => (
                    <button
                      key={range}
                      onClick={() => setReportRange(range)}
                      className={`px-3 py-1 font-mono text-[10px] rounded uppercase transition-all cursor-pointer font-bold ${
                        reportRange === range ? "bg-indigo-50 text-indigo-700" : "text-slate-500 hover:text-slate-800"
                      }`}
                    >
                      {range}
                    </button>
                  ))}
                </div>
              </div>

              {/* PDF printable report layout preview */}
              <div className="bg-white text-slate-900 rounded-xl p-8 border border-slate-200 shadow-2xl max-w-3xl mx-auto space-y-6 font-sans">
                {/* Print Header */}
                <div className="flex justify-between items-start border-b-2 border-slate-850 pb-5">
                  <div className="space-y-1">
                    <span className="font-mono text-[10px] bg-slate-900 text-white px-2 py-0.5 rounded font-bold uppercase tracking-wider">
                      OFFICIAL MUNICIPAL AUDIT REPORT
                    </span>
                    <h3 className="text-2xl font-black font-serif tracking-tight text-slate-900">CIVORA SMART CORP</h3>
                    <p className="text-[10px] font-mono text-slate-500 uppercase font-bold">
                      ZONE CENTRAL • BANGALORE CIVIC BODY • MONSOON FY26
                    </p>
                  </div>
                  <div className="text-right space-y-1 font-mono text-[10px] text-slate-500 font-semibold">
                    <span>Date Generated: {new Date().toLocaleDateString()}</span>
                    <span className="block">Audited by: CIVORA AI Core</span>
                    <span className="block font-bold text-slate-800">Range: {reportRange.toUpperCase()} SHEET</span>
                  </div>
                </div>

                {/* Core summary metrics */}
                <div className="grid grid-cols-3 gap-4 border-b border-slate-200 pb-5 text-center">
                  <div className="p-3 bg-slate-50 rounded-lg">
                    <span className="text-[9px] font-mono text-slate-500 uppercase block font-bold">Total Solved Rate</span>
                    <span className="text-xl font-extrabold text-slate-900">92.5%</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg">
                    <span className="text-[9px] font-mono text-slate-500 uppercase block font-bold">Expenditure Disbursed</span>
                    <span className="text-xl font-extrabold text-slate-900 font-mono">₹3,45,200</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg">
                    <span className="text-[9px] font-mono text-slate-500 uppercase block font-bold">Quality Audit Index</span>
                    <span className="text-xl font-extrabold text-slate-900">96.8 / 100</span>
                  </div>
                </div>

                {/* Audit table */}
                <div className="space-y-2">
                  <span className="text-[10px] font-mono font-bold tracking-wider text-slate-400 uppercase block">
                    Expenditure breakdown by category
                  </span>
                  <table className="w-full text-xs text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-850 text-[10px] font-mono text-slate-500 uppercase font-bold">
                        <th className="py-2">INCIDENT TYPE</th>
                        <th className="py-2">RESOLVED CASES</th>
                        <th className="py-2">BUDGET ALLOCATED</th>
                        <th className="py-2 text-right">AUDIT RATING</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-mono font-semibold text-slate-700">
                      <tr>
                        <td className="py-2.5 font-bold text-slate-800">Pothole Repair</td>
                        <td className="py-2.5">14</td>
                        <td className="py-2.5">₹1,68,000</td>
                        <td className="py-2.5 text-right font-bold text-emerald-600">94%</td>
                      </tr>
                      <tr>
                        <td className="py-2.5 font-bold text-slate-800">Drainage Desilting</td>
                        <td className="py-2.5">9</td>
                        <td className="py-2.5">₹76,500</td>
                        <td className="py-2.5 text-right font-bold text-emerald-600">92%</td>
                      </tr>
                      <tr>
                        <td className="py-2.5 font-bold text-slate-800">Streetlight Overhauls</td>
                        <td className="py-2.5">22</td>
                        <td className="py-2.5">₹44,000</td>
                        <td className="py-2.5 text-right font-bold text-emerald-600">98%</td>
                      </tr>
                      <tr>
                        <td className="py-2.5 font-bold text-slate-800">Debris Disposal</td>
                        <td className="py-2.5">18</td>
                        <td className="py-2.5">₹56,700</td>
                        <td className="py-2.5 text-right font-bold text-emerald-600">96%</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Sign off seal */}
                <div className="flex justify-between items-end border-t border-slate-200 pt-5 mt-4">
                  <div className="space-y-1">
                    <span className="text-[8px] font-mono text-slate-400 block uppercase font-bold">SYSTEM VERIFICATION SEAL</span>
                    <div className="flex items-center space-x-1.5 text-emerald-600 font-mono text-[10px] font-bold">
                      <CheckCircle className="h-4 w-4 shrink-0" />
                      <span>SECURE CIVORA AI SIGN-OFF PASSED</span>
                    </div>
                  </div>
                  <div className="border-t border-slate-400 w-32 text-center text-[9px] font-mono text-slate-500 pt-1 uppercase font-bold">
                    Municipal Commissioner
                  </div>
                </div>
              </div>

              {/* Action Buttons to trigger print */}
              <div className="flex justify-center pt-2">
                <button
                  onClick={() => window.print()}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-mono text-xs font-bold uppercase tracking-wider px-6 py-3 rounded-lg shadow-xl hover:scale-105 active:scale-95 transition-all cursor-pointer"
                >
                  PRINT AUDIT REPORT (PDF)
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
