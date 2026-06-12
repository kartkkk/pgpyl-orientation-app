import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchAdmins,
  fetchPromotableStudents,
  promoteToAdmin,
  demoteToStudent,
} from "../services/admin.service";
import { useAuth } from "@/modules/auth/auth-context";

const ADMINS_KEY = "admins";
const PROMOTABLE_KEY = "promotable-students";
const STUDENTS_KEY = "students";

export function useAdmins() {
  return useQuery({
    queryKey: [ADMINS_KEY],
    queryFn: fetchAdmins,
  });
}

export function usePromotableStudents(search?: string) {
  return useQuery({
    queryKey: [PROMOTABLE_KEY, search],
    queryFn: () => fetchPromotableStudents(search),
  });
}

export function usePromoteToAdmin() {
  const qc = useQueryClient();
  const { profile } = useAuth();
  return useMutation({
    mutationFn: (profileId: string) => promoteToAdmin(profileId, profile!.id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [ADMINS_KEY] });
      qc.invalidateQueries({ queryKey: [PROMOTABLE_KEY] });
      qc.invalidateQueries({ queryKey: [STUDENTS_KEY] });
    },
  });
}

export function useDemoteToStudent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      profileId,
      sectionId,
    }: {
      profileId: string;
      sectionId: string;
    }) => demoteToStudent(profileId, sectionId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [ADMINS_KEY] });
      qc.invalidateQueries({ queryKey: [PROMOTABLE_KEY] });
      qc.invalidateQueries({ queryKey: [STUDENTS_KEY] });
    },
  });
}
