import React, { createContext, useContext, useEffect, useState } from 'react';

export interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL?: string | null;
}

interface AuthContextType {
  user: User | null;
  householdId: string | null;
  isLoading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [householdId, setHouseholdId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check local storage for existing session
    const storedUser = localStorage.getItem('local_user');
    const storedHousehold = localStorage.getItem('local_household');
    
    if (storedUser) {
      setUser(JSON.parse(storedUser));
      if (storedHousehold) {
        setHouseholdId(storedHousehold);
      } else {
        const newHouseholdId = `household_${Date.now()}`;
        setHouseholdId(newHouseholdId);
        localStorage.setItem('local_household', newHouseholdId);
      }
    }
    
    setIsLoading(false);
  }, []);

  const signInWithGoogle = async () => {
    // Simulate login
    const mockUser: User = {
      uid: `local_user_${Date.now()}`,
      email: 'user@example.com',
      displayName: 'Local User'
    };
    const mockHousehold = `household_${Date.now()}`;
    
    localStorage.setItem('local_user', JSON.stringify(mockUser));
    localStorage.setItem('local_household', mockHousehold);
    
    setUser(mockUser);
    setHouseholdId(mockHousehold);
  };

  const signOut = async () => {
    localStorage.removeItem('local_user');
    localStorage.removeItem('local_household');
    setUser(null);
    setHouseholdId(null);
  };

  return (
    <AuthContext.Provider value={{ user, householdId, isLoading, signInWithGoogle, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
