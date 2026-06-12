"use client";

import { useState } from "react";
import { LogOut, Phone, User } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Input } from "@/components/ui/input";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useAuth } from "@/modules/auth/auth-context";
import { useUpdateMyProfile } from "@/modules/profile/hooks/useProfile";
import { haptics } from "@/lib/haptics";
import { getInitials } from "@/lib/utils";

export default function ProfilePage() {
  const { profile, logout } = useAuth();
  const updateProfile = useUpdateMyProfile();

  const [isEditing, setIsEditing] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState(profile?.phone_number ?? "");
  const [aboutMe, setAboutMe] = useState(profile?.about_me ?? "");
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  if (!profile) {
    return (
      <>
        <PageHeader title="Profile" showBack />
        <div className="flex justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      </>
    );
  }

  function handleSave() {
    updateProfile.mutate(
      { phone_number: phoneNumber || undefined, about_me: aboutMe || undefined },
      {
        onSuccess: () => setIsEditing(false),
      },
    );
  }

  function handleCancel() {
    setPhoneNumber(profile?.phone_number ?? "");
    setAboutMe(profile?.about_me ?? "");
    setIsEditing(false);
  }

  async function handleSignOut() {
    setIsSigningOut(true);
    try {
      await logout();
      haptics.success();
    } catch {
      haptics.error();
    } finally {
      setShowSignOutConfirm(false);
      setIsSigningOut(false);
    }
  }

  return (
    <>
      <PageHeader
        title="Profile"
        showBack
        action={
          !isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="text-sm font-medium text-primary-500 active:text-primary-600 min-h-[44px] flex items-center"
            >
              Edit
            </button>
          ) : undefined
        }
      />

      <div className="space-y-4 p-4">
        {/* Avatar + name */}
        <Card className="flex flex-col items-center gap-3 py-6">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary-100 text-xl font-bold text-primary-600">
            {getInitials(profile.full_name)}
          </div>
          <div className="text-center">
            <h2 className="text-lg font-bold text-foreground">
              {profile.full_name}
            </h2>
            <p className="text-sm text-muted">{profile.email}</p>
          </div>
          {profile.roll_number && (
            <p className="text-xs text-muted">Roll: {profile.roll_number}</p>
          )}
        </Card>

        {/* Editable fields */}
        <Card className="space-y-4">
          {isEditing ? (
            <>
              <Input
                label="Phone Number"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="Enter a phone number"
                type="tel"
              />
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-foreground">
                  About Me
                </label>
                <textarea
                  value={aboutMe}
                  onChange={(e) => setAboutMe(e.target.value)}
                  placeholder="Enter a short bio"
                  rows={3}
                  className="w-full rounded-xl border border-border px-3.5 py-3 text-sm transition-colors placeholder:text-muted focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                />
              </div>
              <div className="flex gap-3">
                <Button variant="outline" onClick={handleCancel}>
                  Cancel
                </Button>
                <Button loading={updateProfile.isPending} onClick={handleSave}>
                  Save
                </Button>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-muted" />
                <div>
                  <p className="text-xs text-muted">Phone</p>
                  <p className="text-sm text-foreground">
                    {profile.phone_number || "Not set"}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <User className="mt-0.5 h-4 w-4 text-muted" />
                <div>
                  <p className="text-xs text-muted">About Me</p>
                  <p className="text-sm text-foreground">
                    {profile.about_me || "Not set"}
                  </p>
                </div>
              </div>
            </>
          )}
        </Card>

        {/* Sign out */}
        <Button variant="destructive" onClick={() => setShowSignOutConfirm(true)}>
          <LogOut className="h-4 w-4" />
          Sign Out
        </Button>
      </div>

      <ConfirmDialog
        isOpen={showSignOutConfirm}
        title="Sign Out"
        description="You will need to sign in again to access the app."
        confirmLabel="Sign Out"
        tone="danger"
        isLoading={isSigningOut}
        onCancel={() => setShowSignOutConfirm(false)}
        onConfirm={handleSignOut}
      />
    </>
  );
}
