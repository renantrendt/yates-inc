'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { EmployeePaycheck, PaycheckContextType } from '@/types';
import { useAuth } from './AuthContext';
import { supabase } from '@/lib/supabase';

const PaycheckContext = createContext<PaycheckContextType | undefined>(undefined);

export function PaycheckProvider({ children }: { children: React.ReactNode }) {
  const [paychecks, setPaychecks] = useState<EmployeePaycheck[]>([]);
  const [loading, setLoading] = useState(true);
  const { employee } = useAuth();

  // Fetch all paychecks from Supabase
  const fetchPaychecks = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('employee_paychecks')
        .select('*');

      if (error) {
        console.error('Error fetching paychecks:', error);
        return;
      }

      if (data) {
        setPaychecks(data as EmployeePaycheck[]);
      }
    } catch (err) {
      console.error('Error fetching paychecks:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Get current user's paycheck
  const currentUserPaycheck = employee
    ? paychecks.find((p) => p.employee_id === employee.id) || null
    : null;

  // Update salary for an employee (CEO only)
  const updateSalary = async (
    employeeId: string,
    amount: number,
    currency: 'yates' | 'walters'
  ) => {
    try {
      const { error } = await supabase
        .from('employee_paychecks')
        .update({
          salary_amount: amount,
          salary_currency: currency,
          updated_at: new Date().toISOString(),
        })
        .eq('employee_id', employeeId);

      if (error) {
        console.error('Error updating salary:', error);
        return;
      }

      // Refresh paychecks
      await fetchPaychecks();
    } catch (err) {
      console.error('Error updating salary:', err);
    }
  };

  // Process paycheck - add salary to balance
  const processPaycheck = async (employeeId: string) => {
    const paycheck = paychecks.find((p) => p.employee_id === employeeId);
    if (!paycheck) return;

    const newBalance =
      paycheck.salary_currency === 'yates'
        ? { yates_balance: paycheck.yates_balance + paycheck.salary_amount }
        : { walters_balance: paycheck.walters_balance + paycheck.salary_amount };

    try {
      const { error } = await supabase
        .from('employee_paychecks')
        .update({
          ...newBalance,
          days_until_paycheck: paycheck.pay_interval,
          last_paycheck_date: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('employee_id', employeeId);

      if (error) {
        console.error('Error processing paycheck:', error);
        return;
      }

      await fetchPaychecks();
    } catch (err) {
      console.error('Error processing paycheck:', err);
    }
  };

  // Check and process automatic paychecks
  const checkAndProcessPaychecks = useCallback(async () => {
    for (const paycheck of paychecks) {
      if (paycheck.days_until_paycheck <= 0 && paycheck.salary_amount > 0) {
        // Time to pay!
        const newBalance =
          paycheck.salary_currency === 'yates'
            ? { yates_balance: paycheck.yates_balance + paycheck.salary_amount }
            : { walters_balance: paycheck.walters_balance + paycheck.salary_amount };

        try {
          await supabase
            .from('employee_paychecks')
            .update({
              ...newBalance,
              days_until_paycheck: paycheck.pay_interval,
              last_paycheck_date: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq('employee_id', paycheck.employee_id);
        } catch (err) {
          console.error('Error auto-processing paycheck:', err);
        }
      }
    }
    // Refresh after processing
    await fetchPaychecks();
  }, [paychecks, fetchPaychecks]);

  // Decrement days (call this once per day in real app, but we'll simulate)
  const decrementDays = useCallback(async () => {
    // Check last decrement time from localStorage
    const lastDecrement = localStorage.getItem('yates-last-paycheck-decrement');
    const now = new Date();
    const today = now.toDateString();

    if (lastDecrement === today) {
      // Already decremented today
      return;
    }

    // Decrement all days_until_paycheck by 1
    for (const paycheck of paychecks) {
      if (paycheck.days_until_paycheck > 0) {
        try {
          await supabase
            .from('employee_paychecks')
            .update({
              days_until_paycheck: paycheck.days_until_paycheck - 1,
              updated_at: new Date().toISOString(),
            })
            .eq('employee_id', paycheck.employee_id);
        } catch (err) {
          console.error('Error decrementing days:', err);
        }
      }
    }

    localStorage.setItem('yates-last-paycheck-decrement', today);
    await fetchPaychecks();
  }, [paychecks, fetchPaychecks]);

  // Initial fetch
  useEffect(() => {
    fetchPaychecks();
  }, [fetchPaychecks]);

  // Check for auto-paychecks when paychecks change
  useEffect(() => {
    if (paychecks.length > 0) {
      // Check if any paychecks need processing
      const needsProcessing = paychecks.some(
        (p) => p.days_until_paycheck <= 0 && p.salary_amount > 0
      );
      if (needsProcessing) {
        checkAndProcessPaychecks();
      }
    }
  }, [paychecks, checkAndProcessPaychecks]);

  // Decrement days on app load (once per real day)
  useEffect(() => {
    if (paychecks.length > 0) {
      decrementDays();
    }
  }, [paychecks.length, decrementDays]);

  // Subscribe to realtime updates
  useEffect(() => {
    const channel = supabase
      .channel('paycheck-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'employee_paychecks' },
        () => {
          fetchPaychecks();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchPaychecks]);

  return (
    <PaycheckContext.Provider
      value={{
        paychecks,
        currentUserPaycheck,
        loading,
        fetchPaychecks,
        updateSalary,
        processPaycheck,
      }}
    >
      {children}
    </PaycheckContext.Provider>
  );
}

export function usePaycheck() {
  const context = useContext(PaycheckContext);
  if (context === undefined) {
    throw new Error('usePaycheck must be used within a PaycheckProvider');
  }
  return context;
}

