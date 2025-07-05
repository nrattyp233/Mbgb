-- Seed a user
INSERT INTO users (name, email, password_hash)
VALUES ('John Doe', 'john.doe@example.com', 'not-a-real-hash')
ON CONFLICT (email) DO NOTHING;

-- Seed accounts for the user
DO $$
DECLARE
  user_id_val INT;
BEGIN
  SELECT id INTO user_id_val FROM users WHERE email = 'john.doe@example.com';
  
  IF user_id_val IS NOT NULL THEN
    -- Seed a checking account
    INSERT INTO accounts (user_id, account_name, account_type, balance)
    VALUES (user_id_val, 'Main Checking', 'checking', 45231.89);

    -- Seed a savings account
    INSERT INTO accounts (user_id, account_name, account_type, balance)
    VALUES (user_id_val, 'High-Yield Savings', 'savings', 10500.00);
  END IF;
END $$;

-- Seed transactions
DO $$
DECLARE
  checking_account_id INT;
BEGIN
  SELECT id INTO checking_account_id FROM accounts WHERE account_name = 'Main Checking';

  IF checking_account_id IS NOT NULL THEN
    INSERT INTO transactions (account_id, description, amount, type, status, date)
    VALUES
      (checking_account_id, 'Spotify Subscription', -9.99, 'Subscription', 'Approved', '2023-06-25'),
      (checking_account_id, 'Freelance Payment', 350.00, 'Deposit', 'Approved', '2023-06-25'),
      (checking_account_id, 'Grocery Store', -150.75, 'Sale', 'Approved', '2023-06-24'),
      (checking_account_id, 'ATM Withdrawal', -100.00, 'Withdrawal', 'Approved', '2023-06-23'),
      (checking_account_id, 'Online Shopping', -250.00, 'Sale', 'Approved', '2023-06-23');
  END IF;
END $$;
