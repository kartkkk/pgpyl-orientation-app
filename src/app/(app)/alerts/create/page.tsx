"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { useCreateNotification } from "@/modules/notifications/hooks/useNotifications";
import { useSectionMap } from "@/modules/students/hooks/useStudents";
import { SECTIONS, SECTION_CODES } from "@/lib/constants";
import { haptics } from "@/lib/haptics";
import { getFriendlyErrorMessage } from "@/lib/utils";
import type { VisibilityScope } from "@/types";

export default function CreateAlertPage() {
    const router = useRouter();
    const createNotification = useCreateNotification();
    const sectionMap = useSectionMap();

    const [form, setForm] = useState({
        title: "",
        body: "",
        visibility: "all" as VisibilityScope,
        scheduled_at: "",
        section_ids: [] as string[],
    });

    const update = (field: string, value: unknown) => setForm((prev) => ({ ...prev, [field]: value }));

    const toggleSection = (sectionId: string) => {
        setForm((prev) => ({
            ...prev,
            section_ids: prev.section_ids.includes(sectionId)
                ? prev.section_ids.filter((id) => id !== sectionId)
                : [...prev.section_ids, sectionId],
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (createNotification.isPending) return;

        try {
            await createNotification.mutateAsync({
                title: form.title,
                body: form.body,
                visibility: form.visibility,
                scheduled_at: form.scheduled_at ? new Date(form.scheduled_at).toISOString() : undefined,
                section_ids: form.section_ids,
                profile_ids: [],
                deep_link: undefined,
                event_id: undefined,
            });
            haptics.success();
            router.push("/alerts");
        } catch {
            haptics.error();
            // Error handled by mutation
        }
    };

    // Character limits based on push notification best practices
    const TITLE_MAX = 50;  // Short, punchy titles
    const BODY_MAX = 200;  // Most platforms (Android, iOS, web)

    const titleLength = form.title.length;
    const bodyLength = form.body.length;
    const isValid =
        form.title.trim() &&
        form.body.trim() &&
        titleLength <= TITLE_MAX &&
        bodyLength <= BODY_MAX &&
        (form.visibility !== "section" || form.section_ids.length > 0);

    return (
        <>
            <PageHeader title="Create Alert" showBack />

            <form onSubmit={handleSubmit} className="space-y-4 p-4">
                <div>
                    <Input
                        label="Title"
                        placeholder="Enter a title"
                        value={form.title}
                        onChange={(e) => update("title", e.target.value)}
                        maxLength={TITLE_MAX}
                        required
                    />
                    <div className="mt-1 flex justify-end">
                        <span className={`text-xs ${
                            titleLength > TITLE_MAX * 0.9
                                ? "text-orange-500 font-medium"
                                : "text-muted"
                        }`}>
                            {titleLength}/{TITLE_MAX}
                        </span>
                    </div>
                </div>

                <div className="space-y-1.5">
                    <label className="block text-sm font-medium text-foreground">Body</label>
                    <textarea
                        placeholder="Enter a body"
                        value={form.body}
                        onChange={(e) => update("body", e.target.value)}
                        maxLength={BODY_MAX}
                        rows={3}
                        required
                        className="w-full rounded-xl border border-border px-3.5 py-3 text-sm placeholder:text-muted focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                    />
                    <div className="mt-1 flex justify-end">
                        <span className={`text-xs ${
                            bodyLength > BODY_MAX * 0.9
                                ? "text-orange-500 font-medium"
                                : "text-muted"
                        }`}>
                            {bodyLength}/{BODY_MAX}
                        </span>
                    </div>
                </div>

                <Input
                    label="Scheduled date and time"
                    type="datetime-local"
                    value={form.scheduled_at}
                    onChange={(e) => update("scheduled_at", e.target.value)}
                    helperText="Leave empty to send the alert immediately, or pick a date and time to schedule it for later"
                />

                {/* Visibility */}
                <div className="space-y-2">
                    <label className="block text-sm font-medium text-foreground">Send to</label>
                    <div className="flex gap-2">
                        {(["all", "section"] as VisibilityScope[]).map((v) => (
                            <button
                                key={v}
                                type="button"
                                onClick={() => update("visibility", v)}
                                className={`rounded-full px-4 py-1.5 text-xs font-medium capitalize transition-colors ${
                                    form.visibility === v ? "bg-primary-500 text-white" : "bg-gray-100 text-muted"
                                }`}>
                                {v === "all" ? "Everyone" : "By Section"}
                            </button>
                        ))}
                    </div>
                </div>

                {form.visibility === "section" && (
                    <Card className="space-y-2">
                        <p className="text-xs font-medium text-muted">Select sections</p>
                        <div className="flex flex-wrap gap-2">
                            {SECTION_CODES.map((code) => {
                                const entry = sectionMap.get(code);
                                if (!entry) return null;
                                const meta = SECTIONS[code];
                                const isSelected = form.section_ids.includes(entry.id);
                                return (
                                    <button
                                        key={entry.id}
                                        type="button"
                                        onClick={() => toggleSection(entry.id)}
                                        className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                                            isSelected ? "text-white" : "bg-gray-100 text-muted"
                                        }`}
                                        style={isSelected ? { backgroundColor: meta.color } : undefined}>
                                        <span>{meta.emoji}</span>
                                        <span>{meta.name}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </Card>
                )}

                {createNotification.isError && (
                    <div className="rounded-xl bg-red-50 px-4 py-3">
                        <p className="text-sm font-medium text-red-800">
                            {getFriendlyErrorMessage(createNotification.error?.message || "Failed to create notification")}
                        </p>
                    </div>
                )}

                {(titleLength > TITLE_MAX || bodyLength > BODY_MAX) && (
                    <div className="rounded-xl bg-yellow-50 px-4 py-3">
                        <p className="text-sm font-medium text-yellow-800">
                            {titleLength > TITLE_MAX && `Title must be ${TITLE_MAX} characters or less. `}
                            {bodyLength > BODY_MAX && `Body must be ${BODY_MAX} characters or less.`}
                        </p>
                    </div>
                )}

                <Button type="submit" loading={createNotification.isPending} disabled={!isValid}>
                    {form.scheduled_at ? "Schedule Alert" : "Send Now"}
                </Button>
            </form>
        </>
    );
}
