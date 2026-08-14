const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export async function fetchApi<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE}/api/v1${endpoint}`;
  
  const headers = new Headers(options.headers || {});
  if (!headers.has('Content-Type') && options.method !== 'GET') {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: 'omit', // We actually need 'include' to send cookies
  });

  return handleResponse<T>(response);
}

export async function fetchApiWithCredentials<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE}/api/v1${endpoint}`;
  
  const headers = new Headers(options.headers || {});
  if (!headers.has('Content-Type') && options.method !== 'GET') {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: 'include', // Send cookies
  });

  return handleResponse<T>(response);
}

async function handleResponse<T>(response: Response): Promise<T> {
  let data;
  try {
    data = await response.json();
  } catch (err) {
    if (!response.ok) {
      throw new Error(response.statusText);
    }
    return {} as T; // 204 No Content
  }

  if (!response.ok) {
    throw new Error(data.error?.message || response.statusText);
  }

  return data;
}
