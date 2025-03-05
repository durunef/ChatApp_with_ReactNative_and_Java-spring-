import { API } from '../constants/api';

export const authenticatedFetch = async (
  endpoint: string,
  token: string | null,
  options: RequestInit = {}
) => {
  try {
    const response = await fetch(`${API.BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers,
      },
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Request failed');
    }
    return data;
  } catch (error) {
    console.error('Fetch error:', error);
    throw error;
  }
};
