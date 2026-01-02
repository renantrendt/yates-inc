-- Employee Paychecks Table
-- Run this in your Supabase SQL Editor

CREATE TABLE IF NOT EXISTS employee_paychecks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id TEXT NOT NULL UNIQUE,
  yates_balance DECIMAL(10, 2) DEFAULT 0,
  walters_balance DECIMAL(10, 2) DEFAULT 0,
  salary_amount DECIMAL(10, 2) DEFAULT 0,
  salary_currency TEXT DEFAULT 'yates' CHECK (salary_currency IN ('yates', 'walters')),
  days_until_paycheck INTEGER DEFAULT 5,
  pay_interval INTEGER DEFAULT 5,
  last_paycheck_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE employee_paychecks ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated operations (adjust as needed)
CREATE POLICY "Allow all operations on employee_paychecks" ON employee_paychecks
  FOR ALL USING (true) WITH CHECK (true);

-- Insert default paycheck data for all employees
INSERT INTO employee_paychecks (employee_id, yates_balance, walters_balance, salary_amount, salary_currency, days_until_paycheck)
VALUES 
  ('674121', 0, 67, 67, 'walters', 10),      -- Harris: 10 days, 67 walters dollars
  ('392318', 500, 0, 500, 'yates', 2),       -- Bernardo: 2 days, 500 yates dollars
  ('007411', 0, 45, 45, 'walters', 20),      -- Dylan: 20 days, 45 walters dollars
  ('39187', 230, 0, 230, 'yates', 2),        -- Michael: 2 days, 230 yates dollars
  ('000001', 780, 0, 780, 'yates', 1)        -- Logan: 1 day, 780 yates dollars
ON CONFLICT (employee_id) DO UPDATE SET
  yates_balance = EXCLUDED.yates_balance,
  walters_balance = EXCLUDED.walters_balance,
  salary_amount = EXCLUDED.salary_amount,
  salary_currency = EXCLUDED.salary_currency,
  days_until_paycheck = EXCLUDED.days_until_paycheck;

