import { API } from '../constants/api';

export const authenticatedFetch = async (endpoint: string, token: string) => {
  const response = await fetch(`${API.BASE_URL}${endpoint}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  
  if (!response.ok) {
    throw new Error('Network response was not ok');
  }
  
  return response.json();
}; 