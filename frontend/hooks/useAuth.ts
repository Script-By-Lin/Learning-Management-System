'use client';

import { useAuthContext } from '../components/AuthProvider';

/**
 * Custom hook for accessing authentication state and handlers
 */
export function useAuth() {
  return useAuthContext();
}

export default useAuth;
