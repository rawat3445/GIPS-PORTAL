"use client";

import { useEffect, useMemo, useState } from "react";
import { Bell, CheckCheck } from "lucide-react";

function formatDate(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export default function FacultyMessagesPage() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState("");
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    loadMessages();
  }, []);

  async function loadMessages() {
    try {
      setLoading(true);
      setError("");
      const res = await fetch("/api/faculty/messages", {
        credentials: "include",
        cache: "no-store",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || "Unable to load messages");
      setMessages(Array.isArray(data?.messages) ? data.messages : []);
    } catch (loadError) {
      setError(loadError.message || "Unable to load messages");
    } finally {
      setLoading(false);
    }
  }

  async function setReadState(id, read) {
    try {
      setUpdatingId(id);
      const res = await fetch("/api/faculty/messages", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ id, read }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || "Unable to update message");
      setMessages((current) =>
        current.map((item) =>
          item._id === id ? { ...item, isRead: read } : item,
        ),
      );
    } catch (updateError) {
      setError(updateError.message || "Unable to update message");
    } finally {
      setUpdatingId("");
    }
  }

  const visibleMessages = useMemo(() => {
    if (filter === "unread") return messages.filter((item) => !item.isRead);
    if (filter === "read") return messages.filter((item) => item.isRead);
    return messages;
  }, [filter, messages]);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#eef2ff_0%,#f8fafc_42%,#f8fafc_100%)] p-4 md:p-6">
      <div className="mx-auto max-w-5xl space-y-6">
        <section className="rounded-[30px] border border-white/80 bg-[linear-gradient(135deg,rgba(255,255,255,0.98),rgba(238,242,255,0.95),rgba(224,231,255,0.88))] p-5 shadow-[0_28px_70px_-40px_rgba(15,23,42,0.35)] md:p-6">
          <div className="flex items-start gap-3">
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-700">
              <Bell className="h-5 w-5" />
            </span>
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-indigo-700">
                Faculty Notices
              </p>
              <h1 className="mt-2 text-3xl font-bold text-slate-950">
                Faculty message inbox
              </h1>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
                Review the latest updates from admin and keep track of read and unread notices.
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-[28px] border border-white/80 bg-white/94 p-5 shadow-[0_24px_55px_-40px_rgba(15,23,42,0.35)] md:p-6">
          <div className="flex flex-wrap gap-3">
            {[
              ["all", "All Messages"],
              ["unread", "Unread Only"],
              ["read", "Read Only"],
            ].map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setFilter(value)}
                className={`rounded-2xl px-4 py-2.5 text-sm font-semibold transition ${
                  filter === value
                    ? "bg-slate-900 text-white"
                    : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="mt-5 rounded-[22px] border border-dashed border-slate-300 bg-slate-50 px-5 py-8 text-sm text-slate-500">
              Loading messages...
            </div>
          ) : error ? (
            <div className="mt-5 rounded-[22px] border border-red-200 bg-red-50 px-5 py-8 text-sm text-red-700">
              {error}
            </div>
          ) : !visibleMessages.length ? (
            <div className="mt-5 rounded-[22px] border border-dashed border-slate-300 bg-slate-50 px-5 py-8 text-sm text-slate-500">
              No messages found in this filter.
            </div>
          ) : (
            <div className="mt-5 space-y-3">
              {visibleMessages.map((item) => (
                <div
                  key={item._id}
                  className={`rounded-[24px] border p-4 shadow-sm ${
                    item.isRead
                      ? "border-slate-200 bg-slate-50/80"
                      : "border-indigo-200 bg-[linear-gradient(135deg,rgba(238,242,255,0.98),rgba(255,255,255,0.96),rgba(224,231,255,0.9))]"
                  }`}
                >
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-base font-semibold text-slate-950">
                          {item.title}
                        </h2>
                        <span
                          className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] ${
                            item.isRead
                              ? "bg-slate-200 text-slate-700"
                              : "bg-indigo-100 text-indigo-800"
                          }`}
                        >
                          {item.isRead ? "Read" : "Unread"}
                        </span>
                      </div>
                      <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-600">
                        {item.body}
                      </p>
                      <p className="mt-3 text-xs text-slate-400">
                        {formatDate(item.createdAt)}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setReadState(item._id, !item.isRead)}
                      disabled={updatingId === item._id}
                      className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
                    >
                      <CheckCheck className="h-4 w-4" />
                      {updatingId === item._id
                        ? "Updating..."
                        : item.isRead
                          ? "Mark Unread"
                          : "Mark Read"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
