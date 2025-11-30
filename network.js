const API_PORT = process.env.REACT_APP_API_PORT || '5000';

const API_BASE_URL =
  process.env.REACT_APP_API_URL ||
  `${window.location.protocol}//${window.location.hostname}:${API_PORT}`;

export const getApiBaseUrl = () => API_BASE_URL;

export const buildMediaUrl = (path) => {
  if (!path) return '';
  if (/^(https?:|data:|blob:)/i.test(path)) {
    return path;
  }
  return `${API_BASE_URL}${path}`;
};

export default API_BASE_URL;


