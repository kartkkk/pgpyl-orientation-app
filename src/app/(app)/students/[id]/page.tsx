"use client";

import { use } from "react";
import { Mail, Phone, Hash, User } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { SectionBadge, StatusBadge } from "@/components/ui/badge";
import { useAuth } from "@/modules/auth/auth-context";
import { useStudent } from "@/modules/students/hooks/useStudents";
import { getInitials } from "@/lib/utils";
import type { SectionCode } from "@/types";

export default function StudentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { role: viewerRole } = useAuth();
  const { data: student, isLoading } = useStudent(id);
  const showRoleBadge = viewerRole === "admin" || student?.role === "admin";

  if (isLoading || !student) {
    return (
      <>
        <PageHeader title="Student" showBack />
        <div className="flex justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader title="Student Details" showBack />

      <div className="space-y-4 p-4">
        {/* Header card */}
        <Card className="flex flex-col items-center gap-3 py-6">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary-100 text-xl font-bold text-primary-600">
            {getInitials(student.full_name)}
          </div>
          <div className="text-center">
            <h2 className="text-lg font-bold text-foreground">
              {student.full_name}
            </h2>
            <p className="text-sm text-muted">{student.email}</p>
          </div>
          <div className="flex items-center gap-2">
            {student.section?.code && (
              <SectionBadge
                sectionCode={student.section.code as SectionCode}
                size="md"
              />
            )}
            {showRoleBadge && (
              <StatusBadge
                status={student.role}
                variant={student.role === "admin" ? "warning" : "muted"}
              />
            )}
          </div>
        </Card>

        {/* Details card */}
        <Card className="space-y-4">
          <div className="flex items-center gap-3">
            <Mail className="h-4 w-4 text-muted" />
            <div>
              <p className="text-xs text-muted">Email</p>
              <p className="text-sm text-foreground">{student.email}</p>
            </div>
          </div>

          {student.roll_number && (
            <div className="flex items-center gap-3">
              <Hash className="h-4 w-4 text-muted" />
              <div>
                <p className="text-xs text-muted">PG ID</p>
                <p className="text-sm text-foreground">{student.roll_number}</p>
              </div>
            </div>
          )}

          {student.phone_number && (
            <div className="flex items-center gap-3">
              <Phone className="h-4 w-4 text-muted" />
              <div>
                <p className="text-xs text-muted">Phone</p>
                <p className="text-sm text-foreground">{student.phone_number}</p>
              </div>
            </div>
          )}

          {student.about_me && (
            <div className="flex items-start gap-3">
              <User className="mt-0.5 h-4 w-4 text-muted" />
              <div>
                <p className="text-xs text-muted">About</p>
                <p className="text-sm text-foreground">{student.about_me}</p>
              </div>
            </div>
          )}
        </Card>
      </div>
    </>
  );
}
