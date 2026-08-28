"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  avatarUrl?: string | null;
}

interface UserContextType {
  currentUser: User | null;
  users: User[];
  setCurrentUser: (user: User) => void;
  isLoading: boolean;
}

const UserContext = createContext<UserContextType>({
  currentUser: null,
  users: [],
  setCurrentUser: () => {},
  isLoading: true,
});

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch("/api/users")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setUsers(data);
          const savedUserId = localStorage.getItem("bugtrail_user_id");
          const found = data.find((u) => u.id === savedUserId);
          setCurrentUser(found || data[0]);
        }
      })
      .catch((err) => console.error("Failed to load users:", err))
      .finally(() => setIsLoading(false));
  }, []);

  const handleSetUser = (user: User) => {
    setCurrentUser(user);
    localStorage.setItem("bugtrail_user_id", user.id);
  };

  return (
    <UserContext.Provider
      value={{
        currentUser,
        users,
        setCurrentUser: handleSetUser,
        isLoading,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

export const useUser = () => useContext(UserContext);