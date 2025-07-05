"use server"

import { createClient } from "@supabase/supabase-js"
import { redirect } from "next/navigation"
import { sql } from "@/lib/db"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

export async function signUp(formData: FormData) {
  const email = formData.get("email") as string
  const password = formData.get("password") as string
  const fullName = formData.get("fullName") as string

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
      },
    },
  })

  if (error) {
    return { error: error.message }
  }

  if (data.user) {
    // Create user profile in our database
    await sql`
      INSERT INTO user_profiles (id, email, full_name)
      VALUES (${data.user.id}, ${email}, ${fullName})
      ON CONFLICT (id) DO NOTHING
    `

    // Create default accounts for new user
    const checkingResult = await sql`
      INSERT INTO accounts (user_id, account_name, account_type, balance)
      VALUES (${data.user.id}, 'Main Checking', 'checking', 1000.00)
      RETURNING id
    `

    await sql`
      INSERT INTO accounts (user_id, account_name, account_type, balance)
      VALUES (${data.user.id}, 'Savings Account', 'savings', 5000.00)
    `

    // Add some sample transactions
    const accountId = checkingResult[0].id
    await sql`
      INSERT INTO transactions (account_id, description, amount, type, status, date)
      VALUES 
        (${accountId}, 'Welcome Bonus', 1000.00, 'Deposit', 'Approved', CURRENT_TIMESTAMP),
        (${accountId}, 'Account Setup Fee', -25.00, 'Fee', 'Approved', CURRENT_TIMESTAMP)
    `
  }

  redirect("/auth/login?message=Check your email to confirm your account")
}

export async function signIn(formData: FormData) {
  const email = formData.get("email") as string
  const password = formData.get("password") as string

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return { error: error.message }
  }

  redirect("/")
}

export async function signOut() {
  const { error } = await supabase.auth.signOut()

  if (error) {
    return { error: error.message }
  }

  redirect("/auth/login")
}
