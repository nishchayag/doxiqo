import { NextResponse, NextRequest } from "next/server";
import connectDB from "@/utils/connectDB";
import User from "@/models/user.model";
import bcrypt from "bcryptjs";

export async function POST(request: NextRequest) {
  const { email, password, name } = await request.json();
  if (!email || !password || !name) {
    return NextResponse.json(
      { error: "All fields are required" },
      { status: 400 }
    );
  }
  try {
    await connectDB();

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        { error: "User already exists", success: false },
        { status: 409 }
      );
    }

    const hashsedPassword = await bcrypt.hash(password, 10);

    await User.create({
      email,
      password: hashsedPassword,
      name,
      provider: "credentials",
    });

    return NextResponse.json(
      { message: "User registered successfully", success: true },
      { status: 201 }
    );
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.error("Registration error:", error);
    }
    return NextResponse.json({ error: "Registration failed" }, { status: 500 });
  }
}
