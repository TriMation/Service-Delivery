import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import type { AuthUser } from '../../types/auth';

interface AuthContextType {
  user: AuthUser | null;
  setUser: (user: AuthUser | null) => void;
}

// 1. Create the AuthContext
const AuthContext = createContext<AuthContextType>({
  user: null,
  setUser: () => {},
});

// 2. Export the provider
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);

  return (
    <AuthContext.Provider value={{ user, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

// 3. Export a custom hook that gives the context consumer
export function useAuth() {
  return useContext(AuthContext);
}