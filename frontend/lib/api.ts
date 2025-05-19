interface RequestOptions extends RequestInit {
  token?: string;
  data?: any;
}

const API_URL = 'http://localhost:5000/api';

export async function fetchAPI(
  endpoint: string,
  { token, data, ...customConfig }: RequestOptions = {}
) {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const config: RequestInit = {
    method: data ? 'POST' : 'GET',
    ...customConfig,
    headers: {
      ...headers,
      ...customConfig.headers,
    },
  };

  if (data) {
    config.body = JSON.stringify(data);
  }

  try {
    const response = await fetch(`${API_URL}${endpoint}`, config);
    const responseData = await response.json();

    if (!response.ok) {
      throw new Error(responseData.message || 'An error occurred while fetching data');
    }

    return responseData;
  } catch (error) {
    console.error('API request error:', error);
    throw error;
  }
}

export function getUserFromLocalStorage() {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  } catch (error) {
    console.error('Error parsing user from localStorage:', error);
    return null;
  }
} 