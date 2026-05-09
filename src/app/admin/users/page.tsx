"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, Plus, ToggleLeft, ToggleRight, Shield, User } from "lucide-react";

type AdminUser = {
  id: string;
  email: string;
  name: string;
  role: string;
  active: boolean;
  last_login_at: string | null;
  created_at: string;
};

export default function AdminUsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [creating, setCreating] = useState(false);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  function showToastMsg(msg: string, ok = true) {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  }

  async function load() {
    setLoading(true);
    const res = await fetch("/api/admin/users");
    if (res.ok) setUsers(await res.json());
    else if (res.status === 403) router.push("/admin");
    setLoading(false);
  }

  async function create() {
    setCreating(true);
    const res = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form)
    });
    setCreating(false);
    if (res.ok) {
      setShowCreate(false);
      setForm({ name: "", email: "", password: "" });
      showToastMsg("Admin user created");
      load();
    } else {
      const err = await res.json();
      showToastMsg(err.error ?? "Failed to create", false);
    }
  }

  async function toggle(id: string, active: boolean) {
    const res = await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, active: !active })
    });
    if (res.ok) {
      setUsers((prev) => prev.map((u) => u.id === id ? { ...u, active: !active } : u));
      showToastMsg("Updated");
    } else {
      const err = await res.json();
      showToastMsg(err.error ?? "Failed", false);
    }
  }

  useEffect(() => { load(); }, []);

  const adminSlots = users.filter((u) => u.role === "admin");
  const superAdmin = users.find((u) => u.role === "superadmin");

  return (
    <div className="min-h-screen" style={{ background: "#0f0020", fontFamily: "'Sora','Inter',sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700;800&display=swap');`}</style>

      {toast && (
        <div className="fixed top-4 right-4 z-50 rounded-xl px-4 py-3 text-sm font-semibold shadow-lg" style={{ background: toast.ok ? "rgba(34,197,94,0.15)" : "rgba(220,38,38,0.15)", color: toast.ok ? "#86efac" : "#fca5a5", border: `1px solid ${toast.ok ? "rgba(34,197,94,0.3)" : "rgba(220,38,38,0.3)"}` }}>
          {toast.msg}
        </div>
      )}

      <header style={{ borderBottom: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.03)" }}>
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <button onClick={() => router.push("/admin")} className="flex items-center gap-1 text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>
              <ChevronLeft className="h-4 w-4" /> Dashboard
            </button>
            <span style={{ color: "rgba(255,255,255,0.2)" }}>/</span>
            <span className="text-sm font-semibold text-white">Admin Users</span>
          </div>
          {adminSlots.length < 3 && (
            <button
              onClick={() => setShowCreate(true)}
              className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-bold text-white"
              style={{ background: "linear-gradient(135deg, #530792, #7c3aed)" }}
            >
              <Plus className="h-3.5 w-3.5" /> Add Admin
            </button>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-8">
        <div className="mb-4 text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>
          {adminSlots.length}/3 admin slots used · 1 SuperAdmin
        </div>

        <div className="space-y-3">
          {/* SuperAdmin */}
          {superAdmin && (
            <div className="rounded-2xl p-5" style={{ background: "rgba(83,7,146,0.15)", border: "1px solid rgba(83,7,146,0.3)" }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: "linear-gradient(135deg, #530792, #7c3aed)" }}>
                    <Shield className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <div className="font-semibold text-white">{superAdmin.name}</div>
                    <div className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>{superAdmin.email}</div>
                  </div>
                </div>
                <span className="rounded-full px-2.5 py-0.5 text-xs font-bold" style={{ background: "rgba(83,7,146,0.4)", color: "#c084fc" }}>
                  SuperAdmin
                </span>
              </div>
            </div>
          )}

          {/* Admin slots */}
          {Array.from({ length: 3 }).map((_, i) => {
            const user = adminSlots[i];
            return (
              <div
                key={i}
                className="rounded-2xl p-5"
                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}
              >
                {user ? (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: "rgba(255,255,255,0.08)" }}>
                        <User className="h-5 w-5" style={{ color: "rgba(255,255,255,0.4)" }} />
                      </div>
                      <div>
                        <div className="font-semibold text-white">{user.name}</div>
                        <div className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
                          {user.email} · {user.last_login_at ? `Last login ${new Date(user.last_login_at).toLocaleDateString()}` : "Never logged in"}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => toggle(user.id, user.active)}
                      className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold"
                      style={{ background: user.active ? "rgba(34,197,94,0.1)" : "rgba(220,38,38,0.1)", color: user.active ? "#86efac" : "#fca5a5", border: `1px solid ${user.active ? "rgba(34,197,94,0.2)" : "rgba(220,38,38,0.2)"}` }}
                    >
                      {user.active ? <ToggleRight className="h-3.5 w-3.5" /> : <ToggleLeft className="h-3.5 w-3.5" />}
                      {user.active ? "Active" : "Inactive"}
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: "rgba(255,255,255,0.04)", border: "1px dashed rgba(255,255,255,0.1)" }}>
                      <Plus className="h-4 w-4" style={{ color: "rgba(255,255,255,0.2)" }} />
                    </div>
                    <div className="text-sm" style={{ color: "rgba(255,255,255,0.3)" }}>Admin slot {i + 1} — empty</div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </main>

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ background: "rgba(0,0,0,0.7)" }}>
          <div className="w-full max-w-md rounded-2xl p-6" style={{ background: "#1a0030", border: "1px solid rgba(255,255,255,0.1)" }}>
            <h3 className="mb-4 text-base font-bold text-white">Add Admin User</h3>
            <div className="space-y-3">
              {[
                { label: "Full Name", key: "name", type: "text", placeholder: "Jane Smith" },
                { label: "Email", key: "email", type: "email", placeholder: "jane@example.com" },
                { label: "Password", key: "password", type: "password", placeholder: "Min 8 characters" },
              ].map((field) => (
                <div key={field.key}>
                  <label className="block text-xs font-semibold mb-1" style={{ color: "rgba(255,255,255,0.6)" }}>{field.label}</label>
                  <input
                    type={field.type}
                    value={form[field.key as keyof typeof form]}
                    onChange={(e) => setForm({ ...form, [field.key]: e.target.value })}
                    placeholder={field.placeholder}
                    className="w-full rounded-xl px-4 py-2.5 text-sm text-white outline-none"
                    style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}
                  />
                </div>
              ))}
            </div>
            <div className="mt-5 flex gap-3">
              <button onClick={() => setShowCreate(false)} className="flex-1 rounded-xl py-2.5 text-sm font-semibold" style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.6)" }}>
                Cancel
              </button>
              <button
                onClick={create}
                disabled={creating || !form.name || !form.email || !form.password}
                className="flex-1 rounded-xl py-2.5 text-sm font-bold text-white disabled:opacity-50"
                style={{ background: "linear-gradient(135deg, #530792, #7c3aed)" }}
              >
                {creating ? "Creating…" : "Create Admin"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
