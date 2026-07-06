/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { MapPin, Info, Flame, Navigation, CloudLightning, ShieldCheck, AlertTriangle } from "lucide-react";
import { Complaint, Crew, PredictionPoint } from "../types";

interface MapDigitalTwinProps {
  complaints: Complaint[];
  crews: Crew[];
  predictions: PredictionPoint[];
  onSelectComplaint?: (c: Complaint) => void;
  selectedComplaintId?: string | null;
  showHeatmap?: boolean;
  showPredictions?: boolean;
}

export default function MapDigitalTwin({
  complaints,
  crews,
  predictions,
  onSelectComplaint,
  selectedComplaintId,
  showHeatmap = false,
  showPredictions = true,
}: MapDigitalTwinProps) {
  const [activeTab, setActiveTab] = useState<"standard" | "satellite" | "digital_twin">("digital_twin");
  const [hoveredItem, setHoveredItem] = useState<{
    type: "complaint" | "crew" | "prediction";
    name: string;
    details: string;
    x: number;
    y: number;
  } | null>(null);

  // Map coordinates mapping helper (maps lat 12.94 to 12.99 and lon 77.58 to 77.62 to SVG dimensions 0-1000)
  const mapCoords = (lat: number, lon: number) => {
    // Standardize around Bangalore coords defined in database
    const minLat = 12.94;
    const maxLat = 12.99;
    const minLon = 77.58;
    const maxLon = 77.62;

    const x = ((lon - minLon) / (maxLon - minLon)) * 1000;
    // In SVG, y is 0 at top, so invert lat
    const y = (1 - (lat - minLat) / (maxLat - minLat)) * 600;

    return { x: Math.max(50, Math.min(950, x)), y: Math.max(50, Math.min(550, y)) };
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "REPORTED":
      case "AI_VERIFIED":
        return "#EF4444"; // Red
      case "ACCEPTED":
      case "CREW_ASSIGNED":
        return "#F59E0B"; // Yellow / Orange
      case "CREW_ON_ROUTE":
      case "REPAIR_STARTED":
      case "REPAIR_IN_PROGRESS":
        return "#8B5CF6"; // Purple
      case "COMPLETED":
        return "#3B82F6"; // Blue
      case "CLOSED":
        return "#10B981"; // Green
      default:
        return "#6B7280"; // Gray
    }
  };

  return (
    <div className="relative w-full bg-white rounded-xl overflow-hidden shadow-sm border border-slate-200" id="map-control-center">
      {/* Map Control Headers */}
      <div className="flex flex-wrap items-center justify-between p-4 bg-slate-50 border-b border-slate-200 z-10">
        <div className="flex items-center space-x-3">
          <div className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <h3 className="font-mono text-sm tracking-widest text-slate-850 uppercase font-bold">
            CIVORA Digital Twin Live Feed
          </h3>
        </div>

        <div className="flex space-x-1 bg-slate-100 p-1 rounded-lg border border-slate-200">
          {(["standard", "satellite", "digital_twin"] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setActiveTab(mode)}
              className={`px-3 py-1 font-mono text-[11px] rounded uppercase transition-all cursor-pointer ${
                activeTab === mode
                  ? "bg-white text-blue-600 font-bold border border-slate-200 shadow-sm"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              {mode.replace("_", " ")}
            </button>
          ))}
        </div>
      </div>

      {/* Main SVG/Canvas Map */}
      <div className="relative w-full h-[500px] overflow-hidden select-none bg-slate-100">
        {/* Background Grid Patterns */}
        <div className="absolute inset-0 bg-[radial-gradient(#cbd5e1_1.5px,transparent_1.5px)] [background-size:24px_24px] opacity-60" />

        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 1000 600" preserveAspectRatio="xMidYMid slice">
          {/* Street Road Map Network (Digital Twin Aesthetic) */}
          <g opacity={activeTab === "digital_twin" ? 0.75 : 0.3} className="transition-all duration-500">
            {/* Major Arterial Highways */}
            <path d="M 0 300 Q 500 250 1000 300" stroke="#cbd5e1" strokeWidth="12" fill="none" />
            <path d="M 500 0 L 500 600" stroke="#cbd5e1" strokeWidth="10" fill="none" />
            <path d="M 150 0 C 300 200 400 400 650 600" stroke="#e2e8f0" strokeWidth="8" fill="none" />
            <path d="M 0 100 Q 400 150 1000 120" stroke="#e2e8f0" strokeWidth="6" fill="none" />
            <path d="M 0 500 Q 500 450 1000 520" stroke="#e2e8f0" strokeWidth="6" fill="none" />

            {/* Grid Intersections */}
            <circle cx="500" cy="285" r="30" stroke="#94a3b8" strokeWidth="2" fill="#f8fafc" strokeDasharray="3 3" />
            <circle cx="210" cy="110" r="15" stroke="#94a3b8" strokeWidth="1" fill="#f8fafc" />
            <circle cx="800" cy="505" r="20" stroke="#94a3b8" strokeWidth="1" fill="#f8fafc" />

            {/* Smart City Infrastructure Overlays */}
            {/* School Zone */}
            <rect x="180" y="50" width="120" height="80" rx="6" fill="#eff6ff" opacity="0.8" stroke="#3b82f6" strokeWidth="1" strokeDasharray="4 4" />
            <text x="240" y="95" textAnchor="middle" fill="#2563eb" fontSize="10" fontFamily="monospace" fontWeight="bold" opacity="0.9">SCHOOL ZONE</text>

            {/* Hospital District */}
            <rect x="700" y="380" width="140" height="100" rx="6" fill="#ecfeff" opacity="0.8" stroke="#0891b2" strokeWidth="1" strokeDasharray="4 4" />
            <text x="770" y="435" textAnchor="middle" fill="#0891b2" fontSize="10" fontFamily="monospace" fontWeight="bold" opacity="0.9">HOSPITAL ZONE</text>

            {/* Central Market District */}
            <rect x="420" y="180" width="160" height="90" rx="8" fill="#fffbeb" opacity="0.8" stroke="#d97706" strokeWidth="1" strokeDasharray="2 2" />
            <text x="500" y="230" textAnchor="middle" fill="#d97706" fontSize="10" fontFamily="monospace" fontWeight="bold" opacity="0.8">CENTRAL COMMERCIAL</text>
          </g>

          {/* SATELLITE MODE OVERLAYS */}
          {activeTab === "satellite" && (
            <g className="transition-all duration-500">
              <rect width="1000" height="600" fill="#022c22" opacity="0.25" />
              {/* Draw topographic style green overlays */}
              <path d="M 0 0 C 150 150 200 400 0 600 Z" fill="#047857" opacity="0.15" />
              <path d="M 1000 100 C 800 200 900 500 1000 600 Z" fill="#047857" opacity="0.15" />
            </g>
          )}

          {/* HEATMAP LAYER */}
          {showHeatmap && (
            <g className="animate-pulse">
              {complaints
                .filter((c) => c.status !== "CLOSED" && c.status !== "COMPLETED")
                .map((comp) => {
                  const { x, y } = mapCoords(comp.latitude, comp.longitude);
                  return (
                    <g key={`heatmap-${comp.id}`}>
                      <circle cx={x} cy={y} r="60" fill="#ef4444" opacity="0.12" />
                      <circle cx={x} cy={y} r="30" fill="#ef4444" opacity="0.18" />
                    </g>
                  );
                })}
            </g>
          )}

          {/* PREDICTIVE INFRASTRUCTURE DAMAGE RISKS */}
          {showPredictions &&
            predictions.map((pred) => {
              const { x, y } = mapCoords(pred.latitude, pred.longitude);
              return (
                <g key={`pred-${pred.id}`} className="cursor-pointer">
                  {/* Outer Risk Boundary */}
                  <circle
                    cx={x}
                    cy={y}
                    r="40"
                    fill="none"
                    stroke={pred.riskLevel === "Critical" ? "#ec4899" : "#fbbf24"}
                    strokeWidth="1.5"
                    strokeDasharray="6 4"
                    className="animate-spin"
                    style={{ transformOrigin: `${x}px ${y}px`, animationDuration: "12s" }}
                  />
                  {/* Pulse Center */}
                  <circle
                    cx={x}
                    cy={y}
                    r="10"
                    fill={pred.riskLevel === "Critical" ? "#f43f5e" : "#fbbf24"}
                    opacity="0.3"
                    className="animate-ping"
                  />
                  <circle
                    cx={x}
                    cy={y}
                    r="6"
                    fill={pred.riskLevel === "Critical" ? "#ec4899" : "#f59e0b"}
                    onMouseEnter={(e) =>
                      setHoveredItem({
                        type: "prediction",
                        name: `Predictive Risk: ${pred.category}`,
                        details: `Risk Index: ${pred.riskScore}% - ${pred.suggestedAction}`,
                        x: x,
                        y: y,
                      })
                    }
                    onMouseLeave={() => setHoveredItem(null)}
                  />
                </g>
              );
            })}

          {/* LIVE COMPLAINTS MARKERS */}
          {complaints.map((comp) => {
            const { x, y } = mapCoords(comp.latitude, comp.longitude);
            const isSelected = selectedComplaintId === comp.id;
            const color = getStatusColor(comp.status);

            return (
              <g
                key={`complaint-pin-${comp.id}`}
                className="cursor-pointer group"
                onClick={() => onSelectComplaint && onSelectComplaint(comp)}
              >
                {/* Highlight Halo for Selected */}
                {isSelected && (
                  <circle cx={x} cy={y} r="25" fill="none" stroke="#22d3ee" strokeWidth="2" className="animate-ping" />
                )}

                {/* Status Ring */}
                <circle
                  cx={x}
                  cy={y}
                  r={isSelected ? "14" : "10"}
                  fill="#0f172a"
                  stroke={color}
                  strokeWidth="3.5"
                  className="transition-all duration-300 group-hover:scale-125"
                />

                {/* Inner Center Dot */}
                <circle cx={x} cy={y} r="4" fill={color} />

                {/* Category abbreviation initials */}
                <text
                  x={x}
                  y={y - (isSelected ? 20 : 15)}
                  textAnchor="middle"
                  fill="#ffffff"
                  fontSize="9"
                  fontWeight="bold"
                  fontFamily="monospace"
                  className="bg-slate-900 px-1 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity bg-slate-950/90 pointer-events-none"
                >
                  {comp.category.slice(0, 3).toUpperCase()}
                </text>

                {/* Hotspot Hover Target */}
                <circle
                  cx={x}
                  cy={y}
                  r="20"
                  fill="transparent"
                  onMouseEnter={() =>
                    setHoveredItem({
                      type: "complaint",
                      name: comp.title,
                      details: `Category: ${comp.category} | Status: ${comp.status.replace("_", " ")} | Severity: ${comp.severity}`,
                      x: x,
                      y: y,
                    })
                  }
                  onMouseLeave={() => setHoveredItem(null)}
                />
              </g>
            );
          })}

          {/* ACTIVE GPS CREWS / FIELD TRUCKS */}
          {crews.map((crew) => {
            const { x, y } = mapCoords(crew.latitude, crew.longitude);
            return (
              <g key={`crew-truck-${crew.id}`} className="cursor-pointer">
                {/* Pulse for dispatch status */}
                <circle
                  cx={x}
                  cy={y}
                  r="18"
                  fill="none"
                  stroke={crew.status === "BUSY" ? "#a78bfa" : "#34d399"}
                  strokeWidth="1.5"
                  strokeDasharray="4 2"
                  className="animate-pulse"
                />

                {/* Truck Marker (Shield shape representation) */}
                <polygon
                  points={`${x},${y - 8} ${x + 8},${y + 6} ${x - 8},${y + 6}`}
                  fill={crew.status === "BUSY" ? "#8b5cf6" : "#10b981"}
                  stroke="#ffffff"
                  strokeWidth="1"
                  className="transition-transform duration-1000"
                />

                {/* Interactive Area */}
                <circle
                  cx={x}
                  cy={y}
                  r="15"
                  fill="transparent"
                  onMouseEnter={() =>
                    setHoveredItem({
                      type: "crew",
                      name: crew.name,
                      details: `Expertise: ${crew.expertise.join(", ")} | Status: ${crew.status}`,
                      x: x,
                      y: y,
                    })
                  }
                  onMouseLeave={() => setHoveredItem(null)}
                />
              </g>
            );
          })}
        </svg>

        {/* Dynamic Tooltip */}
        {hoveredItem && (
          <div
            className="absolute z-30 p-3 bg-white/95 text-slate-800 rounded-lg shadow-md border border-slate-200 pointer-events-none transition-all duration-150 max-w-xs backdrop-blur-sm"
            style={{
              left: `${(hoveredItem.x / 1000) * 100}%`,
              top: `${(hoveredItem.y / 600) * 100 - 90}%`,
              transform: "translateX(-50%)",
            }}
          >
            <div className="flex items-center space-x-2 mb-1">
              {hoveredItem.type === "complaint" && <MapPin className="h-4 w-4 text-red-500" />}
              {hoveredItem.type === "crew" && <Navigation className="h-4 w-4 text-emerald-500" />}
              {hoveredItem.type === "prediction" && <AlertTriangle className="h-4 w-4 text-pink-500 animate-bounce" />}
              <h4 className="font-bold text-xs text-slate-900">{hoveredItem.name}</h4>
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed font-mono">{hoveredItem.details}</p>
          </div>
        )}

        {/* Legend Panel overlay */}
        <div className="absolute bottom-4 left-4 p-3 bg-white/90 rounded-lg border border-slate-200 text-slate-700 backdrop-blur-sm pointer-events-none text-xs font-mono max-w-xs shadow-md space-y-2">
          <div className="font-bold border-b border-slate-200 pb-1 uppercase tracking-wider text-slate-500 text-[10px]">
            MAP CAPABILITIES
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[10px]">
            <div className="flex items-center space-x-1.5">
              <span className="h-2 w-2 rounded-full bg-red-500" />
              <span>Critical/Reported</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="h-2 w-2 rounded-full bg-amber-500" />
              <span>Assigned/Review</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="h-2 w-2 rounded-full bg-violet-500" />
              <span>Repair Ongoing</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              <span>Audit Closed</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="h-1.5 w-1.5 rotate-45 bg-teal-400" />
              <span>Live Repair Crews</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="h-2.5 w-2.5 border border-dashed border-pink-400 rounded-full inline-block animate-spin" style={{ animationDuration: "12s" }} />
              <span>AI Predictions</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
