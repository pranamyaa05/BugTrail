import { NextRequest, NextResponse } from "next/server";
import { prisma } from "./prisma";
import bcrypt from "bcryptjs";

export const SESSION_COOKIE_NAME = "bugtrail_session";

export const ROLES = ["ADMIN", "TRIAGER", "DEVELOPER", "QA/TESTER", "REPORTER"] as const;
export type Role = (typeof ROLES)[number];

export interface SessionData {
  userId: string;
  email: string;
  name: string;
  teamId?: string | null;
  role?: Role | null;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// Simple base64url encoded JSON payload for local cookie sessions
export function encodeSession(data: SessionData): string {
  const json = JSON.stringify({ ...data, expires: Date.now() + 7 * 24 * 60 * 60 * 1000 });
  return Buffer.from(json).toString("base64url");
}

export function decodeSession(token: string): SessionData | null {
  try {
    const json = Buffer.from(token, "base64url").toString("utf8");
    const data = JSON.parse(json);
    if (data.expires && data.expires < Date.now()) return null;
    return {
      userId: data.userId,
      email: data.email,
      name: data.name,
      teamId: data.teamId || null,
      role: data.role || null,
    };
  } catch (e) {
    return null;
  }
}

export async function getSession(req?: NextRequest): Promise<{
  user: any | null;
  activeTeam: any | null;
  role: Role | null;
  memberships: any[];
}> {
  let token: string | undefined;

  if (req) {
    token = req.cookies.get(SESSION_COOKIE_NAME)?.value;
  }

  if (!token) {
    return { user: null, activeTeam: null, role: null, memberships: [] };
  }

  const sessionData = decodeSession(token);
  if (!sessionData || !sessionData.userId) {
    return { user: null, activeTeam: null, role: null, memberships: [] };
  }

  const user = await prisma.user.findUnique({
    where: { id: sessionData.userId },
    include: {
      memberships: {
        include: { team: true },
      },
    },
  });

  if (!user) {
    return { user: null, activeTeam: null, role: null, memberships: [] };
  }

  const memberships = user.memberships || [];
  let activeMembership = memberships.find((m) => m.teamId === sessionData.teamId);
  
  if (!activeMembership && memberships.length > 0) {
    activeMembership = memberships[0];
  }

  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatarUrl: user.avatarUrl,
    },
    activeTeam: activeMembership ? activeMembership.team : null,
    role: (activeMembership ? activeMembership.role : user.role) as Role,
    memberships: memberships.map((m) => ({
      teamId: m.team.id,
      teamName: m.team.name,
      joinCode: m.team.joinCode,
      role: m.role,
    })),
  };
}

/**
 * Server-side RBAC Permission Rules
 */
export function hasPermission(
  userRole: Role | string,
  action: "CREATE_BUG" | "TRANSITION_STATUS" | "ASSIGN_BUG" | "CREATE_PRODUCT" | "MANAGE_TEAM" | "DELETE_BUG"
): boolean {
  const role = userRole as Role;

  switch (action) {
    case "CREATE_PRODUCT":
    case "MANAGE_TEAM":
    case "DELETE_BUG":
      return role === "ADMIN";

    case "TRANSITION_STATUS":
    case "ASSIGN_BUG":
      return ["ADMIN", "TRIAGER", "DEVELOPER", "QA/TESTER"].includes(role);

    case "CREATE_BUG":
      return ["ADMIN", "TRIAGER", "DEVELOPER", "QA/TESTER", "REPORTER"].includes(role);

    default:
      return false;
  }
}