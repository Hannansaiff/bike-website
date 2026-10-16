import { useState } from 'react';
import { AlertTriangle, Loader2 } from 'lucide-react';
import Modal from './Modal';

/** Confirmation before destructive or irreversible actions. onConfirm may be async. */
export default function ConfirmDialog({
  open,
  title = 'Are you sure?',
  message,
  confirmLabel = 'Delete',
  tone = 'danger',
  onConfirm,
  onCancel,
  children,
}) {
  const [busy, setBusy] = useState(false);

  const handleConfirm = async () => {
    setBusy(true);
    try {
      await onConfirm?.();
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={busy ? undefined : onCancel}
      title={title}
      size="sm"
      footer={
        <>
          <button className="a-btn" onClick={onCancel} disabled={busy}>
            Cancel
          </button>
          <button className={tone === 'danger' ? 'btn-danger' : 'btn-primary'} onClick={handleConfirm} disabled={busy}>
            {busy && <Loader2 className="h-4 w-4 animate-spin" />}
            {confirmLabel}
          </button>
        </>
      }
    >
      <div className="flex gap-3">
        <span
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
            tone === 'danger' ? 'bg-red-500/10 text-tail' : 'bg-ignite/10 text-ignite'
          }`}
        >
          <AlertTriangle className="h-5 w-5" />
        </span>
        <div className="text-sm text-zinc-600 dark:text-bone/80">
          {message}
          {children}
        </div>
      </div>
    </Modal>
  );
}
