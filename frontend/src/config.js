// src/config.ts
export const API_URL = import.meta.env.VITE_API_URL;

export const FRONTEND_URL = import.meta.env.VITE_FRONTEND_URL;

export const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

export const GOOGLE_REDIRECT_URI = import.meta.env.VITE_GOOGLE_REDIRECT_URI || `${API_URL}/auth/google/callback`
