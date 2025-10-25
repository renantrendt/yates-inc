'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Employee, AuthContextType } from '@/types';
import { supabase } from '@/lib/supabase';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [employee, setEmployee] = useState<Employee | null>(null);

  // Load employee from localStorage on mount
  useEffect(() => {
    const savedEmployee = localStorage.getItem('yates-employee');
    if (savedEmployee) {
      setEmployee(JSON.parse(savedEmployee));
    }
  }, []);

  const login = async (id: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      // Query Supabase for employee with matching ID
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .eq('id', id)
        .single();

      if (error || !data) {
        return { success: false, error: 'id' };
      }

      // Check password
      if (data.password !== password) {
        return { success: false, error: 'password' };
      }

      // Success! Store employee
      const employeeData: Employee = {
        id: data.id,
        name: data.name,
        password: data.password,
        role: data.role,
        bio: data.bio,
      };

      setEmployee(employeeData);
      localStorage.setItem('yates-employee', JSON.stringify(employeeData));

      return { success: true };
    } catch (err) {
      console.error('Login error:', err);
      return { success: false, error: 'id' };
    }
  };

  const logout = () => {
    setEmployee(null);
    localStorage.removeItem('yates-employee');
  };

  const isLoggedIn = employee !== null;

  return (
    <AuthContext.Provider
      value={{
        employee,
        login,
        logout,
        isLoggedIn,
      }}
    >
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

