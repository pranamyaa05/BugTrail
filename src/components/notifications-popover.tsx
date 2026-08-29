"use client";

import React, { useEffect, useState, useRef } from "react";
import { Bell, X } from "lucide-react";
import { useUser } from "./user-context";

interface AppNotification {
  id: string;
  title: string;
  message: string;
  time: Date;
  read: boolean;
}

export function NotificationsPopover() {
  const { currentUser } = useUser();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [toasts, setToasts] = useState<AppNotification[]>([]);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Click outside to close
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!currentUser) return;

    const eventSource = new EventSource("/api/events");

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        // Let's create a notification based on the event
        let title = "";
        let message = "";

        if (data.type === "BUG_CREATED") {
          title = "New Bug Filed";
          message = `${data.payload.key} was created.`;
        } else if (data.type === "STATUS_CHANGED") {
          title = "Status Updated";
          message = `${data.payload.key} is now ${data.payload.status}.`;
        } else if (data.type === "BUG_UPDATED") {
          title = "Bug Updated";
          message = `${data.payload.key} was modified.`;
        } else if (data.type === "COMMENT_ADDED") {
          title = "New Comment";
          message = `Someone commented on ${data.payload.bugId}.`;
        } else if (data.type === "MENTION") {
          // Check if it's mentioning the current user
          if (currentUser.name.toLowerCase().includes(data.payload.username.toLowerCase())) {
            title = "You were mentioned";
            message = `${data.payload.authorName} mentioned you in ${data.payload.bugId}.`;
          }
        }

        if (title) {
          const newNotif = {
            id: Math.random().toString(36).substring(7),
            title,
            message,
            time: new Date(),
            read: false,
          };
          setNotifications((prev) => [newNotif, ...prev]);
          setToasts((prev) => [newNotif, ...prev]);
          
          // Auto-remove toast after 5s
          setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== newNotif.id));
          }, 5000);
        }
      } catch (err) {
        console.error("SSE parse error", err);
      }
    };

    return () => {
      eventSource.close();
    };
  }, [currentUser]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  return (
    <>
      {/* Toasts */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
        {toasts.map((toast) => (
          <div key={toast.id} className="bg-white border border-slate-200 shadow-lg rounded-lg p-3 w-72 animate-in slide-in-from-right-8 fade-in flex flex-col gap-1">
            <div className="flex justify-between items-start">
              <span className="text-xs font-bold text-violet-700">{toast.title}</span>
              <button onClick={() => setToasts(t => t.filter(x => x.id !== toast.id))} className="text-slate-400 hover:text-slate-600">
                <X className="w-3 h-3" />
              </button>
            </div>
            <span className="text-[11px] text-slate-600">{toast.message}</span>
          </div>
        ))}
      </div>

      {/* Bell & Popover */}
      <div className="relative" ref={popoverRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="relative p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
        >
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
          )}
        </button>

        {isOpen && (
          <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 shadow-xl rounded-xl z-50 overflow-hidden">
            <div className="flex items-center justify-between p-3 border-b border-slate-100 bg-slate-50">
              <span className="text-xs font-bold text-slate-800">Notifications</span>
              {unreadCount > 0 && (
                <button onClick={markAllRead} className="text-[10px] text-violet-600 hover:underline">
                  Mark all as read
                </button>
              )}
            </div>
            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400">
                  No notifications yet.
                </div>
              ) : (
                notifications.map((n) => (
                  <div key={n.id} className={`p-3 border-b border-slate-100 flex flex-col gap-1 ${!n.read ? 'bg-violet-50/50' : 'bg-white'}`}>
                    <div className="flex justify-between items-start">
                      <span className="text-xs font-bold text-slate-800">{n.title}</span>
                      <span className="text-[9px] text-slate-400">{n.time.toLocaleTimeString()}</span>
                    </div>
                    <span className="text-[11px] text-slate-600">{n.message}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
