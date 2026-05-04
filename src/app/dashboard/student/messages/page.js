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

export default function StudentMessagesPage() {
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
      const res = await fetch("/api/student/messages", {
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
      const res = await fetch("/api/student/messages", {
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
      window.dispatchEvent(new Event("portal-messages-updated"));
    } catch (updateError) {
      setError(updateError.message || "Unable to update message");
    } finally {
      setUpdatingId("");
    }
  }

  const unreadCount = useMemo(
    () => messages.filter((item) => !item.isRead).length,
    [messages],
  );
  const readCount = useMemo(
    () => messages.filter((item) => item.isRead).length,
    [messages],
  );
  const visibleMessages = useMemo(() => {
    if (filter === "unread") return messages.filter((item) => !item.isRead);
    if (filter === "read") return messages.filter((item) => item.isRead);
    return messages;
  }, [filter, messages]);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#eff6ff_0%,#f8fafc_42%,#f8fafc_100%)] p-4 md:p-6">
      <div className="mx-auto max-w-5xl space-y-6">
        <section className="relative overflow-hidden rounded-[30px] border border-white/80 bg-[linear-gradient(135deg,rgba(255,255,255,0.98),rgba(239,246,255,0.95),rgba(224,231,255,0.86))] p-5 shadow-[0_28px_70px_-40px_rgba(15,23,42,0.35)] md:p-6">
          <div className="pointer-events-none absolute right-[-68px] top-[-68px] h-40 w-40 rounded-full bg-blue-200/45 blur-3xl" />
          <div className="pointer-events-none absolute bottom-[-76px] left-[-42px] h-36 w-36 rounded-full bg-indigo-200/35 blur-3xl" />
          <div className="relative flex items-start gap-4">
            <span className="inline-flex h-14 w-14 items-center justify-center rounded-[22px] border border-white/80 bg-white/80 text-blue-700 shadow-[0_16px_36px_-24px_rgba(37,99,235,0.65)] backdrop-blur">
              <Bell className="h-5 w-5" />
            </span>
            <div className="max-w-3xl">
              <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-blue-700">
                Notifications
              </p>
              <h1 className="mt-3 text-3xl font-black tracking-[-0.03em] text-slate-950 md:text-[2.4rem]">
                Student update messages
              </h1>
              <div className="mt-4 rounded-[24px] border border-white/70 bg-white/72 px-4 py-4 shadow-[0_24px_45px_-34px_rgba(15,23,42,0.3)] backdrop-blur">
                <p className="text-base font-semibold leading-7 text-slate-800">
                  Stay on top of admin updates with a cleaner reading view and quick read controls.
                </p>
                <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-600 md:text-[15px]">
                  Read the latest portal notices, catch important announcements faster, and manage which updates still need your attention.
                </p>
              </div>
            </div>
          </div>

          <div className="relative mt-5 grid gap-4 sm:grid-cols-3">
            <div className="rounded-[22px] border border-slate-200 bg-white/90 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">All</p>
              <p className="mt-2 text-3xl font-bold text-slate-950">{messages.length}</p>
            </div>
            <div className="rounded-[22px] border border-slate-200 bg-white/90 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Unread</p>
              <p className="mt-2 text-3xl font-bold text-rose-700">{unreadCount}</p>
            </div>
            <div className="rounded-[22px] border border-slate-200 bg-white/90 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Read</p>
              <p className="mt-2 text-3xl font-bold text-emerald-700">{readCount}</p>
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
                  className={`group relative overflow-hidden rounded-[24px] border p-5 shadow-sm transition duration-200 ${
                    item.isRead
                      ? "border-slate-200 bg-slate-50/80 hover:border-slate-300 hover:bg-white"
                      : "border-blue-200 bg-[linear-gradient(135deg,rgba(239,246,255,0.98),rgba(255,255,255,0.96),rgba(224,231,255,0.9))] shadow-[0_20px_45px_-34px_rgba(37,99,235,0.45)] hover:border-blue-300"
                  }`}
                >
                  <div
                    className={`pointer-events-none absolute inset-y-0 left-0 w-1.5 rounded-r-full ${
                      item.isRead ? "bg-slate-200" : "bg-[linear-gradient(180deg,#2563eb,#7c3aed)]"
                    }`}
                  />
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div className="min-w-0 pl-1">
                      <div className="flex flex-wrap items-start gap-2">
                        <div className="min-w-0 flex-1">
                          <h2
                            className={`text-[1.15rem] font-black leading-tight tracking-[-0.03em] ${
                              item.isRead
                                ? "text-slate-900"
                                : "bg-[linear-gradient(135deg,#0f172a_0%,#1d4ed8_55%,#4338ca_100%)] bg-clip-text text-transparent"
                            }`}
                          >
                            {item.title}
                          </h2>
                          <div
                            className={`mt-3 h-px w-16 ${
                              item.isRead
                                ? "bg-slate-200"
                                : "bg-[linear-gradient(90deg,rgba(37,99,235,0.95),rgba(129,140,248,0.55),transparent)]"
                            }`}
                          />
                        </div>
                        <span
                          className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] ${
                            item.isRead
                              ? "bg-slate-200 text-slate-700"
                              : "bg-blue-100 text-blue-800"
                          }`}
                        >
                          {item.isRead ? "Read" : "Unread"}
                        </span>
                      </div>
                      <p
                        className={`mt-4 whitespace-pre-wrap text-[15px] leading-8 ${
                          item.isRead ? "text-slate-600" : "text-slate-700"
                        }`}
                      >
                        {item.body}
                      </p>
                      <p className="mt-4 inline-flex rounded-full bg-white/75 px-3 py-1 text-[11px] font-medium text-slate-500 shadow-sm">
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
