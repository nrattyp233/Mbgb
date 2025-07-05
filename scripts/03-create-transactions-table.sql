CREATE TABLE IF NOT EXISTS transactions (
  id SERIAL PRIMARY KEY,
  account_id INTEGER REFERENCES accounts(id) ON DELETE CASCADE,
  description VARCHAR(255) NOT NULL,
  amount NUMERIC(15, 2) NOT NULL,
  type VARCHAR(50) NOT NULL, -- e.g., 'deposit', 'withdrawal', 'transfer'
  status VARCHAR(50) NOT NULL, -- e.g., 'approved', 'pending', 'declined'
  date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
