"use client";
import * as Dialog from "@radix-ui/react-dialog";
import * as AlertDialog from "@radix-ui/react-alert-dialog";
import { X } from "lucide-react";
import { Button } from "./button";
export function Modal({
  open,
  onOpenChange,
  title,
  description,
  children,
  restoreFocus,
  focusOnOpen,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  restoreFocus?: () => void;
  focusOnOpen?: () => void;
}) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="modal-overlay" />
        <Dialog.Content
          className="modal-content"
          onOpenAutoFocus={
            focusOnOpen
              ? (event) => {
                  event.preventDefault();
                  focusOnOpen();
                }
              : undefined
          }
          onCloseAutoFocus={
            restoreFocus
              ? (event) => {
                  event.preventDefault();
                  restoreFocus();
                }
              : undefined
          }
        >
          <Dialog.Title className="modal-title">{title}</Dialog.Title>
          <Dialog.Description className="muted">
            {description ?? "Manage your Aptmark workspace."}
          </Dialog.Description>
          <Dialog.Close
            className="icon-button modal-close"
            aria-label="Close dialog"
          >
            <X size={18} />
          </Dialog.Close>
          {children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export function SubmissionConfirmation({
  open,
  onOpenChange,
  title,
  actionLabel,
  busy,
  error,
  onConfirm,
  restoreFocus,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  actionLabel: string;
  busy: boolean;
  error: string;
  onConfirm: () => Promise<void>;
  restoreFocus: () => void;
  children: React.ReactNode;
}) {
  return (
    <AlertDialog.Root
      open={open}
      onOpenChange={(next) => !busy && onOpenChange(next)}
    >
      <AlertDialog.Portal>
        <AlertDialog.Overlay className="modal-overlay" />
        <AlertDialog.Content
          className="modal-content"
          onEscapeKeyDown={(event) => {
            if (busy) event.preventDefault();
          }}
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            restoreFocus();
          }}
        >
          <AlertDialog.Title className="modal-title">{title}</AlertDialog.Title>
          <AlertDialog.Description className="muted">
            Submission locks your answers. You will not be able to change this
            submitted work.
          </AlertDialog.Description>
          {children}
          {error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}
          <div className="summary-actions">
            <AlertDialog.Cancel asChild>
              <Button variant="secondary" disabled={busy}>
                Return to review
              </Button>
            </AlertDialog.Cancel>
            <AlertDialog.Action asChild>
              <Button
                disabled={busy}
                onClick={(event) => {
                  event.preventDefault();
                  void onConfirm();
                }}
              >
                {busy ? "Saving…" : actionLabel}
              </Button>
            </AlertDialog.Action>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}
