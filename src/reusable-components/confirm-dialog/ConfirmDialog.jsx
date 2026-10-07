import { useState } from "react";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import "./ConfirmDialog.scss";

const ConfirmDialog = ({
  open,
  onClose,
  onConfirm,
  title = "Are you sure?",
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  isLoading = false,
  isFetching = false,
  confirmVariant = "danger",
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  // loading kapag: may tumatakbong onConfirm, o may ipinasang isLoading/isFetching
  const loading = isSubmitting || isLoading || isFetching;

  const handleConfirm = async () => {
    if (loading || !onConfirm) return;

    setIsSubmitting(true);
    try {
      await onConfirm();
    } finally {
      setIsSubmitting(false);
    }
  };

  // bawal isara habang naglo-load (backdrop click / Esc / cancel)
  const handleClose = (...args) => {
    if (loading) return;
    onClose?.(...args);
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{ className: "cd__paper" }}>
      <DialogContent className="cd__content">
        <div className="cd__icon-wrap">
          <WarningAmberIcon className="cd__icon" />
        </div>

        <h3 className="cd__title">{title}</h3>
        {message && <p className="cd__message">{message}</p>}

        <div className="cd__footer">
          <button
            className="cd__cancel-btn"
            onClick={handleClose}
            disabled={loading}>
            {cancelLabel}
          </button>
          <button
            className={`cd__confirm-btn cd__confirm-btn--${confirmVariant}`}
            onClick={handleConfirm}
            disabled={loading}>
            {loading ? "Processing..." : confirmLabel}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ConfirmDialog;
