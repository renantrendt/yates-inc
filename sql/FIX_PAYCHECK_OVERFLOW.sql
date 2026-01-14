-- =====================================================
-- FIX PAYCHECK OVERFLOW - Balance columns too small
-- Run this in Supabase SQL Editor
-- =====================================================
-- The balance columns are DECIMAL(10,2) which maxes out at ~$100M
-- With big salaries, balances overflow causing 400 errors

-- Increase balance precision to handle billions
ALTER TABLE employee_paychecks 
ALTER COLUMN yates_balance TYPE DECIMAL(20, 2);

ALTER TABLE employee_paychecks 
ALTER COLUMN walters_balance TYPE DECIMAL(20, 2);

-- Also increase salary_amount just in case (code caps at $1B)
ALTER TABLE employee_paychecks 
ALTER COLUMN salary_amount TYPE DECIMAL(20, 2);

-- Verify the changes
SELECT column_name, data_type, numeric_precision, numeric_scale
FROM information_schema.columns 
WHERE table_name = 'employee_paychecks'
AND column_name IN ('yates_balance', 'walters_balance', 'salary_amount');
