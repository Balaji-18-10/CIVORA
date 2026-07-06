/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { ShieldCheck, User, Users, Navigation, Sparkles, AlertCircle } from "lucide-react";
import { User as UserType } from "./types";
import CitizenPortal from "./pages/CitizenPortal";
import AuthorityPortal from "./pages/AuthorityPortal";
import WorkerPortal from "./pages/WorkerPortal";

const MOCK_PROFILES = [
  {
    role: "CITIZEN",
    name: "Rajesh Kumar",
    email: "citizen@civora.gov.in",
    description: "Active Infrastructure Reporter • 420 Community XP",
    icon: User,
    color: "text-blue-600 bg-blue-50 border-blue-200",
    buttonBg: "bg-blue-600 hover:bg-blue-700 text-white shadow-sm",
  },
  {
    role: "MUNICIPAL_OFFICER",
    name: "Dr. Ananya Iyer",
    email: "officer@civora.gov.in",
    description: "Municipal Chief Commissioner • Zone Central Admin",
    icon: ShieldCheck,
    color: "text-indigo-600 bg-indigo-50 border-indigo-200",
    buttonBg: "bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm",
  },
  {
    role: "FIELD_WORKER",
    name: "Amit Sharma",
    email: "worker@civora.gov.in",
    description: "Lead Ground Taskforce • Roadways & Asphalt Specialist",
    icon: Navigation,
    color: "text-emerald-600 bg-emerald-50 border-emerald-200",
    buttonBg: "bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm",
  },
];

export default function App() {
  const [currentUser, setCurrentUser] = useState<UserType | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [authError, setAuthError] = useState("");

  // Restore session from localStorage if exists
  useEffect(() => {
    const cachedUser = localStorage.getItem("civora_session");
    if (cachedUser) {
      try {
        setCurrentUser(JSON.parse(cachedUser));
      } catch (err) {
        console.error("Failed to parse cached session parameters", err);
      }
    }
  }, []);

  // Perform mock login sequence
  const handleLogin = async (profile: typeof MOCK_PROFILES[0]) => {
    setIsAuthenticating(true);
    setAuthError("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: profile.email, role: profile.role }),
      });
      const data = await res.json();
      if (data.success && data.user) {
        setCurrentUser(data.user);
        localStorage.setItem("civora_session", JSON.stringify(data.user));
      } else {
        setAuthError(data.error || "Authentication failed. Try again.");
      }
    } catch (err) {
      console.error("Server API link error:", err);
      setAuthError("Could not connect to the CIVORA core engine. Make sure the server is booted.");
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem("civora_session");
  };

  const handleUpdateUser = (updatedUser: UserType) => {
    setCurrentUser(updatedUser);
    localStorage.setItem("civora_session", JSON.stringify(updatedUser));
  };

  // If authenticated, route to respective dashboard view
  if (currentUser) {
    if (currentUser.role === "CITIZEN") {
      return (
        <CitizenPortal
          currentUser={currentUser}
          onLogout={handleLogout}
          onUpdateUser={handleUpdateUser}
        />
      );
    } else if (currentUser.role === "AUTHORITY" || currentUser.role as string === "MUNICIPAL_OFFICER") {
      return <AuthorityPortal onLogout={handleLogout} />;
    } else if (currentUser.role === "WORKER" || currentUser.role as string === "FIELD_WORKER") {
      return <WorkerPortal onLogout={handleLogout} />;
    }
  }

  // Render Role Authentication login screen
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 relative overflow-hidden" id="login-screen">
      {/* Background radial lines design patterns */}
      <div className="absolute inset-0 bg-[radial-gradient(#e2e8f0_1.5px,transparent_1.5px)] [background-size:24px_24px] opacity-70 pointer-events-none" />

      <div className="max-w-md w-full space-y-6 z-10">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex bg-blue-600 h-14 w-14 rounded-2xl items-center justify-center font-black text-white text-2xl shadow-md border border-blue-500/10">
            CIV
          </div>
          <h1 className="text-3xl font-black font-sans tracking-tight text-slate-900">
            CIVORA
          </h1>
          <p className="text-xs text-slate-500 font-mono uppercase tracking-widest font-semibold">
            AI Powered Civic Infrastructure Platform
          </p>
        </div>

        {/* Profiles Select Grid */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-lg space-y-5">
          <div className="border-b border-slate-100 pb-3 text-center">
            <h2 className="font-extrabold text-sm text-slate-850 uppercase font-mono tracking-wider">
              Identity Portal Gateways
            </h2>
            <p className="text-[11px] text-slate-500">Select an official identity role profile to bypass login credentials</p>
          </div>

          {authError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center space-x-2 text-red-700 text-xs font-mono">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{authError}</span>
            </div>
          )}

          <div className="space-y-3">
            {MOCK_PROFILES.map((profile) => {
              const Icon = profile.icon;
              return (
                <div
                  key={profile.role}
                  className="bg-slate-50/50 border border-slate-200/80 p-4 rounded-xl flex items-center justify-between gap-4 hover:bg-slate-50 hover:border-slate-300 transition-all"
                >
                  <div className="flex items-center space-x-3.5">
                    <div className={`h-11 w-11 rounded-lg flex items-center justify-center border shrink-0 ${profile.color}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="space-y-0.5">
                      <h3 className="font-bold text-xs text-slate-900">{profile.name}</h3>
                      <p className="text-[10px] text-slate-500 leading-snug">{profile.description}</p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleLogin(profile)}
                    disabled={isAuthenticating}
                    className={`px-4 py-2 rounded-lg text-xs font-mono font-bold uppercase transition-all tracking-wide shrink-0 ${profile.buttonBg}`}
                  >
                    {isAuthenticating ? "..." : "GATE"}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Security parameters */}
        <div className="text-center space-y-1">
          <span className="text-[9px] font-mono text-slate-400 uppercase tracking-widest block font-bold">
            CIVIC CORP AUTOMATED AUTHENTICATOR
          </span>
          <p className="text-[10px] text-slate-500 font-medium">Secure end-to-end telemetry sync with municipal databases.</p>
        </div>
      </div>
    </div>
  );
}
