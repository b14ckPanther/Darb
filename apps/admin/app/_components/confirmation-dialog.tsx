"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";

import { AlertCircleIcon, CancelIcon } from "@darb/icons";

interface ConfirmationDialogProps {
  children: ReactNode;
  description: string;
  onClose: () => void;
  open: boolean;
  pending?: boolean;
  title: string;
}

export function ConfirmationDialog({
  children,
  description,
  onClose,
  open,
  pending = false,
  title,
}: ConfirmationDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open && !dialog.open) {
      returnFocusRef.current = document.activeElement as HTMLElement | null;
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const handleClose = () => {
      returnFocusRef.current?.focus();
      returnFocusRef.current = null;
    };
    const handleCancel = (event: Event) => {
      event.preventDefault();
      if (!pending) onClose();
    };

    dialog.addEventListener("close", handleClose);
    dialog.addEventListener("cancel", handleCancel);
    return () => {
      dialog.removeEventListener("close", handleClose);
      dialog.removeEventListener("cancel", handleCancel);
    };
  }, [onClose, pending]);

  return (
    <dialog
      ref={dialogRef}
      className="confirmation-dialog"
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
    >
      <div className="confirmation-dialog__topline">
        <span className="confirmation-dialog__icon">
          <AlertCircleIcon size={22} />
        </span>
        <button
          type="button"
          className="confirmation-dialog__close"
          aria-label="Close confirmation"
          disabled={pending}
          onClick={onClose}
        >
          <CancelIcon size={20} />
        </button>
      </div>
      <h2 id={titleId}>{title}</h2>
      <p id={descriptionId}>{description}</p>
      <div className="confirmation-dialog__actions">{children}</div>
    </dialog>
  );
}
