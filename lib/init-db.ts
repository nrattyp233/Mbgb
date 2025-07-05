import { sql } from "@/lib/db"

/**
 * Database initialization that works with Supabase Auth.
 * Users are managed by Supabase, we just need accounts and transactions.
 */
let initialized = false

export async function initDb() {
  if (initialized) return
  initialized = true

  try {
    // Drop existing tables if they exist (in reverse dependency order)
    await sql`DROP TABLE IF EXISTS transactions CASCADE`
    await sql`DROP TABLE IF EXISTS accounts CASCADE`
    await sql`DROP TABLE IF EXISTS user_profiles CASCADE`

    // Create user_profiles table (extends Supabase auth.users)
    await sql`
      CREATE TABLE user_profiles (
        id UUID PRIMARY KEY,
        email VARCHAR(255) NOT NULL,
        full_name VARCHAR(255),
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      )
    `

    // Create accounts table
    await sql`
      CREATE TABLE accounts (
        id SERIAL PRIMARY KEY,
        user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
        account_name VARCHAR(255) NOT NULL,
        account_type VARCHAR(50) NOT NULL,
        balance NUMERIC(15,2) DEFAULT 0.00,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      )
    `

    // Create transactions table
    await sql`
      CREATE TABLE transactions (
        id SERIAL PRIMARY KEY,
        account_id INTEGER NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
        description VARCHAR(255) NOT NULL,
        amount NUMERIC(15,2) NOT NULL,
        type VARCHAR(50) NOT NULL,
        status VARCHAR(50) NOT NULL,
        date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      )
    `
  } catch (error) {
    console.error("Database initialization failed:", error)
    throw error
  }
}
