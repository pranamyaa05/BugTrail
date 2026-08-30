import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession, encodeSession, SESSION_COOKIE_NAME } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const session = await getSession(req);
    if (!session.user) {
      return NextResponse.json({ error: "Unauthorized. Please log in first." }, { status: 401 });
    }

    const { name } = await req.json();
    if (!name || !name.trim()) {
      return NextResponse.json({ error: "Team name is required." }, { status: 400 });
    }

    // Generate unique 6-character alphanumeric join code
    const randomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    const joinCode = `BT-${randomCode}`;

    const team = await prisma.team.create({
      data: {
        name: name.trim(),
        joinCode,
        members: {
          create: {
            userId: session.user.id,
            role: "ADMIN", // Creator automatically becomes ADMIN
          },
        },
      },
    });

    // Update user session to point to the new team as active
    const newToken = encodeSession({
      userId: session.user.id,
      email: session.user.email,
      name: session.user.name,
      teamId: team.id,
      role: "ADMIN",
    });

    const response = NextResponse.json(
      {
        success: true,
        team: {
          id: team.id,
          name: team.name,
          joinCode: team.joinCode,
          role: "ADMIN",
        },
      },
      { status: 201 }
    );

    response.cookies.set(SESSION_COOKIE_NAME, newToken, {
      httpOnly: true,
      path: "/",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60,
    });

    return response;
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}