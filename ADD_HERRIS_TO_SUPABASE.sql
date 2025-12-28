-- Update Herris's password in Supabase
-- Run this SQL in your Supabase SQL Editor

UPDATE employees 
SET password = 'TUFboss'
WHERE id = '674121';

-- Verify the update
SELECT * FROM employees WHERE id = '674121';

