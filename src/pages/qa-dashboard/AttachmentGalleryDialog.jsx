import { useState, useEffect } from "react";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import IconButton from "@mui/material/IconButton";
import CircularProgress from "@mui/material/CircularProgress";
import CloseIcon from "@mui/icons-material/Close";
import PhotoLibraryIcon from "@mui/icons-material/PhotoLibrary";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import BrokenImageIcon from "@mui/icons-material/BrokenImage";
import "./AttachmentGalleryDialog.scss";

const AttachmentGalleryDialog = ({ open, onClose, attachments = [] }) => {
  const [index, setIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);

  const total = attachments.length;
  const current = attachments[index] ?? null;

  useEffect(() => {
    if (open) setIndex(0);
  }, [open]);

  useEffect(() => {
    setIsLoading(true);
    setIsError(false);
  }, [open, index, current?.url]);

  const handleBack = () => setIndex((i) => Math.max(i - 1, 0));
  const handleNext = () => setIndex((i) => Math.min(i + 1, total - 1));

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{ className: "agd__paper" }}>
      <div className="agd__header">
        <div className="agd__header-left">
          <PhotoLibraryIcon className="agd__header-icon" />
          <span className="agd__header-title">Attachments</span>
        </div>
        <IconButton size="small" className="agd__close" onClick={onClose}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </div>

      <DialogContent className="agd__content">
        {!current ? (
          <div className="agd__state">
            <BrokenImageIcon sx={{ fontSize: 32 }} />
            <p>No attachments to display.</p>
          </div>
        ) : (
          <>
            <div className="agd__stage">
              {isLoading && !isError && (
                <div className="agd__state">
                  <CircularProgress size={30} />
                  <p>Loading photo...</p>
                </div>
              )}
              {isError && (
                <div className="agd__state">
                  <BrokenImageIcon sx={{ fontSize: 32 }} />
                  <p>Failed to load image.</p>
                </div>
              )}
              <img
                key={current.url}
                src={current.url}
                alt={current.name ?? `Photo ${index + 1}`}
                className="agd__image"
                style={{ display: isLoading || isError ? "none" : "block" }}
                onLoad={() => setIsLoading(false)}
                onError={() => {
                  setIsLoading(false);
                  setIsError(true);
                }}
              />
            </div>

            <div className="agd__caption">
              {current.label && (
                <span className="agd__caption-label">{current.label}</span>
              )}
              {current.name && (
                <span className="agd__caption-name">{current.name}</span>
              )}
            </div>
          </>
        )}
      </DialogContent>

      <DialogActions className="agd__footer">
        <button
          type="button"
          className="agd__btn-nav"
          onClick={handleBack}
          disabled={index === 0 || total === 0}>
          <ChevronLeftIcon sx={{ fontSize: 18 }} />
          <span>Back</span>
        </button>
        <span className="agd__counter">
          {total === 0 ? "0 / 0" : `${index + 1} / ${total}`}
        </span>
        <button
          type="button"
          className="agd__btn-nav"
          onClick={handleNext}
          disabled={index >= total - 1 || total === 0}>
          <span>Next</span>
          <ChevronRightIcon sx={{ fontSize: 18 }} />
        </button>
      </DialogActions>
    </Dialog>
  );
};

export default AttachmentGalleryDialog;
