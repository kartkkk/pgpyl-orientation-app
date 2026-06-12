"use client";

import { useEffect, useRef } from "react";
import { X } from "lucide-react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

export function Modal({ isOpen, onClose, title, children }: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen && !dialog.open) {
      dialog.showModal();
    } else if (!isOpen && dialog.open) {
      dialog.close();
    }
  }, [isOpen]);

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      onCancel={onClose}
      className="fixed inset-0 m-0 h-full w-full max-h-full max-w-full bg-transparent p-0 backdrop:bg-black/40"
    >
      {/* Bottom sheet container */}
      <div className="flex h-full items-end">
        <div className="w-full rounded-t-2xl bg-white pb-[env(safe-area-inset-bottom)]">
          {/* Handle */}
          <div className="flex justify-center pt-2 pb-1">
            <div className="h-1 w-10 rounded-full bg-gray-200" />
          </div>
          {/* Header */}
          {title && (
            <div className="flex items-center justify-between border-b border-border px-4 py-2">
              <h2 className="text-base font-semibold">{title}</h2>
              <button
                onClick={onClose}
                aria-label="Close"
                className="flex h-11 w-11 items-center justify-center rounded-full active:bg-gray-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          )}
          <div className="max-h-[70dvh] overflow-y-auto overscroll-contain px-4 pb-4 pt-2">
            {children}
          </div>
        </div>
      </div>
    </dialog>
  );
}
