// Client-side session management helper
import { useAuthStore } from './store';

// Get authorization header from stored session
export function getAuthHeader(): string | null {
  if (typeof window === 'undefined') return null;
  
  const authState = localStorage.getItem('retailflow-auth');
  if (!authState) return null;
  
  try {
    const { user, store, isAuthenticated } = JSON.parse(authState).state;
    if (!isAuthenticated || !user || !store) return null;
    
    const sessionData = {
      userId: user.id,
      storeId: store.id,
      role: user.role,
      email: user.email,
      name: user.name,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    };
    
    return `Bearer ${btoa(JSON.stringify(sessionData))}`;
  } catch {
    return null;
  }
}

// Authenticated fetch wrapper
export async function authFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const authHeader = getAuthHeader();
  
  return fetch(url, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(authHeader ? { 'Authorization': authHeader } : {}),
      ...options.headers,
    },
  });
}
