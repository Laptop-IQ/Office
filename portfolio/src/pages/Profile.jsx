// pages/Profile.jsx
import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import {
  UserCircleIcon,
  CameraIcon,
  TrashIcon,
  KeyIcon,
  PencilSquareIcon,
  ArrowLeftIcon,
} from "@heroicons/react/24/outline";

export default function Profile() {
  const {
    user,
    updateProfile,
    updatePassword,
    updateProfilePhoto,
    removeProfilePhoto,
    deleteAccount,
  } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [profileForm, setProfileForm] = useState({
    name: user?.name || "",
    email: user?.email || "",
  });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [profileLoading, setProfileLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [photoLoading, setPhotoLoading] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setProfileLoading(true);
    await updateProfile(profileForm);
    setProfileLoading(false);
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordError("");
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError("New passwords do not match");
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      setPasswordError("Password must be at least 6 characters");
      return;
    }
    setPasswordLoading(true);
    const result = await updatePassword(
      passwordForm.currentPassword,
      passwordForm.newPassword,
    );
    if (result?.success) {
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    }
    setPasswordLoading(false);
  };

  const handlePhotoChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setPhotoLoading(true);
    await updateProfilePhoto(file);
    setPhotoLoading(false);
  };

  const handleRemovePhoto = async () => {
    setPhotoLoading(true);
    await removeProfilePhoto();
    setPhotoLoading(false);
  };

  const handleDeleteAccount = async () => {
    await deleteAccount();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Back Button */}
        <button
          onClick={() => navigate("/dashboard")}
          className="flex items-center text-gray-600 hover:text-blue-600 mb-6 transition-colors"
        >
          <ArrowLeftIcon className="w-4 h-4 mr-1" />
          Back to Dashboard
        </button>

        <h1 className="text-2xl font-bold text-gray-900 mb-6">My Profile</h1>

        {/* Profile Photo Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <CameraIcon className="w-5 h-5 text-blue-600" />
            Profile Photo
          </h2>
          <div className="flex items-center gap-6">
            <div className="relative">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center overflow-hidden">
                {user?.profilePic ? (
                  <img
                    src={user.profilePic}
                    alt={user.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-3xl font-bold text-white">
                    {user?.name?.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              {photoLoading && (
                <div className="absolute inset-0 bg-black bg-opacity-40 rounded-full flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handlePhotoChange}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={photoLoading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                Upload New Photo
              </button>
              {user?.profilePic && (
                <button
                  onClick={handleRemovePhoto}
                  disabled={photoLoading}
                  className="px-4 py-2 border border-red-200 text-red-600 rounded-lg text-sm font-medium hover:bg-red-50 disabled:opacity-50 transition-colors"
                >
                  Remove Photo
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Edit Profile Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <PencilSquareIcon className="w-5 h-5 text-blue-600" />
            Edit Profile
          </h2>
          <form onSubmit={handleProfileSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Full Name
              </label>
              <input
                type="text"
                value={profileForm.name}
                onChange={(e) =>
                  setProfileForm({ ...profileForm, name: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                placeholder="Enter your name"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <input
                type="email"
                value={profileForm.email}
                onChange={(e) =>
                  setProfileForm({ ...profileForm, email: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                placeholder="Enter your email"
                required
              />
            </div>
            <button
              type="submit"
              disabled={profileLoading}
              className="w-full py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
            >
              {profileLoading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : null}
              {profileLoading ? "Saving..." : "Save Changes"}
            </button>
          </form>
        </div>

        {/* Change Password Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <KeyIcon className="w-5 h-5 text-blue-600" />
            Change Password
          </h2>
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Current Password
              </label>
              <input
                type="password"
                value={passwordForm.currentPassword}
                onChange={(e) =>
                  setPasswordForm({
                    ...passwordForm,
                    currentPassword: e.target.value,
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                placeholder="Enter current password"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                New Password
              </label>
              <input
                type="password"
                value={passwordForm.newPassword}
                onChange={(e) =>
                  setPasswordForm({
                    ...passwordForm,
                    newPassword: e.target.value,
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                placeholder="Enter new password"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Confirm New Password
              </label>
              <input
                type="password"
                value={passwordForm.confirmPassword}
                onChange={(e) =>
                  setPasswordForm({
                    ...passwordForm,
                    confirmPassword: e.target.value,
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                placeholder="Confirm new password"
                required
              />
            </div>
            {passwordError && (
              <p className="text-red-500 text-sm">{passwordError}</p>
            )}
            <button
              type="submit"
              disabled={passwordLoading}
              className="w-full py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
            >
              {passwordLoading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : null}
              {passwordLoading ? "Updating..." : "Update Password"}
            </button>
          </form>
        </div>

        {/* Danger Zone Card */}
        <div className="bg-white rounded-xl shadow-sm border border-red-100 p-6">
          <h2 className="text-lg font-semibold text-red-600 mb-2 flex items-center gap-2">
            <TrashIcon className="w-5 h-5" />
            Danger Zone
          </h2>
          <p className="text-sm text-gray-500 mb-4">
            Once you delete your account, there is no going back. Please be
            certain.
          </p>
          {!showDeleteConfirm ? (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="px-4 py-2 border border-red-400 text-red-600 rounded-lg text-sm font-medium hover:bg-red-50 transition-colors"
            >
              Delete My Account
            </button>
          ) : (
            <div className="flex gap-3">
              <button
                onClick={handleDeleteAccount}
                className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
              >
                Yes, Delete Account
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
