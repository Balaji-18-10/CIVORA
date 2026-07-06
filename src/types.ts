/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export enum Role {
  CITIZEN = "CITIZEN",
  ADMIN = "ADMIN",
  MUNICIPAL_OFFICER = "MUNICIPAL_OFFICER",
  ENGINEER = "ENGINEER",
  SUPERVISOR = "SUPERVISOR",
  FIELD_WORKER = "FIELD_WORKER"
}

export enum ComplaintStatus {
  REPORTED = "REPORTED",
  AI_VERIFIED = "AI_VERIFIED",
  OFFICER_REVIEW = "OFFICER_REVIEW",
  ACCEPTED = "ACCEPTED",
  CREW_ASSIGNED = "CREW_ASSIGNED",
  CREW_ON_ROUTE = "CREW_ON_ROUTE",
  REPAIR_STARTED = "REPAIR_STARTED",
  REPAIR_IN_PROGRESS = "REPAIR_IN_PROGRESS",
  QUALITY_INSPECTION = "QUALITY_INSPECTION",
  COMPLETED = "COMPLETED",
  CLOSED = "CLOSED"
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  trustScore: number; // 0 to 100
  points: number;
  badges: string[];
  createdAt: string;
}

export interface Complaint {
  id: string;
  citizenId: string;
  citizenName: string;
  title: string;
  description: string;
  category: string; // 'Pothole' | 'Garbage' | 'Streetlight' | 'Drainage' | 'Road Crack' | 'Water Leakage' | 'Tree Fallen' | 'Sewage' | 'Road Damage'
  imageUrl: string; // base64 or relative / placeholder URL
  voiceUrl?: string;
  audioText?: string;
  latitude: number;
  longitude: number;
  locationName: string;
  status: ComplaintStatus;
  priorityScore: number; // 1-100
  riskScore: number; // 1-100
  severity: "Low" | "Medium" | "High" | "Critical";
  estimatedCost: number; // In INR
  estimatedHours: number; // Time to resolve
  createdAt: string;
  updatedAt: string;
  assignedCrewId: string | null;
  assignedCrewName: string | null;
  assignedOfficerId: string | null;
  assignedOfficerName: string | null;
  beforeImageUrl: string | null;
  duringImageUrl: string | null;
  afterImageUrl: string | null;
  aiVerificationResult: string | null; // AI report comparison
  aiVerified: boolean | null;
  upvotes: number;
  supportedBy: string[]; // List of citizen ids
  feedbackRating: number | null; // 1-5
  feedbackComment: string | null;
  history: ComplaintHistoryLog[];
}

export interface ComplaintHistoryLog {
  status: ComplaintStatus;
  updatedAt: string;
  updatedBy: string;
  comment: string;
}

export interface Crew {
  id: string;
  name: string;
  membersCount: number;
  expertise: string[]; // ['Potholes', 'Road Damage', 'Electrical', 'Sanitation']
  vehicle: string; // 'Light Utility Truck' | 'Heavy Repair Truck' | 'Sanitation Van' | 'Electrical Maintenance Crane'
  status: "AVAILABLE" | "BUSY" | "OFF_DUTY";
  latitude: number;
  longitude: number;
  currentJobId: string | null;
}

export interface PredictionPoint {
  id: string;
  category: string;
  latitude: number;
  longitude: number;
  riskScore: number;
  riskLevel: "Low" | "Medium" | "High" | "Critical";
  predictedDate: string;
  factors: string[];
  suggestedAction: string;
}

export interface WeatherAlert {
  rainfall: number; // mm
  temp: number; // C
  floodAlert: boolean;
  heatIndex: "Normal" | "High" | "Extreme";
  roadDamageRisk: "Low" | "Moderate" | "Severe";
}

export interface LeaderboardUser {
  id: string;
  name: string;
  points: number;
  trustScore: number;
  complaintsResolved: number;
  rank: number;
}
