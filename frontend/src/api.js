import { supabase } from './lib/supabase';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

async function request(path, options = {}) {
  const { data: { session } } = await supabase.auth.getSession();

  if (!session?.access_token) {
    throw new Error('Authentication required.');
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`,
      ...(options.headers || {}),
    },
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || `Request failed (${response.status})`);
  }

  return data;
}

export async function requestAuthorization(accessToken) {
  const response = await fetch(`${API_URL}/api/auth/me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || 'Access denied.');
  return data;
}

export async function getNotepads() {
  const data = await request('/api/notepads');
  return data.notepads || [];
}

export async function getTrash() {
  const data = await request('/api/notepads/trash');
  return data.notepads || [];
}

export async function createNotepad() {
  const data = await request('/api/notepads', {
    method: 'POST',
    body: JSON.stringify({}),
  });
  return data.notepad;
}

export async function updateNotepad(id, patch) {
  const data = await request(`/api/notepads/${id}`, {
    method: 'PUT',
    body: JSON.stringify(patch),
  });
  return data.notepad;
}

export async function deleteNotepad(id) {
  const data = await request(`/api/notepads/${id}`, {
    method: 'DELETE',
  });
  return data.notepad;
}

export async function restoreNotepad(id) {
  const data = await request(`/api/notepads/${id}/restore`, {
    method: 'PATCH',
  });
  return data.notepad;
}

export async function getSuperadmins() {
  const data = await request('/api/superadmins');
  return data.superadmins || [];
}

export async function addSuperadmin(email) {
  const data = await request('/api/superadmins', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
  return data.superadmin;
}

export async function removeSuperadmin(id) {
  const data = await request(`/api/superadmins/${id}`, {
    method: 'DELETE',
  });
  return data.superadmin;
}
