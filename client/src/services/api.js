import axios from 'axios';

// Create a configured axios instance.
// Since vite.config.js proxies /api → http://localhost:4000,
// we only need the base path here — no hardcoded backend URL.
const api = axios.create({
  baseURL: '/api',
  withCredentials: true, // Send cookies with every request (needed for JWT)
});

// Response interceptor — if we get a 401, it means the session expired.
// The AuthContext will handle the redirect to login.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // You can add global error handling here (e.g., redirect on 401)
    return Promise.reject(error);
  }
);

export default api;
