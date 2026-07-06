/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import {
  MapPin,
  Sparkles,
  Search,
  Filter,
  PlusCircle,
  Clock,
  Award,
  ShieldAlert,
  ThumbsUp,
  X,
  Send,
  Volume2,
  CheckCircle,
  FileText,
  User as UserIcon,
  Flame,
  Check,
  ChevronRight,
} from "lucide-react";
import { User, Complaint, ComplaintStatus, LeaderboardUser } from "../types";
import VoiceInput from "../components/VoiceInput";
import ImageUploader from "../components/ImageUploader";
import DuplicateWarning from "../components/DuplicateWarning";
import SeverityEngineDetails from "../components/SeverityEngineDetails";
import TimelineTracker from "../components/TimelineTracker";

interface CitizenPortalProps {
  currentUser: User;
  onLogout: () => void;
  onUpdateUser: (u: User) => void;
}

export default function CitizenPortal({ currentUser, onLogout, onUpdateUser }: CitizenPortalProps) {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);
  const [activeTab, setActiveTab] = useState<"dashboard" | "submit" | "leaderboard">("dashboard");

  // Filter and search state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedStatus, setSelectedStatus] = useState("All");

  // Selected complaint for detailed view
  const [activeComplaint, setActiveComplaint] = useState<Complaint | null>(null);

  // Submission Form State
  const [formTitle, setFormTitle] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formCategory, setFormCategory] = useState("Pothole");
  const [formImg, setFormImg] = useState("");
  const [formLat, setFormLat] = useState(12.9716); // Default Bangalore Center
  const [formLng, setFormLng] = useState(77.5946);
  const [formLocName, setFormLocName] = useState("");

  // AI & Duplicate validation States
  const [isLocating, setIsLocating] = useState(false);
  const [duplicates, setDuplicates] = useState<Complaint[]>([]);
  const [isCheckingDuplicates, setIsCheckingDuplicates] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isVoting, setIsVoting] = useState(false);

  // Server-side AI results to display
  const [aiAnalysis, setAiAnalysis] = useState<any | null>(null);

  // Fetch complaints on load
  const loadComplaints = async () => {
    try {
      const res = await fetch("/api/complaints");
      const data = await res.json();
      setComplaints(data);
    } catch (err) {
      console.error("Failed to load complaints from backend", err);
    }
  };

  // Fetch leaderboard rankings
  const loadLeaderboard = async () => {
    try {
      const res = await fetch("/api/leaderboard");
      const data = await res.json();
      setLeaderboard(data);
    } catch (err) {
      console.error("Failed to load leaderboard rankings", err);
    }
  };

  useEffect(() => {
    loadComplaints();
    loadLeaderboard();
  }, [activeTab]);

  // Request & Auto Detect GPS coordinates
  const detectLocation = () => {
    setIsLocating(true);
    if (!navigator.geolocation) {
      // Permission denied or unsupported fallback
      setFormLat(20.5937); // India Default Latitude
      setFormLng(78.9629);
      setFormLocName("Central Civic Zone, India");
      setIsLocating(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setFormLat(position.coords.latitude);
        setFormLng(position.coords.longitude);
        setFormLocName(`GPS Location Sector (${position.coords.latitude.toFixed(4)}, ${position.coords.longitude.toFixed(4)})`);
        setIsLocating(false);
        // Run duplicate checking
        checkDuplicates(position.coords.latitude, position.coords.longitude, formCategory);
      },
      () => {
        // Fallback India
        setFormLat(20.5937);
        setFormLng(78.9629);
        setFormLocName("Central Civic Zone, India (GPS Denied)");
        setIsLocating(false);
      }
    );
  };

  // Run Duplicate Detection check
  const checkDuplicates = async (lat: number, lng: number, cat: string) => {
    setIsCheckingDuplicates(true);
    try {
      const res = await fetch("/api/complaints/check-duplicate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ latitude: lat, longitude: lng, category: cat }),
      });
      const data = await res.json();
      if (data.isDuplicate) {
        setDuplicates(data.duplicates);
      } else {
        setDuplicates([]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsCheckingDuplicates(false);
    }
  };

  // Handle support upvote on duplicate
  const handleSupportDuplicate = async (compId: string) => {
    setIsVoting(true);
    try {
      const res = await fetch(`/api/complaints/${compId}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: currentUser.id }),
      });
      const data = await res.json();
      if (data.complaint) {
        // Update user session details (Points / Trust)
        onUpdateUser(data.citizen);
        loadComplaints();
        setDuplicates([]);
        setActiveTab("dashboard");
        // Open the upvoted detail view
        setActiveComplaint(data.complaint);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsVoting(false);
    }
  };

  // Voice Speech extraction callback
  const handleVoiceExtract = (extracted: any) => {
    setFormTitle(extracted.complaint.slice(0, 50));
    setFormDesc(extracted.complaint);
    setFormCategory(extracted.category);
    // Check duplicates again with new category
    checkDuplicates(formLat, formLng, extracted.category);
  };

  // Vision analyzer callback
  const handleVisionExtract = (analysis: any) => {
    setFormCategory(analysis.category);
    setFormImg(analysis.imageBase64);
    setAiAnalysis(analysis);
    // Auto populate details from vision if fields empty
    if (!formTitle) setFormTitle(`AI Verified ${analysis.category} Issue`);
    if (!formDesc) setFormDesc(`Automatic Computer Vision Inspection: detected a ${analysis.category} with ${analysis.severity} severity index. Suggested action: ${analysis.suggestedAction}`);
    checkDuplicates(formLat, formLng, analysis.category);
  };

  // Handle Submit Form
  const handleSubmitComplaint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle || !formDesc) return;

    setIsSubmitting(true);
    try {
      const payload = {
        citizenId: currentUser.id,
        title: formTitle,
        description: formDesc,
        category: formCategory,
        imageUrl: formImg,
        latitude: formLat,
        longitude: formLng,
        locationName: formLocName || "Auto-detected Civic Zone",
        severity: aiAnalysis?.severity || "High",
        priorityScore: aiAnalysis?.confidence || 75,
        estimatedCost: aiAnalysis?.estimatedCost || 12000,
        estimatedHours: aiAnalysis?.estimatedHours || 4,
      };

      const res = await fetch("/api/complaints/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        // Update user session details (points incremented)
        onUpdateUser(data.citizen);
        setFormTitle("");
        setFormDesc("");
        setFormImg("");
        setAiAnalysis(null);
        setDuplicates([]);
        setActiveTab("dashboard");
        loadComplaints();
      }
    } catch (err) {
      console.error("Submission failed", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter complaints list
  const filteredComplaints = complaints.filter((comp) => {
    const matchesSearch =
      comp.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      comp.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      comp.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      comp.locationName.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = selectedCategory === "All" || comp.category === selectedCategory;
    const matchesStatus = selectedStatus === "All" || comp.status === selectedStatus;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-slate-50 text-slate-800" id="citizen-portal-view">
      {/* Sidebar shell */}
      <div className="w-full lg:w-80 bg-white border-b lg:border-b-0 lg:border-r border-slate-200 flex flex-col justify-between shrink-0 shadow-sm">
        <div>
          {/* Logo Brand Header */}
          <div className="p-6 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="bg-blue-600 h-9 w-9 rounded-lg flex items-center justify-center font-black text-white font-sans tracking-tight">
                CIV
              </div>
              <div>
                <h1 className="font-extrabold tracking-tight font-sans text-lg text-slate-900">CIVORA</h1>
                <span className="text-[10px] font-mono tracking-widest text-blue-600 block uppercase font-bold">
                  CITIZEN HUB
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

          {/* User Profile Block */}
          <div className="p-5 border-b border-slate-200 bg-slate-50 space-y-3">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
                <UserIcon className="h-5 w-5" />
              </div>
              <div className="space-y-0.5">
                <h3 className="font-bold text-xs text-slate-800">{currentUser.name}</h3>
                <span className="text-[9px] font-mono text-slate-500 block">{currentUser.email}</span>
              </div>
            </div>

            {/* User Trust & Points meters */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="bg-white border border-slate-200 p-2 rounded-lg text-center shadow-sm">
                <span className="text-[8px] font-mono text-slate-500 uppercase tracking-widest block font-semibold">Trust Index</span>
                <span className="font-bold text-sm text-emerald-700 font-mono">{currentUser.trustScore}%</span>
              </div>
              <div className="bg-white border border-slate-200 p-2 rounded-lg text-center shadow-sm">
                <span className="text-[8px] font-mono text-slate-500 uppercase tracking-widest block font-semibold">Rewards Pts</span>
                <span className="font-bold text-sm text-blue-600 font-mono">{currentUser.points}</span>
              </div>
            </div>

            {/* Badges badges */}
            <div className="space-y-1">
              <span className="text-[8px] font-mono text-slate-500 uppercase tracking-widest block font-semibold">Achievements</span>
              <div className="flex flex-wrap gap-1">
                {currentUser.badges.map((badge, idx) => (
                  <span
                    key={idx}
                    className="bg-blue-50 text-blue-800 border border-blue-200 text-[9px] font-mono px-2 py-0.5 rounded font-bold"
                  >
                    {badge}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Navigation Items */}
          <div className="p-4 space-y-1">
            <button
              onClick={() => {
                setActiveTab("dashboard");
                setActiveComplaint(null);
              }}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-lg text-xs font-mono uppercase tracking-wider transition-all cursor-pointer ${
                activeTab === "dashboard"
                  ? "bg-blue-50 border border-blue-200 text-blue-700 font-bold"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/50"
              }`}
            >
              <span>Dashboard & Reports</span>
              <ChevronRight className="h-4 w-4 shrink-0" />
            </button>

            <button
              onClick={() => {
                setActiveTab("submit");
                setActiveComplaint(null);
              }}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-lg text-xs font-mono uppercase tracking-wider transition-all cursor-pointer ${
                activeTab === "submit"
                  ? "bg-blue-50 border border-blue-200 text-blue-700 font-bold"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/50"
              }`}
            >
              <span className="flex items-center">
                <PlusCircle className="h-4 w-4 mr-2 text-blue-600 animate-pulse" />
                Submit New Complaint
              </span>
              <ChevronRight className="h-4 w-4 shrink-0" />
            </button>

            <button
              onClick={() => {
                setActiveTab("leaderboard");
                setActiveComplaint(null);
              }}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-lg text-xs font-mono uppercase tracking-wider transition-all cursor-pointer ${
                activeTab === "leaderboard"
                  ? "bg-blue-50 border border-blue-200 text-blue-700 font-bold"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/50"
              }`}
            >
              <span>Rewards Leaderboard</span>
              <ChevronRight className="h-4 w-4 shrink-0" />
            </button>
          </div>
        </div>

        {/* Footer Support Info */}
        <div className="p-6 border-t border-slate-200 text-center space-y-1">
          <span className="text-[9px] font-mono text-slate-400 uppercase tracking-widest block font-bold">
            CIVORA SMART HELPDESK
          </span>
          <p className="text-[10px] text-slate-600 font-medium">Emergency Municipal Helpline: 1913</p>
        </div>
      </div>

      {/* Main content body */}
      <div className="flex-1 flex flex-col min-w-0 bg-slate-950 overflow-y-auto">
        <div className="p-6 lg:p-8 space-y-6">
          {/* TAB 1: DASHBOARD VIEW */}
          {activeTab === "dashboard" && !activeComplaint && (
            <div className="space-y-6">
              {/* Headline */}
              <div className="space-y-1">
                <h2 className="text-2xl font-black font-sans tracking-tight text-slate-900">
                  Citizen Dashboard
                </h2>
                <p className="text-xs text-slate-500">
                  Monitor reports, support active cases, and redeem community points.
                </p>
              </div>

              {/* Stats highlights */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white border border-slate-200 p-4 rounded-xl flex items-center space-x-4 shadow-sm">
                  <div className="bg-red-50 border border-red-100 p-3 rounded-xl text-red-600">
                    <Clock className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="text-[9px] font-mono text-slate-500 block uppercase font-bold">Your Active Reports</span>
                    <span className="text-xl font-bold font-mono text-slate-900">
                      {complaints.filter((c) => c.citizenId === currentUser.id && c.status !== "CLOSED").length} Cases
                    </span>
                  </div>
                </div>

                <div className="bg-white border border-slate-200 p-4 rounded-xl flex items-center space-x-4 shadow-sm">
                  <div className="bg-blue-50 border border-blue-100 p-3 rounded-xl text-blue-600">
                    <Award className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="text-[9px] font-mono text-slate-500 block uppercase font-bold">Rank Percentile</span>
                    <span className="text-xl font-bold font-mono text-slate-900">Top 8%</span>
                  </div>
                </div>

                <div className="bg-white border border-slate-200 p-4 rounded-xl flex items-center space-x-4 shadow-sm">
                  <div className="bg-emerald-50 border border-emerald-100 p-3 rounded-xl text-emerald-600">
                    <CheckCircle className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="text-[9px] font-mono text-slate-500 block uppercase font-bold">Global Solved Rate</span>
                    <span className="text-xl font-bold font-mono text-slate-900">82% Verified</span>
                  </div>
                </div>
              </div>

              {/* Complaints List Segment */}
              <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm space-y-4 p-5">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-100 pb-4">
                  <div>
                    <h3 className="font-bold text-sm text-slate-800 uppercase font-mono tracking-wider">
                      Municipal Case Registry
                    </h3>
                    <p className="text-[11px] text-slate-500">Browse and support reported civic damages</p>
                  </div>

                  {/* Filter and search bar */}
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Search query input */}
                    <div className="relative">
                      <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Search IDs, locations..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-slate-800 focus:outline-none focus:border-blue-500 w-full sm:w-48"
                      />
                    </div>

                    {/* Category Dropdown */}
                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="bg-slate-50 border border-slate-200 px-3 py-2 rounded-lg text-xs font-mono text-slate-700 focus:outline-none focus:border-blue-500"
                    >
                      <option value="All">All Categories</option>
                      <option value="Pothole">Potholes</option>
                      <option value="Garbage">Garbage</option>
                      <option value="Streetlight">Streetlight</option>
                      <option value="Drainage">Drainage</option>
                      <option value="Water Leakage">Water Leakage</option>
                      <option value="Tree Fallen">Tree Fallen</option>
                    </select>
                  </div>
                </div>

                {/* Complaints Feed */}
                <div className="space-y-3">
                  {filteredComplaints.length === 0 ? (
                    <div className="text-center py-12 text-slate-500 font-mono text-xs">
                      No active complaints match your filter criteria.
                    </div>
                  ) : (
                    filteredComplaints.map((comp) => (
                      <div
                        key={comp.id}
                        onClick={() => setActiveComplaint(comp)}
                        className="bg-white border border-slate-200 hover:border-slate-350 hover:shadow-sm transition-all p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer shadow-sm"
                      >
                        <div className="space-y-1.5 max-w-2xl">
                          <div className="flex flex-wrap items-center gap-2 text-[10px] font-mono text-slate-500">
                            <span className="bg-slate-150 border border-slate-250 px-2 py-0.5 rounded font-bold text-blue-700">
                              {comp.id}
                            </span>
                            <span className="bg-slate-50 border border-slate-200 px-2 py-0.5 rounded text-slate-700 uppercase font-bold">
                              {comp.category}
                            </span>
                            <span>•</span>
                            <span className="flex items-center text-red-600 font-semibold">
                              <MapPin className="h-3.5 w-3.5 mr-1" />
                              {comp.locationName}
                            </span>
                          </div>

                          <h4 className="font-extrabold text-sm text-slate-900">{comp.title}</h4>
                          <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">{comp.description}</p>
                        </div>

                        {/* Status tag & vote support count */}
                        <div className="flex items-center space-x-3 self-end sm:self-auto">
                          <div className="text-right space-y-1 hidden sm:block">
                            <span className="text-[8px] font-mono text-slate-450 uppercase tracking-widest block font-semibold">
                              STATUS REPORT
                            </span>
                            <span className="text-xs font-mono font-bold text-slate-700">
                              {comp.status.replace("_", " ")}
                            </span>
                          </div>

                          <div className="bg-slate-50 border border-slate-200 p-2 rounded-lg flex items-center space-x-1.5 hover:bg-slate-100 transition-all">
                            <ThumbsUp className="h-4 w-4 text-blue-600" />
                            <span className="font-mono text-xs text-slate-800 font-bold">{comp.upvotes}</span>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: COMPLAINT DETAILED MODAL TRACKER */}
          {activeComplaint && (
            <div className="space-y-6">
              <button
                onClick={() => {
                  setActiveComplaint(null);
                  loadComplaints();
                }}
                className="flex items-center space-x-1.5 text-xs font-mono text-blue-600 hover:text-blue-700 font-bold cursor-pointer"
              >
                <span>← BACK TO REGISTRY LIST</span>
              </button>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Case Info Card */}
                <div className="lg:col-span-2 space-y-5">
                  <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4 shadow-sm">
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <span className="bg-slate-50 px-2.5 py-0.5 rounded border border-slate-200 text-[10px] font-mono text-blue-600 font-bold">
                            {activeComplaint.id}
                          </span>
                          <span className="text-[11px] font-mono text-red-650 font-bold uppercase">
                            {activeComplaint.category}
                          </span>
                        </div>
                        <h3 className="text-xl font-bold text-slate-900">{activeComplaint.title}</h3>
                      </div>
                      <span className="bg-red-50 text-red-700 text-xs px-2.5 py-1 rounded-lg border border-red-200 font-bold font-mono">
                        {activeComplaint.severity} Priority
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest block font-bold">
                        Citizen Description
                      </span>
                      <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-200">
                        "{activeComplaint.description}"
                      </p>
                    </div>

                    {/* Geolocation coordinate mapping */}
                    <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-slate-500 pt-1 font-medium">
                      <div className="flex items-center text-red-650 font-semibold">
                        <MapPin className="h-4 w-4 mr-1 text-red-650" />
                        <span>{activeComplaint.locationName}</span>
                      </div>
                      <div>
                        <span>Coordinates: {activeComplaint.latitude.toFixed(5)}, {activeComplaint.longitude.toFixed(5)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Progressive Timeline component */}
                  <TimelineTracker complaint={activeComplaint} />
                </div>

                {/* Right sidebar info widgets */}
                <div className="space-y-5">
                  {/* Pavement details & Cost summaries calculated */}
                  <SeverityEngineDetails
                    priorityScore={activeComplaint.priorityScore}
                    riskScore={activeComplaint.riskScore}
                    severity={activeComplaint.severity}
                    estimatedCost={activeComplaint.estimatedCost}
                    estimatedHours={activeComplaint.estimatedHours}
                  />

                  {/* Citizen voting action helper if not currently supported */}
                  {!activeComplaint.supportedBy.includes(currentUser.id) && (
                    <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3 shadow-sm">
                      <h4 className="font-bold text-xs text-slate-850 font-mono uppercase tracking-wider">
                        VOTE TO ESCALATE COMPLAINT
                      </h4>
                      <p className="text-[11px] text-slate-550 leading-relaxed font-medium">
                        Is this issue affecting your daily commute too? Support this report to increase its priority weight in the city dispatch queue.
                      </p>
                      <button
                        onClick={() => handleSupportDuplicate(activeComplaint.id)}
                        disabled={isVoting}
                        className="w-full flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white p-2.5 rounded-lg text-xs font-bold font-mono transition-all cursor-pointer shadow-sm disabled:opacity-50"
                      >
                        <ThumbsUp className="h-4 w-4" />
                        <span>{isVoting ? "SUBMITTING VOTE..." : "UPVOTE REPORT (+15 REWARDS PTS)"}</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: SUBMIT COMPLAINT WIZARD */}
          {activeTab === "submit" && (
            <div className="space-y-6 max-w-3xl">
              {/* Form Headline */}
              <div className="space-y-1">
                <h2 className="text-2xl font-black font-sans tracking-tight text-slate-900">
                  Register Civic Issue
                </h2>
                <p className="text-xs text-slate-550 font-medium">
                  Submit photos or spoken complaints. Our server's AI analyzes and audits instantly.
                </p>
              </div>

              {/* Main submit form flow */}
              <form onSubmit={handleSubmitComplaint} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Category select block */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-mono uppercase tracking-widest text-slate-500 block font-bold">
                      Infrastructure Category
                    </label>
                    <select
                      value={formCategory}
                      onChange={(e) => {
                        setFormCategory(e.target.value);
                        checkDuplicates(formLat, formLng, e.target.value);
                      }}
                      className="w-full bg-white border border-slate-250 p-3 rounded-lg text-xs font-mono text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/10 shadow-sm font-semibold"
                    >
                      <option value="Pothole">Pothole Filling / Repair</option>
                      <option value="Garbage">Garbage / Waste Disposal</option>
                      <option value="Streetlight">Streetlight Flickering / Broken</option>
                      <option value="Drainage">Drainage Blocking / Overflow</option>
                      <option value="Water Leakage">Water Pipe Leakage / Burst</option>
                      <option value="Tree Fallen">Fallen Tree / Road Obstruction</option>
                      <option value="Sewage">Sewage Overflow / Contamination</option>
                    </select>
                  </div>

                  {/* Geolocation details mapping */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-mono uppercase tracking-widest text-slate-500 block font-bold">
                      GPS Coordinates & Location
                    </label>
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        placeholder="Detect location coordinates..."
                        value={formLocName}
                        readOnly
                        className="flex-1 bg-slate-100 border border-slate-200 p-3 rounded-lg text-xs font-mono text-slate-600 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={detectLocation}
                        disabled={isLocating}
                        className="bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 px-3.5 py-2 rounded-lg text-xs font-mono font-bold transition-all uppercase cursor-pointer shadow-sm"
                      >
                        {isLocating ? "LOCATING..." : "GET GPS"}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Intelligent Warning overlay */}
                <DuplicateWarning
                  duplicates={duplicates}
                  onSupportDuplicate={handleSupportDuplicate}
                  isVoting={isVoting}
                />

                {/* Multimodal Inputs */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Computer Vision Diagnostic */}
                  <ImageUploader onAnalyzeSuccess={handleVisionExtract} />

                  {/* NLP Spoken Voice Extraction */}
                  <VoiceInput onExtractSuccess={handleVoiceExtract} />
                </div>

                {/* Details validation form card */}
                <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4 shadow-sm animate-fadeIn">
                  <h4 className="font-bold text-xs font-mono uppercase text-slate-800 tracking-wider">
                    Complaint Classification Form Checks
                  </h4>

                  <div className="space-y-3">
                    <div className="space-y-1">
                      <label className="text-[9px] font-mono uppercase tracking-widest text-slate-450 block font-bold">
                        Issue Title Header
                      </label>
                      <input
                        type="text"
                        placeholder="E.g. Hazardous pothole blocks Sector 3 high school gate..."
                        value={formTitle}
                        onChange={(e) => setFormTitle(e.target.value)}
                        required
                        className="w-full bg-slate-50 border border-slate-250 p-3 rounded-lg text-xs font-mono text-slate-900 focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] font-mono uppercase tracking-widest text-slate-450 block font-bold">
                        Complete Core Description
                      </label>
                      <textarea
                        rows={3}
                        placeholder="Specify exact details, traffic congestion level, risks to children or nearby residents..."
                        value={formDesc}
                        onChange={(e) => setFormDesc(e.target.value)}
                        required
                        className="w-full bg-slate-50 border border-slate-250 p-3 rounded-lg text-xs font-mono text-slate-900 focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Bottom Submit Actions */}
                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab("dashboard");
                      setDuplicates([]);
                    }}
                    className="bg-slate-100 hover:bg-slate-200 border border-slate-250 text-slate-700 px-5 py-3 rounded-lg text-xs font-mono font-bold transition-all uppercase cursor-pointer"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={isSubmitting || isCheckingDuplicates}
                    className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-6 py-3 rounded-lg text-xs font-mono font-bold transition-all uppercase flex items-center space-x-1.5 cursor-pointer shadow-sm"
                  >
                    <Send className="h-4 w-4" />
                    <span>{isSubmitting ? "TRANSMITTING TO CIVORA AI..." : "VERIFY & SUBMIT CASE"}</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 4: LEADERBOARD & REWARDS Achievements */}
          {activeTab === "leaderboard" && (
            <div className="space-y-6 max-w-4xl">
              {/* Leaderboard Header */}
              <div className="space-y-1">
                <h2 className="text-2xl font-black font-sans tracking-tight text-slate-900 animate-fadeIn">
                  Monthly Citizen Leaderboard
                </h2>
                <p className="text-xs text-slate-550 font-medium">
                  Earn trust points by filing verified civic complaints and preventing duplicate spam.
                </p>
              </div>

              {/* Ranks list */}
              <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <span className="font-mono text-xs text-slate-700 uppercase font-bold">
                    Active Leaderboard Standings
                  </span>
                  <span className="bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-mono px-2 py-0.5 rounded font-bold">
                    RESETS IN 24 DAYS
                  </span>
                </div>

                <div className="space-y-2">
                  {leaderboard.map((user) => (
                    <div
                      key={user.id}
                      className={`flex items-center justify-between p-3.5 rounded-lg border transition-all ${
                        user.id === currentUser.id
                          ? "bg-blue-50 border-blue-300 shadow-sm"
                          : "bg-slate-50 border-slate-200 hover:border-slate-350 hover:bg-slate-100/30"
                      }`}
                    >
                      <div className="flex items-center space-x-4">
                        <span className="text-sm font-black font-mono text-slate-500 w-6 text-center">
                          #{user.rank}
                        </span>

                        <div className="space-y-0.5">
                          <h4 className="font-extrabold text-xs text-slate-900">
                            {user.name} {user.id === currentUser.id && <span className="text-blue-600 text-[10px] ml-1 font-bold font-mono">(You)</span>}
                          </h4>
                          <span className="text-[10px] font-mono text-slate-500 block font-medium">
                            Resolved Complaints: {user.complaintsResolved} Cases
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center space-x-6">
                        <div className="text-right">
                          <span className="text-[8px] font-mono text-slate-400 block uppercase font-bold">Trust Index</span>
                          <span className="font-mono font-bold text-xs text-emerald-700">{user.trustScore}%</span>
                        </div>
                        <div className="text-right">
                          <span className="text-[8px] font-mono text-slate-400 block uppercase font-bold">Rewards Points</span>
                          <span className="font-mono font-bold text-xs text-blue-600">{user.points} XP</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
