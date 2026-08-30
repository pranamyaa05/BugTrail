import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession, encodeSession, SESSION_COOKIE_NAME } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const session = await getSession(req);
    if (!session.user) {
      return NextResponse.json({ error: "Unauthorized. Please log in first." }, { status: 401 });
    }

    const { joinCode, role = "DEVELOPER" } = await req.json();
    if (!joinCode || !joinCode.trim()) {
      return NextResponse.json({ error: "Join code is required." }, { status: 400 });
    }

    // STRICT ROLE PERMISSION RULE: Users joining a team CANNOT make themselves ADMIN
    if (role === "ADMIN") {
      return NextResponse.json(
        { error: "Security Restriction: Joining members cannot assign themselves the ADMIN role. Please choose DEVELOPER, TRIAGER, QA/TESTER, or REPORTER." },
        { status: 403 }
      );
    }

    const validRoles = ["TRIAGER", "DEVELOPER", "QA/TESTER", "REPORTER"];
    const assignedRole = validRoles.includes(role) ? role : "DEVELOPER";

    const cleanCode = joinCode.trim().toUpperCase();
    const team = await prisma.team.findFirst({
      where: {
        OR: [{ joinCode: cleanCode }, { id: cleanCode }],
      },
    });

    if (!team) {
      return NextResponse.json(
        { error: "Invalid join code. Please check the code provided by your workspace admin." },
        { status: 404 }
      );
    }

    // Check if already a member
    const existingMembership = await prisma.teamMember.findUnique({
      where: {
        teamId_userId: {
          teamId: team.id,
          userId: session.user.id,
        },
      },
    });

    let activeRole = assignedRole;
    if (existingMembership) {
      activeRole = existingMembership.role;
    } else {
      await prisma.teamMember.create({
        data: {
          teamId: team.id,
          userId: session.user.id,
          role: assignedRole,
        },
      });
    }

    // Update session cookie with new active team
    const newToken = encodeSession({
      userId: session.user.id,
      email: session.user.email,
      name: session.user.name,
      teamId: team.id,
      role: activeRole,
    });

    const response = NextResponse.json({
      success: true,
      team: {
        id: team.id,
        name: team.name,
        joinCode: team.joinCode,
        role: activeRole,
      },
    });

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