/**
 * ECC EduManage Centralized API Client
 * 
 * Supports both Mock Mode (Frontend Prototype) and real PHP REST API mode.
 * Configuration via environment variables:
 * - VITE_USE_MOCK_DATA (default: true)
 * - VITE_API_BASE_URL (default: 'http://localhost/ECCProjec/backend/api')
 */
import axios from 'axios';

const USE_MOCK_DATA = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_USE_MOCK_DATA !== undefined) 
  ? import.meta.env.VITE_USE_MOCK_DATA !== 'false' 
  : true;
const getDefaultApiBaseUrl = () => {
  if (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }
  if (typeof window !== 'undefined' && window.location) {
    // In local development on Vite dev server, point to local PHP backend
    if (window.location.port === '5173' || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return 'http://localhost/ECCProjec/backend/api';
    }
    // In production (e.g. InfinityFree / custom domain), resolve relative to the current host
    const origin = window.location.origin;
    const pathname = window.location.pathname.startsWith('/ECCProjec') ? '/ECCProjec' : '';
    return `${origin}${pathname}/backend/api`;
  }
  return '/backend/api';
};

const API_BASE_URL = getDefaultApiBaseUrl();

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// Request Interceptor: attach JWT/Bearer token if available
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('ecc_auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Unified mock simulation helper with optional network jitter
export const mockDelay = (ms = 180) => new Promise((resolve) => setTimeout(resolve, ms));

export const apiClient = {
  isMock: USE_MOCK_DATA,

  /**
   * Generic request wrapper
   */
  async request({ endpoint, method = 'GET', data = null, mockFallback }) {
    if (USE_MOCK_DATA) {
      await mockDelay();
      if (typeof mockFallback === 'function') {
        return mockFallback();
      }
      return mockFallback;
    }

    try {
      const response = await axiosInstance({
        url: endpoint,
        method,
        data
      });
      return response.data;
    } catch (error) {
      console.warn(`[API Client Error] ${method} ${endpoint}:`, error.message);
      // Graceful fallback to mock if API connection is not reachable
      if (typeof mockFallback === 'function') {
        return mockFallback();
      }
      return mockFallback;
    }
  }
};

