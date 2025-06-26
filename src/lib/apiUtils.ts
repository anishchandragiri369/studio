// Utility for environment-aware API calls
import { getBuildMode } from './buildMode';

export const createApiUrl = (endpoint: string): string => {
  const { apiBaseUrl } = getBuildMode();
  
  // Ensure endpoint starts with /
  const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  
  // If we have a base URL, use it; otherwise use relative paths for server builds
  if (apiBaseUrl) {
    return `${apiBaseUrl}${normalizedEndpoint}`;
  }
  
  return normalizedEndpoint;
};

export const apiCall = async (endpoint: string, options?: RequestInit) => {
  const url = createApiUrl(endpoint);
  
  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      ...options,
    });

    if (!response.ok) {
      throw new Error(`API call failed: ${response.status} ${response.statusText}`);
    }

    return response;
  } catch (error) {
    console.error(`API call to ${url} failed:`, error);
    throw error;
  }
};

export const apiGet = async (endpoint: string) => {
  const response = await apiCall(endpoint, { method: 'GET' });
  return response.json();
};

export const apiPost = async (endpoint: string, data?: any) => {
  const response = await apiCall(endpoint, {
    method: 'POST',
    body: data ? JSON.stringify(data) : undefined,
  });
  return response.json();
};

export const apiPut = async (endpoint: string, data?: any) => {
  const response = await apiCall(endpoint, {
    method: 'PUT',
    body: data ? JSON.stringify(data) : undefined,
  });
  return response.json();
};

export const apiDelete = async (endpoint: string) => {
  const response = await apiCall(endpoint, { method: 'DELETE' });
  return response.json();
};
