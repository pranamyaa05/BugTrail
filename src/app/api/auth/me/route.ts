import { NextRequest, NextResponse } from "next/server";
import { getSession, encodeSession, SESSION_COOKIE_NAME, Role } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const switchTeamId = searchParams.get("switchTeamId");

    let session = await getSession(req);

    if (!session.user) {
      return NextResponse.json({ user: null, activeTeam: null, role: null, memberships: [] });
    }

    if (switchTeamId && switchTeamId !== session.activeTeam?.id) {
      const targetMembership = session.memberships.find((m) => m.teamId === switchTeamId);
      if (targetMembership) {
        const newToken = encodeSession({
          userId: session.user.id,
          email: session.user.email,
          name: session.user.name,
          teamId: targetMembership.teamId,
          role: targetMembership.role as Role,
        });

        session = await getSession(req); // Refresh
        const response = NextResponse.json(session);
        response.cookies.set(SESSION_COOKIE_NAME, newToken, {
          httpOnly: true,
          path: "/",
          sameSite: "lax",
          maxAge: 7 * 24 * 60 * 60,
        });
        return response;
      }
    }

    return NextResponse.json(session);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}