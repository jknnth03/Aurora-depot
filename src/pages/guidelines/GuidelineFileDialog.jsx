import { useState, useEffect } from "react";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import IconButton from "@mui/material/IconButton";
import CircularProgress from "@mui/material/CircularProgress";
import CloseIcon from "@mui/icons-material/Close";
import DescriptionIcon from "@mui/icons-material/Description";
import DownloadIcon from "@mui/icons-material/Download";
import DownloadingIcon from "@mui/icons-material/Downloading";
import BrokenImageIcon from "@mui/icons-material/BrokenImage";
import "./GuidelineFileDialog.scss";

// TEMP WORKAROUND: backend's file_url comes back as "http://localhost/..."
// (wrong/incomplete APP_URL on the backend .env). Rewrite it to point at the
// actual API host until the backend config is fixed.
const API_ORIGIN = (() => {
  try {
    return new URL(import.meta.env.VITE_API_URL || "").origin;
  } catch {
    return "";
  }
})();

const fixFileUrl = (rawUrl) => {
  if (!rawUrl) return rawUrl;
  try {
    const parsed = new URL(rawUrl);
    if (parsed.hostname === "localhost" && API_ORIGIN) {
      return `${API_ORIGIN}${parsed.pathname}${parsed.search}`;
    }
    return rawUrl;
  } catch {
    return rawUrl;
  }
};

const GuidelineFileDialog = ({ open, onClose, fileUrl, filename }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const resolvedUrl = fixFileUrl(fileUrl);

  useEffect(() => {
    if (open) {
      setIsLoading(true);
      setIsError(false);
    }
  }, [open, fileUrl]);

  const handleDownload = () => {
    if (!resolvedUrl) return;
    const a = document.createElement("a");
    a.href = resolvedUrl;
    a.download = filename ?? "guideline";
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
      PaperProps={{ className: "gfd__paper" }}>
      <div className="gfd__header">
        <div className="gfd__header-title">
          <DescriptionIcon className="gfd__header-icon" />
          <span>{filename ?? "Guideline File"}</span>
        </div>
        <div className="gfd__header-actions">
          {resolvedUrl && (
            <IconButton
              size="small"
              className="gfd__download"
              onClick={handleDownload}
              disabled={isDownloading}>
              {isDownloading ? (
                <DownloadingIcon fontSize="small" />
              ) : (
                <DownloadIcon fontSize="small" />
              )}
            </IconButton>
          )}
          <IconButton className="gfd__close" onClick={onClose} size="small">
            <CloseIcon fontSize="small" />
          </IconButton>
        </div>
      </div>

      <DialogContent className="gfd__content">
        {!resolvedUrl ? (
          <p className="gfd__empty">No file available.</p>
        ) : (
          <>
            {isLoading && !isError && (
              <div className="gfd__loading">
                <CircularProgress size={30} />
                <p>Loading file...</p>
              </div>
            )}
            {isError && (
              <div className="gfd__empty">
                <BrokenImageIcon sx={{ fontSize: 32 }} />
                <p>Failed to load file.</p>
                <a href={resolvedUrl} target="_blank" rel="noreferrer">
                  Open in new tab
                </a>
              </div>
            )}
            <iframe
              src={resolvedUrl}
              title={filename ?? "Guideline File"}
              className="gfd__frame"
              style={{ display: isLoading || isError ? "none" : "block" }}
              onLoad={() => setIsLoading(false)}
              onError={() => {
                setIsLoading(false);
                setIsError(true);
              }}
            />
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default GuidelineFileDialog;
