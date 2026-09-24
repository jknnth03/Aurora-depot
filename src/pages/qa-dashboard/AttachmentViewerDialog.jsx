import { useState, useEffect } from "react";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import IconButton from "@mui/material/IconButton";
import CircularProgress from "@mui/material/CircularProgress";
import CloseIcon from "@mui/icons-material/Close";
import AttachFileIcon from "@mui/icons-material/AttachFile";
import DownloadIcon from "@mui/icons-material/Download";
import DownloadingIcon from "@mui/icons-material/Downloading";
import BrokenImageIcon from "@mui/icons-material/BrokenImage";
import "./AttachmentViewerDialog.scss";

const downloadFile = async (url, filename) => {
  const response = await fetch(url, { mode: "cors" });
  const blob = await response.blob();
  const objectUrl = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = objectUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(objectUrl);
};

const AttachmentViewerDialog = ({ open, onClose, attachment }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const url = attachment?.url ?? null;
  const urlFilename = url ? url.split("/").pop().split("?")[0] : null;
  const filename = attachment?.name ?? urlFilename;
  const isImage = filename?.match(/\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i);
  const isPdf = filename?.match(/\.pdf$/i);

  useEffect(() => {
    if (open) {
      setIsLoading(true);
      setIsError(false);
    }
  }, [open, url]);

  const handleDownload = () => {
    if (!url) return;
    const a = document.createElement("a");
    a.href = url;
    a.download = attachment?.name ?? filename ?? "attachment";
    a.target = "_blank";
    a.rel = "noreferrer";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{ className: "avd__paper" }}>
      <div className="avd__header">
        <div className="avd__header-left">
          <span className="avd__header-iconwrap">
            <AttachFileIcon className="avd__header-icon" />
          </span>
          <span className="avd__header-title">
            {attachment?.name ?? filename ?? "Attachment"}
          </span>
        </div>
        <div className="avd__header-right">
          {url && (
            <IconButton
              size="small"
              className="avd__download"
              onClick={handleDownload}
              disabled={isDownloading}>
              {isDownloading ? (
                <DownloadingIcon fontSize="small" />
              ) : (
                <DownloadIcon fontSize="small" />
              )}
            </IconButton>
          )}
          <IconButton size="small" className="avd__close" onClick={onClose}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </div>
      </div>

      <DialogContent className="avd__content">
        {!url ? (
          <div className="avd__empty">
            <BrokenImageIcon sx={{ fontSize: 32 }} />
            <p>No attachment to display.</p>
          </div>
        ) : isPdf ? (
          <iframe src={url} className="avd__iframe" title={filename} />
        ) : isImage ? (
          <div className="avd__image-wrapper">
            {isLoading && !isError && (
              <div className="avd__loading">
                <CircularProgress size={30} />
                <p>Loading attachment...</p>
              </div>
            )}
            {isError && (
              <div className="avd__empty">
                <BrokenImageIcon sx={{ fontSize: 32 }} />
                <p>Failed to load image.</p>
              </div>
            )}
            <img
              src={url}
              alt={attachment?.name ?? filename}
              className="avd__image"
              style={{ display: isLoading || isError ? "none" : "block" }}
              onLoad={() => setIsLoading(false)}
              onError={() => {
                setIsLoading(false);
                setIsError(true);
              }}
            />
          </div>
        ) : (
          <div className="avd__unsupported">
            <AttachFileIcon sx={{ fontSize: 32 }} />
            <p>Preview not available for this file type.</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AttachmentViewerDialog;
