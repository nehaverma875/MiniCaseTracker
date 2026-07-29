const trimTrailingSlash = (value) => value.replace(/\/+$/, '');

const isLocalHost = ['localhost', '127.0.0.1'].includes(window.location.hostname);
const localApiOrigin = `${window.location.protocol}//${window.location.hostname}:3500`;
const apiOrigin = trimTrailingSlash(import.meta.env.VITE_API_ORIGIN || (isLocalHost ? localApiOrigin : window.location.origin));

export const API_URL = `${apiOrigin}/api`;
export const UPLOAD_BASE_URL = apiOrigin;
