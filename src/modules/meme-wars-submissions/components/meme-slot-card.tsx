"use client";

import { useEffect, useRef } from "react";
import { ImageIcon, UploadCloud, Trash2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  formatIstDateTime,
} from "../services/meme-wars-submissions.service";
import type {
  MemeSlotNumber,
  MemeSlotSubmission,
  MemeUploadDraft,
} from "../types";

interface MemeSlotCardProps {
  slot: MemeSlotNumber;
  submission: MemeSlotSubmission;
  previewOverrideUrl?: string;
  isBusy: boolean;
  isActionsDisabled: boolean;
  draft?: MemeUploadDraft;
  onServerImageReady?: (slot: MemeSlotNumber) => void;
  onSelectFile: (slot: MemeSlotNumber, file: File) => Promise<void>;
  onDelete: (slot: MemeSlotNumber) => void;
}

export function MemeSlotCard({
  slot,
  submission,
  previewOverrideUrl,
  isBusy,
  isActionsDisabled,
  draft,
  onServerImageReady,
  onSelectFile,
  onDelete,
}: MemeSlotCardProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const hasSubmission = !!submission.fileId;
  const previewUrl = previewOverrideUrl ?? submission.imageUrl;

  useEffect(() => {
    if (!onServerImageReady || !previewOverrideUrl || !submission.imageUrl) {
      return;
    }

    let isCancelled = false;
    const probeImage = new Image();

    probeImage.onload = () => {
      if (isCancelled) {
        return;
      }

      onServerImageReady(slot);
    };

    probeImage.onerror = () => {
      // Keep local preview in place when the remote image is not yet retrievable.
    };

    probeImage.src = submission.imageUrl;

    return () => {
      isCancelled = true;
      probeImage.onload = null;
      probeImage.onerror = null;
    };
  }, [onServerImageReady, previewOverrideUrl, slot, submission.imageUrl]);

  function openFilePicker() {
    fileInputRef.current?.click();
  }

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    await onSelectFile(slot, file);

    // Reset value so selecting the same file again still fires change.
    event.target.value = "";
  }

  return (
    <Card className="space-y-3 p-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-foreground">Slot {slot}</h2>
        {isBusy && (
          <span className="inline-flex items-center gap-1 text-xs text-muted">
            <RefreshCw className="h-3.5 w-3.5 animate-spin" />
            Syncing
          </span>
        )}
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-gray-50">
        {previewUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={previewUrl}
            alt={`Meme submission in slot ${slot}`}
            className="h-44 w-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="flex h-44 flex-col items-center justify-center gap-2 text-muted">
            <ImageIcon className="h-8 w-8" />
            <p className="text-xs">No meme uploaded yet</p>
          </div>
        )}
      </div>

      {submission.submittedAt && (
        <div className="space-y-0.5 rounded-lg bg-primary-50 px-2.5 py-2">
          <p className="text-xs font-medium text-primary-700">
            Uploaded by {submission.submittedByName ?? "Unknown"}
          </p>
          <p className="text-[11px] text-primary-700/90">
            {submission.submittedByEmail ?? "No email"}
          </p>
          <p className="text-[11px] text-primary-700/90">
            {formatIstDateTime(submission.submittedAt)} IST
          </p>
        </div>
      )}

      {!submission.submittedAt && draft?.createdAt && (
        <div className="rounded-lg bg-warning/10 px-2.5 py-2">
          <p className="text-xs font-medium text-warning">Local draft saved</p>
          <p className="text-[11px] text-warning">
            {formatIstDateTime(draft.createdAt)} IST
          </p>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleFileChange}
        disabled={isActionsDisabled}
      />

      <div className="grid grid-cols-2 gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={openFilePicker}
          loading={isBusy}
          disabled={isActionsDisabled && !isBusy}
          className="h-10"
        >
          {hasSubmission ? (
            <>
              <UploadCloud className="h-4 w-4" /> Replace
            </>
          ) : (
            <>
              <UploadCloud className="h-4 w-4" /> Upload
            </>
          )}
        </Button>

        <Button
          type="button"
          variant="destructive"
          onClick={() => onDelete(slot)}
          disabled={!hasSubmission || isActionsDisabled}
          className="h-10"
        >
          <Trash2 className="h-4 w-4" /> Delete
        </Button>
      </div>
    </Card>
  );
}
