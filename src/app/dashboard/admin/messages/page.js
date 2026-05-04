"use client";

import { useEffect, useState } from "react";
import { BellRing, Send, Trash2 } from "lucide-react";

function Input(props) {
  return (
    <input
      {...props}
      className={`w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-amber-400 ${props.className || ""}`}
    />
  );
}

function Select(props) {
  return (
    <select
      {...props}
      className={`w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-amber-400 ${props.className || ""}`}
    />
  );
}

function Textarea(props) {
  return (
    <textarea
      {...props}
      className={`w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-amber-400 ${props.className || ""}`}
    />
  );
}

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

export default function AdminMessagesPage() {
  const [targetRole, setTargetRole] = useState("student");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [deletingId, setDeletingId] = useState("");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    loadMessages();
  }, []);

  async function loadMessages() {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/messages", {
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

  async function handleSend(e) {
    e.preventDefault();
    try {
      setSending(true);
      setNotice("");
      setError("");

      const res = await fetch("/api/admin/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ targetRole, title, body }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || "Unable to send message");

      setTitle("");
      setBody("");
      setNotice(data?.message || "Message sent successfully.");
      await loadMessages();
    } catch (sendError) {
      setError(sendError.message || "Unable to send message");
    } finally {
      setSending(false);
    }
  }

  async function handleDelete(id) {
    try {
      setDeletingId(id);
      setNotice("");
      setError("");

      const res = await fetch(`/api/admin/messages?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || "Unable to delete message");
      setNotice(data?.message || "Message deleted.");
      await loadMessages();
    } catch (deleteError) {
      setError(deleteError.message || "Unable to delete message");
    } finally {
      setDeletingId("");
    }
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#fff7ed_0%,#fffbeb_26%,#f8fafc_100%)] p-4 md:p-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <section className="rounded-[30px] border border-white/80 bg-[linear-gradient(135deg,rgba(255,255,255,0.98),rgba(255,251,235,0.95),rgba(254,243,199,0.86))] p-5 shadow-[0_28px_70px_-40px_rgba(15,23,42,0.35)] md:p-6">
          <div className="flex items-start gap-3">
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
              <BellRing className="h-5 w-5" />
            </span>
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-amber-700">
                Message Center
              </p>
              <h1 className="mt-2 text-3xl font-bold text-slate-950">
                Send premium portal updates to students or faculty
              </h1>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
                Use this panel to publish notices, update alerts, and important portal information. Admin chooses whether the message should go to students or faculty before sending it.
              </p>
            </div>
          </div>

          {notice ? (
            <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              {notice}
            </div>
          ) : null}
          {error ? (
            <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          ) : null}
        </section>

        <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
          <section className="rounded-[28px] border border-white/80 bg-white/94 p-5 shadow-[0_24px_55px_-40px_rgba(15,23,42,0.35)] md:p-6">
            <h2 className="text-lg font-semibold text-slate-950">Compose Message</h2>
            <form className="mt-5 space-y-4" onSubmit={handleSend}>
              <Select value={targetRole} onChange={(e) => setTargetRole(e.target.value)}>
                <option value="student">Send to Students</option>
                <option value="faculty">Send to Faculty</option>
              </Select>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Message title"
                maxLength={160}
              />
              <Textarea
                rows={8}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Write the update, notice, or instruction here"
                maxLength={4000}
              />
              <button
                type="submit"
                disabled={sending}
                className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60"
              >
                <Send className="h-4 w-4" />
                {sending ? "Sending..." : "Send Message"}
              </button>
            </form>
          </section>

          <section className="rounded-[28px] border border-white/80 bg-white/94 p-5 shadow-[0_24px_55px_-40px_rgba(15,23,42,0.35)] md:p-6">
            <h2 className="text-lg font-semibold text-slate-950">Recent Messages</h2>
            <p className="mt-2 text-sm text-slate-500">
              Review what has already been sent and remove any wrong notice.
            </p>

            {loading ? (
              <div className="mt-5 rounded-[22px] border border-dashed border-slate-300 bg-slate-50 px-5 py-8 text-sm text-slate-500">
                Loading messages...
              </div>
            ) : !messages.length ? (
              <div className="mt-5 rounded-[22px] border border-dashed border-slate-300 bg-slate-50 px-5 py-8 text-sm text-slate-500">
                No messages sent yet.
              </div>
            ) : (
              <div className="mt-5 space-y-3">
                {messages.map((item) => (
                  <div
                    key={item._id}
                    className="rounded-[22px] border border-slate-200 bg-slate-50/80 p-4"
                  >
                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-base font-semibold text-slate-950">
                            {item.title}
                          </h3>
                          <span className="rounded-full bg-amber-100 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-amber-800">
                            {item.targetRole}
                          </span>
                        </div>
                        <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">
                          {item.body}
                        </p>
                        <p className="mt-3 text-xs text-slate-400">
                          {formatDate(item.createdAt)} • Read by {item.readCount || 0}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleDelete(item._id)}
                        disabled={deletingId === item._id}
                        className="inline-flex items-center justify-center gap-2 rounded-2xl border border-red-200 bg-white px-4 py-3 text-sm font-semibold text-red-600 transition hover:border-red-300 hover:bg-red-50 disabled:opacity-60"
                      >
                        <Trash2 className="h-4 w-4" />
                        {deletingId === item._id ? "Deleting..." : "Delete"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
