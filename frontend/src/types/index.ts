export interface User {
  id: number;
  email: string;
  role: 'mentor' | 'mentee';
  profile: {
    name: string;
    bio: string;
    imageUrl: string;
    skills?: string[];
  };
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface SignupRequest {
  email: string;
  password: string;
  name: string;
  role: 'mentor' | 'mentee';
  bio?: string;
  skills?: string;
}

export interface LoginResponse {
  token: string;
}

export interface UpdateProfileRequest {
  id: number;
  name: string;
  role: 'mentor' | 'mentee';
  bio: string;
  image?: string; // Base64 encoded
  skills?: string[];
}

export interface MatchRequest {
  id: number;
  mentorId: number;
  menteeId: number;
  message: string;
  status: 'pending' | 'accepted' | 'rejected' | 'cancelled';
  createdAt?: string;
  updatedAt?: string;
  hasFeedback?: boolean; // 현재 사용자가 이 매치에 대해 피드백을 남겼는지 여부
}

export interface MatchRequestCreate {
  mentorId: number;
  message: string;
}

export interface MatchRequestOutgoing {
  id: number;
  mentorId: number;
  menteeId: number;
  status: 'pending' | 'accepted' | 'rejected' | 'cancelled';
  hasFeedback?: boolean; // 현재 사용자가 이 매치에 대해 피드백을 남겼는지 여부
}

export interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (data: SignupRequest) => Promise<void>;
  logout: () => void;
  updateProfile: (data: UpdateProfileRequest) => Promise<void>;
  loading: boolean;
}

export interface ErrorResponse {
  error: string;
  details?: string;
}

export interface MentorFilters {
  skill?: string;
  orderBy?: 'skill' | 'name';
}

export interface Feedback {
  id: number;
  matchRequestId: number;
  rating: number;
  comment?: string;
  createdAt: string;
  reviewer: {
    name: string;
    role: 'mentor' | 'mentee';
  };
}

export interface FeedbackCreate {
  matchRequestId: number;
  revieweeId: number;
  rating: number;
  comment?: string;
}
