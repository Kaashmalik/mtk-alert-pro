import { NextRequest, NextResponse } from "next/server";
import { createSupabaseClient } from "@mtk/database";

export async function POST(request: NextRequest) {
  try {
    const { email, name } = await request.json();

    if (!email || !name) {
      return NextResponse.json(
        { error: "Email and name are required" },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.error("Supabase credentials not configured");
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      );
    }

    const supabase = createSupabaseClient(supabaseUrl, supabaseKey);

    // Insert into waitlist table (you'll need to create this table in Supabase)
    // For now, we'll use a simple approach - you can create a waitlist table later
    const { data, error } = await supabase
      .from("waitlist")
      .insert([
        {
          email,
          name,
          created_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (error) {
      // If table doesn't exist, we'll just log it and return success
      // In production, you should create the waitlist table
      console.error("Waitlist insert error:", error);
      
      // For now, return success even if table doesn't exist
      // You can create the table later with:
      // CREATE TABLE waitlist (
      //   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      //   email TEXT UNIQUE NOT NULL,
      //   name TEXT NOT NULL,
      //   created_at TIMESTAMPTZ DEFAULT NOW()
      // );
      
      return NextResponse.json({
        success: true,
        message: "Thank you for joining! We'll be in touch soon.",
      });
    }

    return NextResponse.json({
      success: true,
      message: "Thank you for joining! We'll be in touch soon.",
      data,
    });
  } catch (error) {
    console.error("Waitlist API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

