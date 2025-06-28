import axios from 'axios';
import type { AxiosResponse } from 'axios';
import type {
  User,
  LoginRequest,
  SignupRequest,
  LoginResponse,
  UpdateProfileRequest,
  MatchRequest,
  MatchRequestCreate,
  MatchRequestOutgoing,
  MentorFilters,
  Feedback,
  FeedbackCreate
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8088/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  login: async (data: LoginRequest): Promise<LoginResponse> => {
    const response: AxiosResponse<LoginResponse> = await api.post('/login', data);
    return response.data;
  },

  signup: async (data: SignupRequest): Promise<void> => {
    await api.post('/signup', data);
  },

  getCurrentUser: async (): Promise<User> => {
    const response: AxiosResponse<User> = await api.get('/me');
    return response.data;
  },

  updateProfile: async (data: UpdateProfileRequest): Promise<User> => {
    const response: AxiosResponse<User> = await api.put('/profile', data);
    return response.data;
  },
};

export const mentorApi = {
  getMentors: async (filters?: MentorFilters): Promise<User[]> => {
    const params = new URLSearchParams();
    if (filters?.skill) {
      params.append('skill', filters.skill);
    }
    if (filters?.orderBy) {
      params.append('orderBy', filters.orderBy);
    }

    const response: AxiosResponse<User[]> = await api.get(`/mentors?${params.toString()}`);
    return response.data;
  },
};

export const matchRequestApi = {
  create: async (data: MatchRequestCreate): Promise<MatchRequest> => {
    const response: AxiosResponse<MatchRequest> = await api.post('/match-requests', data);
    return response.data;
  },

  getIncoming: async (): Promise<MatchRequest[]> => {
    const response: AxiosResponse<MatchRequest[]> = await api.get('/match-requests/incoming');
    return response.data;
  },

  getOutgoing: async (): Promise<MatchRequestOutgoing[]> => {
    const response: AxiosResponse<MatchRequestOutgoing[]> = await api.get('/match-requests/outgoing');
    return response.data;
  },

  accept: async (id: number): Promise<MatchRequest> => {
    const response: AxiosResponse<MatchRequest> = await api.put(`/match-requests/${id}/accept`);
    return response.data;
  },

  reject: async (id: number): Promise<MatchRequest> => {
    const response: AxiosResponse<MatchRequest> = await api.put(`/match-requests/${id}/reject`);
    return response.data;
  },

  cancel: async (id: number): Promise<MatchRequest> => {
    const response: AxiosResponse<MatchRequest> = await api.delete(`/match-requests/${id}`);
    return response.data;
  },

  getHistoryWithMentor: async (mentorId: number): Promise<MatchRequest[]> => {
    const response: AxiosResponse<MatchRequest[]> = await api.get(`/match-requests/mentor/${mentorId}`);
    return response.data;
  },
};

export const feedbackApi = {
  create: async (data: FeedbackCreate): Promise<void> => {
    await api.post('/feedback', data);
  },

  getReceived: async (): Promise<Feedback[]> => {
    const response: AxiosResponse<Feedback[]> = await api.get('/feedback/received');
    return response.data;
  },
};

export default api;
