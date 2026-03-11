"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  User,
  Mail,
  Lock,
  LogOut,
  Building2,
  Save,
  Phone,
  MapPin,
  Eye,
  EyeOff,
  Trash2,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useAuth } from "@/lib/AuthContext";

function InputField({
  label,
  icon: Icon,
  type = "text",
  value,
  onChange,
  placeholder = "",
  rightElement,
}: {
  label: string;
  icon: React.ElementType;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rightElement?: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <label className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest ml-1">
        {label}
      </label>
      <div className="relative">
        <Icon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 dark:text-zinc-500 pointer-events-none" />
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full pl-11 pr-12 py-3 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-coral-200 transition-all text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-600"
        />
        {rightElement && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2">{rightElement}</div>
        )}
      </div>
    </div>
  );
}

function Toast({ message, type }: { message: string; type: "success" | "error" }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-3 rounded-2xl shadow-lg text-sm font-semibold ${
        type === "success"
          ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
          : "bg-red-50 text-red-700 border border-red-100"
      }`}
    >
      {type === "success" ? (
        <CheckCircle2 className="w-4 h-4" />
      ) : (
        <AlertTriangle className="w-4 h-4" />
      )}
      {message}
    </motion.div>
  );
}

export default function SettingsPage() {
  const { user, saveProfile, deleteAccount, logout, isLoggedIn, loading } = useAuth();
  const router = useRouter();

  // Profile fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [agencyName, setAgencyName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");

  // Password fields
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Danger Zone
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [showDeletePassword, setShowDeletePassword] = useState(false);

  // UI state
  const [profileSaving, setProfileSaving] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    if (user) {
      setName(user.name || "");
      setEmail(user.email || "");
      setAgencyName(user.agencyName || "");
      setPhone(user.phone || "");
      setAddress(user.address || "");
    }
  }, [user]);

  useEffect(() => {
    if (!loading && !isLoggedIn) router.push("/login");
  }, [loading, isLoggedIn, router]);

  if (loading || !isLoggedIn) return null;

  const handleSaveProfile = async () => {
    setProfileSaving(true);
    try {
      await saveProfile({ name, email, agencyName, phone, address });
      showToast("Profile saved successfully!", "success");
    } catch (err: any) {
      showToast(err.message || "Failed to save profile", "error");
    } finally {
      setProfileSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      showToast("Please fill in all password fields", "error");
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast("New passwords do not match", "error");
      return;
    }
    if (newPassword.length < 6) {
      showToast("Password must be at least 6 characters", "error");
      return;
    }
    setPasswordSaving(true);
    try {
      await saveProfile({ currentPassword, newPassword });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      showToast("Password updated successfully!", "success");
    } catch (err: any) {
      showToast(err.message || "Failed to update password", "error");
    } finally {
      setPasswordSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    setDeleting(true);
    try {
      await deleteAccount(deletePassword);
    } catch (err: any) {
      showToast(err.message || "Failed to delete account", "error");
      setDeleting(false);
    }
  };

  const eyeBtn = (show: boolean, toggle: () => void) => (
    <button type="button" onClick={toggle} className="text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors">
      {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
    </button>
  );

  return (
    <>
      <AnimatePresence>
        {toast && <Toast message={toast.message} type={toast.type} />}
      </AnimatePresence>

      {/* Delete confirmation modal */}
      <AnimatePresence>
        {showDeleteModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4"
          >
            <motion.div
              initial={{ scale: 0.93, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.93, opacity: 0 }}
              className="bg-white dark:bg-zinc-900 rounded-3xl p-8 max-w-md w-full shadow-2xl border border-zinc-100 dark:border-zinc-800"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-2xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                  <Trash2 className="w-5 h-5 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <h3 className="font-bold text-zinc-900 dark:text-zinc-100 text-lg">Delete Account</h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">This action cannot be undone</p>
                </div>
              </div>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-6">
                All your projects, clients, and data will be permanently deleted. Enter your password to confirm.
              </p>
              <div className="space-y-2 mb-6">
                <label className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest ml-1">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 dark:text-zinc-500" />
                  <input
                    type={showDeletePassword ? "text" : "password"}
                    value={deletePassword}
                    onChange={(e) => setDeletePassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full pl-11 pr-12 py-3 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-red-200 transition-all text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-600"
                  />
                  <button
                    type="button"
                    onClick={() => setShowDeletePassword(!showDeletePassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300"
                  >
                    {showDeletePassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => { setShowDeleteModal(false); setDeletePassword(""); }}
                  className="flex-1 py-3 rounded-2xl border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 font-semibold hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteAccount}
                  disabled={!deletePassword || deleting}
                  className="flex-1 py-3 rounded-2xl bg-red-600 text-white font-semibold hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm flex items-center justify-center gap-2"
                >
                  {deleting ? (
                    <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                  {deleting ? "Deleting…" : "Delete Account"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-4xl mx-auto px-6 py-12">
        <motion.header
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <h1 className="text-4xl font-bold text-zinc-900 dark:text-zinc-100 mb-2 tracking-tight">Settings</h1>
          <p className="text-zinc-500 dark:text-zinc-400">Manage your profile, security, and account preferences</p>
        </motion.header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* ── Left column: main sections ── */}
          <div className="md:col-span-2 space-y-6">

            {/* Profile Information */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="glass-card p-8 space-y-6"
            >
              <h2 className="text-xl font-bold text-zinc-800 dark:text-zinc-100 flex items-center gap-2">
                <User className="w-5 h-5 text-coral-500" />
                Profile
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <InputField label="Name" icon={User} value={name} onChange={setName} placeholder="Your full name" />
                <InputField label="Email" icon={Mail} type="email" value={email} onChange={setEmail} placeholder="you@agency.com" />
                <InputField label="Phone" icon={Phone} type="tel" value={phone} onChange={setPhone} placeholder="+1 (555) 000-0000" />
                <InputField label="Agency Name" icon={Building2} value={agencyName} onChange={setAgencyName} placeholder="My Agency" />
              </div>

              <InputField label="Address" icon={MapPin} value={address} onChange={setAddress} placeholder="123 Main St, City, Country" />

              <div className="flex justify-end pt-2">
                <button
                  onClick={handleSaveProfile}
                  disabled={profileSaving}
                  className="btn-primary flex items-center gap-2 shadow-lg shadow-coral-100 dark:shadow-none disabled:opacity-60"
                >
                  {profileSaving ? (
                    <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  {profileSaving ? "Saving…" : "Save Profile"}
                </button>
              </div>
            </motion.div>

            {/* Security */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.05 }}
              className="glass-card p-8 space-y-6"
            >
              <h2 className="text-xl font-bold text-zinc-800 dark:text-zinc-100 flex items-center gap-2">
                <Lock className="w-5 h-5 text-coral-500" />
                Change Password
              </h2>

              <div className="space-y-4">
                <InputField
                  label="Current Password"
                  icon={Lock}
                  type={showCurrent ? "text" : "password"}
                  value={currentPassword}
                  onChange={setCurrentPassword}
                  placeholder="Enter current password"
                  rightElement={eyeBtn(showCurrent, () => setShowCurrent(!showCurrent))}
                />
                <InputField
                  label="New Password"
                  icon={Lock}
                  type={showNew ? "text" : "password"}
                  value={newPassword}
                  onChange={setNewPassword}
                  placeholder="At least 6 characters"
                  rightElement={eyeBtn(showNew, () => setShowNew(!showNew))}
                />
                <InputField
                  label="Confirm New Password"
                  icon={Lock}
                  type={showConfirm ? "text" : "password"}
                  value={confirmPassword}
                  onChange={setConfirmPassword}
                  placeholder="Repeat new password"
                  rightElement={eyeBtn(showConfirm, () => setShowConfirm(!showConfirm))}
                />
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={handleChangePassword}
                  disabled={passwordSaving}
                  className="btn-primary flex items-center gap-2 shadow-lg shadow-coral-100 dark:shadow-none disabled:opacity-60"
                >
                  {passwordSaving ? (
                    <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Lock className="w-4 h-4" />
                  )}
                  {passwordSaving ? "Updating…" : "Update Password"}
                </button>
              </div>
            </motion.div>

            {/* Danger Zone */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="rounded-3xl border-2 border-red-100 bg-red-50/50 p-8 space-y-4"
            >
              <h2 className="text-xl font-bold text-red-700 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                Danger Zone
              </h2>
              <p className="text-sm text-red-600/80">
                Once you delete your account, all data will be permanently removed and cannot be recovered.
              </p>
              <button
                onClick={() => setShowDeleteModal(true)}
                className="flex items-center gap-2 px-5 py-3 bg-red-600 text-white rounded-2xl font-semibold hover:bg-red-700 active:scale-95 transition-all text-sm shadow-md shadow-red-200"
              >
                <Trash2 className="w-4 h-4" />
                Delete Account
              </button>
            </motion.div>
          </div>

          {/* ── Right column: sidebar cards ── */}
          <div className="space-y-6">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="glass-card p-6"
            >
              <h3 className="font-bold text-zinc-800 dark:text-zinc-100 mb-1">Logged in as</h3>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-4 truncate">{user?.email}</p>
              <button
                onClick={logout}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-2xl font-semibold hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all text-sm"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="p-6 bg-zinc-900 rounded-3xl text-white"
            >
              <h3 className="font-bold mb-2">Need Help?</h3>
              <p className="text-sm text-zinc-400 mb-4">
                Contact our support team for any technical assistance.
              </p>
              <button className="text-sm font-semibold text-coral-400 hover:text-coral-300 transition-colors">
                Submit a ticket →
              </button>
            </motion.div>
          </div>
        </div>
      </div>
    </>
  );
}
