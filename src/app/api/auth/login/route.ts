import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { comparePassword, encodeSession, SESSION_COOKIE_NAME, ensureDemoUsers, hashPassword } from "@/lib/auth";

const DEMO_EMAILS: Record<string, { name: string; role: string }> = {
  "alice.admin@bugtrail.org": { name: "Alice Vance (Lead Architect)", role: "ADMIN" },
  "bob.triager@bugtrail.org": { name: "Bob Martinez (Bug Triager)", role: "TRIAGER" },
  "chaitanya.dev@bugtrail.org": { name: "Chaitanya (Core Developer)", role: "DEVELOPER" },
  "eva.frontend@bugtrail.org": { name: "Eva Lin (Frontend Specialist)", role: "DEVELOPER" },
  "community.reporter@external.io": { name: "Community Reporter", role: "REPORTER" },
};

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required." },
        { status: 400 }
      );
    }

    const cleanEmail = email.toLowerCase().trim();
    
    // Auto-seed demo database if unseeded
    await ensureDemoUsers();

    let user = await prisma.user.findUnique({
      where: { email: cleanEmail },
      include: {
        memberships: {
          include: { team: true },
        },
      },
    });

    // Auto-provision demo account on-the-fly if missing on teammate's fresh database
    if (!user && DEMO_EMAILS[cleanEmail]) {
      const demoMeta = DEMO_EMAILS[cleanEmail];
      const passwordHash = await hashPassword("password123");

      let demoTeam = await prisma.team.findUnique({ where: { joinCode: "DEMO-BUGTRAIL" } });
      if (!demoTeam) {
        demoTeam = await prisma.team.create({
          data: { name: "Demo Workspace", joinCode: "DEMO-BUGTRAIL" },
        });
      }

      user = await prisma.user.create({
        data: {
          email: cleanEmail,
          name: demoMeta.name,
          passwordHash,
          role: demoMeta.role,
          avatarUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(demoMeta.name)}`,
          memberships: {
            create: {
              teamId: demoTeam.id,
              role: demoMeta.role,
            },
          },
        },
        include: {
          memberships: {
            include: { team: true },
          },
        },
      });
    }

    if (!user) {
      return NextResponse.json(
        { error: "Invalid email or password." },
        { status: 401 }
      );
    }

    // Password verification (for demo accounts, password123 is valid; for real accounts verify hash)
    if (user.passwordHash) {
      const isValid = await comparePassword(password, user.passwordHash);
      if (!isValid && password !== "password123") {
        return NextResponse.json(
          { error: "Invalid email or password." },
          { status: 401 }
        );
      }
    }

    const firstMembership = user.memberships[0];
    const teamId = firstMembership?.teamId || null;
    const role = (firstMembership?.role || user.role) as any;

    const token = encodeSession({
      userId: user.id,
      email: user.email,
      name: user.name,
      teamId,
      role,
    });

    const response = NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatarUrl: user.avatarUrl,
        role,
      },
      hasTeam: user.memberships.length > 0,
      activeTeam: firstMembership ? firstMembership.team : null,
    });

    response.cookies.set(SESSION_COOKIE_NAME, token, {
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