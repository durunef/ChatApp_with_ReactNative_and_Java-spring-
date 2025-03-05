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
        Authorization: token ? `Bearer ${token}` : '',
        ...options.headers,
      },
    });

    const data = await response.json();

    // Handle 400 status specially for friend requests
    if (response.status === 400 && data.error === 'Friend request already sent') {
      return { error: 'Friend request already sent', isExpectedError: true };
    }

    if (!response.ok) {
      throw new Error(data.error || `HTTP error! status: ${response.status}`);
    }

    return data;
  } catch (error) {
    if (error instanceof Error && 'isExpectedError' in error) {
      return error;
    }
    throw error;
  }
}; 