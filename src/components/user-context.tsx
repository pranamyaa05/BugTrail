"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  avatarUrl?: string | null;
}

export interface Team {
  id: string;
  name: string;
  joinCode: string;
  role?: string;
}

interface UserContextType {
  currentUser: User | null;
  users: User[];
  activeTeam: Team | null;
  userRole: string;
  memberships: Array<{ teamId: string; teamName: string; joinCode: string; role: string }>;
  setCurrentUser: (user: User) => void;
  switchTeam: (teamId: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshAuth: () => Promise<void>;
  isLoading: boolean;
  isAuthenticated: boolean;
}

const UserContext = createContext<UserContextType>({
  currentUser: null,
  users: [],
  activeTeam: null,
  userRole: "DEVELOPER",
  memberships: [],
  setCurrentUser: () => {},
  switchTeam: async () => {},
  logout: async () => {},
  refreshAuth: async () => {},
  isLoading: true,
  isAuthenticated: false,
});

export function UserProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeTeam, setActiveTeam] = useState<Team | null>(null);
  const [userRole, setUserRole] = useState<string>("DEVELOPER");
  const [memberships, setMemberships] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAuth = useCallback(async () => {
    setIsLoading(true);
    try {
      // Fetch active auth session
      const meRes = await fetch("/api/auth/me");
      if (meRes.ok) {
        const meData = await meRes.json();
        if (meData.user) {
          setCurrentUser(meData.user);
          setActiveTeam(meData.activeTeam);
          setUserRole(meData.role || meData.user.role || "DEVELOPER");
          setMemberships(meData.memberships || []);

          // Fetch users list scoped to active team
          const teamIdQuery = meData.activeTeam ? `?teamId=${meData.activeTeam.id}` : "";
          const usersRes = await fetch(`/api/users${teamIdQuery}`);
          if (usersRes.ok) {
            const usersData = await usersRes.json();
            if (Array.isArray(usersData)) setUsers(usersData);
          }
          setIsLoading(false);
          return;
        }
      }

      // No session
      setCurrentUser(null);
      setActiveTeam(null);
      setUserRole("DEVELOPER");
      setMemberships([]);
    } catch (err) {
      console.error("Auth initialization error:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAuth();
  }, [fetchAuth]);

  const handleSetUser = (user: User) => {
    setCurrentUser(user);
    setUserRole(user.role);
  };

  const switchTeam = async (teamId: string) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/auth/me?switchTeamId=${teamId}`);
      if (res.ok) {
        const data = await res.json();
        setActiveTeam(data.activeTeam);
        setUserRole(data.role);
        router.refresh();
      }
    } catch (e) {
      console.error("Switch team error", e);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      setCurrentUser(null);
      setActiveTeam(null);
      setMemberships([]);
      router.push("/login");
    } catch (e) {
      console.error("Logout error", e);
    }
  };

  return (
    <UserContext.Provider
      value={{
        currentUser,
        users,
        activeTeam,
        userRole,
        memberships,
        setCurrentUser: handleSetUser,
        switchTeam,
        logout,
        refreshAuth: fetchAuth,
        isLoading,
        isAuthenticated: !!currentUser && !!activeTeam,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

export const useUser = () => useContext(UserContext);