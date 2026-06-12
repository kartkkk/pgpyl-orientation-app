"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { useUpdateScore } from "@/modules/leaderboard/hooks/useLeaderboard";
import { SECTIONS } from "@/lib/constants";
import type { LeaderboardEntry, SectionCode } from "@/types";

type UpdateMode = "adjust" | "set";

interface ScoreEditFormProps {
  entry: LeaderboardEntry;
  onClose: () => void;
}

export function ScoreEditForm({ entry, onClose }: ScoreEditFormProps) {
  const [mode, setMode] = useState<UpdateMode>("adjust");
  const [operation, setOperation] = useState<"add" | "subtract">("add");
  const [value, setValue] = useState("");
  const [reason, setReason] = useState("");
  const [confirming, setConfirming] = useState(false);
  const updateScore = useUpdateScore();
  const { toast } = useToast();

  const code = entry.section?.code as SectionCode | undefined;
  const section = code ? SECTIONS[code] : null;
  const sectionName = section?.name ?? "Unknown";

  const parsed = parseInt(value, 10);
  const isWholeNumber = value === parsed.toString();
  const isValid =
    !isNaN(parsed) &&
    isWholeNumber &&
    reason.trim().length > 0 &&
    (mode === "adjust"
      ? parsed > 0 && parsed <= 1000
      : parsed >= 0 && parsed <= 1000);

  const confirmMessage =
    mode === "adjust"
      ? operation === "add"
        ? `Add ${parsed} points to ${sectionName}?`
        : `Subtract ${parsed} points from ${sectionName}?`
      : `Set ${sectionName} score to ${parsed}? (currently ${entry.score})`;

  const handleConfirm = async () => {
    try {
      const scoreValue = mode === "adjust"
        ? operation === "add" ? parsed : -parsed
        : parsed;

      await updateScore.mutateAsync({
        sectionId: entry.section_id,
        score: scoreValue,
        mode,
        reason: reason.trim(),
      });
      toast("Score updated", "success");
      onClose();
    } catch {
      toast("Failed to update score", "error");
    }
    setConfirming(false);
  };

  return (
    <div className="mt-3 space-y-3 border-t border-border pt-3">
      {/* Mode toggle */}
      <div className="flex rounded-lg bg-gray-100 p-0.5">
        {(["adjust", "set"] as const).map((m) => (
          <button
            key={m}
            onClick={() => {
              setMode(m);
              setValue("");
            }}
            className={`flex-1 rounded-md py-1.5 text-xs font-medium transition-colors ${
              mode === m
                ? "bg-white text-gray-900 shadow-sm"
                : "text-muted"
            }`}
          >
            {m === "adjust" ? "Adjust" : "Set"}
          </button>
        ))}
      </div>

      {/* Mode explanation */}
      <p className="text-xs text-muted">
        {mode === "adjust"
          ? "This adds or subtracts points from the current score."
          : "This replaces the current score with a new score."}
      </p>

      {/* Value input */}
      <div>
        {mode === "adjust" ? (
          <div className="space-y-2">
            {/* Operation toggle */}
            <div className="flex rounded-lg bg-gray-50 p-0.5">
              {(["add", "subtract"] as const).map((op) => (
                <button
                  key={op}
                  onClick={() => setOperation(op)}
                  className={`flex-1 rounded-md py-1.5 text-xs font-medium transition-colors ${
                    operation === op
                      ? "bg-white text-gray-900 shadow-sm"
                      : "text-muted"
                  }`}
                >
                  {op === "add" ? "Add" : "Subtract"}
                </button>
              ))}
            </div>
            <Input
              placeholder="Enter a point value"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              type="number"
              min="1"
              max="1000"
            />
          </div>
        ) : (
          <div className="space-y-2">
            <Input
              placeholder="Enter a new score"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              type="number"
              min="0"
              max="1000"
            />
            <p className="text-xs text-muted">
              Current score: {entry.score}
            </p>
          </div>
        )}

        {/* Validation errors */}
        {value && !isWholeNumber && (
          <p className="mt-1 text-xs text-red-600">
            Please enter a whole number.
          </p>
        )}
        {value && parsed > 1000 && (
          <p className="mt-1 text-xs text-red-600">
            Value cannot exceed 1000.
          </p>
        )}
        {mode === "adjust" && value && parsed < 1 && (
          <p className="mt-1 text-xs text-red-600">
            Please enter a value greater than 0.
          </p>
        )}
      </div>

      {/* Reason */}
      <Input
        placeholder="Specify the event for which you're awarding or deducting points."
        value={reason}
        onChange={(e) => setReason(e.target.value)}
      />

      {/* Actions */}
      <div className="flex gap-2">
        <Button variant="outline" onClick={onClose} fullWidth>
          Cancel
        </Button>
        <Button
          onClick={() => setConfirming(true)}
          disabled={!isValid}
          loading={updateScore.isPending}
          fullWidth
        >
          Save
        </Button>
      </div>

      {/* Confirmation modal */}
      <Modal
        isOpen={confirming}
        onClose={() => setConfirming(false)}
        title="Confirm Score Change"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-700">{confirmMessage}</p>
          {reason.trim() && (
            <p className="text-xs text-muted italic">
              Reason: {reason.trim()}
            </p>
          )}
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setConfirming(false)}
              fullWidth
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirm}
              loading={updateScore.isPending}
              fullWidth
            >
              Confirm
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
