export type UserRole = 'entrepreneur' | 'investor';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl: string;
  bio: string;
  isOnline?: boolean;
  createdAt: string;
}

export interface Entrepreneur extends User {
  role: 'entrepreneur';
  startupName: string;
  pitchSummary: string;
  fundingNeeded: string;
  industry: string;
  location: string;
  foundedYear: number;
  teamSize: number;
}

export interface Investor extends User {
  role: 'investor';
  investmentInterests: string[];
  investmentStage: string[];
  portfolioCompanies: string[];
  totalInvestments: number;
  minimumInvestment: string;
  maximumInvestment: string;
}

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  timestamp: string;
  isRead: boolean;
}

export interface ChatConversation {
  id: string;
  participants: string[];
  lastMessage?: Message;
  updatedAt: string;
}

export interface CollaborationRequest {
  id: string;
  investorId: string;
  entrepreneurId: string;
  message: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
}

export interface Document {
  id: string;
  name: string;
  type: string;
  size: string;
  lastModified: string;
  shared: boolean;
  url: string;
  ownerId: string;
}

export interface AuthContextType {
  user: User | null;
  login: (email: string, password: string, role: UserRole) => Promise<void>;
  register: (name: string, email: string, password: string, role: UserRole) => Promise<void>;
  logout: () => void;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (token: string, newPassword: string) => Promise<void>;
  updateProfile: (userId: string, updates: Partial<User>) => Promise<void>;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface AvailabilitySlot {
  id: string;
  userId: string;
  start: string; // ISO string
  end: string;   // ISO string
  isBooked: boolean;
}

export interface MeetingRequest {
  id: string;
  slotId: string;
  requesterId: string;
  hostId: string;
  status: 'pending' | 'accepted' | 'declined';
  createdAt: string;
}
export interface CallSession {
  id: string;
  callerId: string;
  receiverId: string;
  status: 'idle' | 'ongoing' | 'ended';
  isVideoOn: boolean;
  isAudioOn: boolean;
  isScreenSharing: boolean;
  startedAt: string | null;
  endedAt: string | null;
}
export type DocumentStatus = 'draft' | 'in_review' | 'signed';

export interface ChamberDocument {
  id: string;
  name: string;
  fileType: string;       // e.g. 'application/pdf'
  size: string;            // human-readable, e.g. '1.2 MB'
  ownerId: string;
  status: DocumentStatus;
  dataUrl: string;         // base64 file content, used for preview
  signatureDataUrl: string | null; // base64 PNG of the signature, if signed
  uploadedAt: string;
  signedAt: string | null;
}