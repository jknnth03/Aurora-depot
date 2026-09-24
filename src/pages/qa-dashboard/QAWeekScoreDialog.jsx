import { useState, useEffect, useMemo } from "react";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import IconButton from "@mui/material/IconButton";
import CircularProgress from "@mui/material/CircularProgress";
import CloseIcon from "@mui/icons-material/Close";
import AssessmentIcon from "@mui/icons-material/Assessment";
import DrawIcon from "@mui/icons-material/Draw";
import BlockIcon from "@mui/icons-material/Block";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import PhotoLibraryIcon from "@mui/icons-material/PhotoLibrary";
import {
  useSignWeeklyRecordMutation,
  useGetMyChecklistWeeklyRecordQuery,
} from "../../features/api/qa-dashboard/qaDashboardApi";
import SignatureDialog from "./SignatureDialog";
import AttachmentGalleryDialog from "./AttachmentGalleryDialog";
import "./QAWeekScoreDialog.scss";

const getScoreColor = (score) => {
  if (score == null) return "#a07858";
  if (score >= 90) return "#7bc67e";
  if (score >= 75) return "#4db6ac";
  if (score >= 50) return "#f5a96b";
  return "#e05252";
};

const formatLabel = (str) =>
  str.replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

const naText = (val) =>
  val != null && String(val).trim() !== "" ? val : "N/A";

const API_ORIGIN = (() => {
  try {
    return new URL(import.meta.env.VITE_API_URL || "").origin;
  } catch {
    return "";
  }
})();

const fixAttachmentUrl = (rawUrl) => {
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

const getFilenameFromUrl = (url) => {
  if (!url) return null;
  try {
    const last = new URL(url).pathname.split("/").filter(Boolean).pop();
    return last ? decodeURIComponent(last) : null;
  } catch {
    const last = String(url).split("?")[0].split("/").filter(Boolean).pop();
    return last || null;
  }
};

const parseAttachmentList = (value) => {
  if (Array.isArray(value)) return value;
  if (typeof value === "string" && value.trim().startsWith("[")) {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
};

const toAttachmentUrl = (item) => {
  if (!item) return null;
  if (typeof item === "string") return item;
  return item.url ?? item.attachment_url ?? item.file_url ?? item.path ?? null;
};

const getQuestionAnswers = (question) => {
  if (question?.answer) return [question.answer];
  const answers = question?.answers;
  if (!answers) return [];
  if (answers.score_grading_id !== undefined) return [answers];
  return Object.values(answers).filter(
    (answer) => answer && typeof answer === "object",
  );
};

const collectAttachments = (record) => {
  const items = [];
  const seen = new Set();
  (record?.sections ?? []).forEach((section) => {
    (section.questions ?? []).forEach((question) => {
      getQuestionAnswers(question).forEach((answer) => {
        const rawList =
          [answer.attachment_urls, answer.attachments]
            .map(parseAttachmentList)
            .find((list) => list.length > 0) ??
          (answer.attachment_url ? [answer.attachment_url] : []);
        rawList.forEach((item) => {
          const url = fixAttachmentUrl(toAttachmentUrl(item));
          if (!url || seen.has(url)) return;
          seen.add(url);
          items.push({
            url,
            name: getFilenameFromUrl(url),
            label: question.name ?? null,
          });
        });
      });
    });
  });
  return items;
};

const QAWeekScoreDialog = ({ open, onClose, weeklyRecord, checklistId }) => {
  const [signatureDialogOpen, setSignatureDialogOpen] = useState(false);
  const [refuseConfirmOpen, setRefuseConfirmOpen] = useState(false);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [localSignature, setLocalSignature] = useState({
    signature_url: null,
    signature_refused: false,
    signed_at: null,
  });

  const [signWeeklyRecord, { isLoading: isRefusing }] =
    useSignWeeklyRecordMutation();

  useEffect(() => {
    setLocalSignature({
      signature_url: fixAttachmentUrl(weeklyRecord?.signature_url) ?? null,
      signature_refused: weeklyRecord?.signature_refused ?? false,
      signed_at: weeklyRecord?.signed_at ?? null,
    });
  }, [weeklyRecord?.id]);

  const resolvedChecklistId = checklistId ?? weeklyRecord?.area_checklist_id;

  const {
    data: recordData,
    isFetching: isRecordFetching,
    isError: isRecordError,
  } = useGetMyChecklistWeeklyRecordQuery(
    { id: resolvedChecklistId, recordId: weeklyRecord?.id },
    { skip: !open || !resolvedChecklistId || !weeklyRecord?.id },
  );

  const attachments = useMemo(
    () => collectAttachments(recordData?.data ?? recordData),
    [recordData],
  );

  if (!weeklyRecord) return null;

  const attachmentCountText = isRecordFetching
    ? "Loading attachments..."
    : isRecordError
      ? "Failed to load attachments"
      : attachments.length === 0
        ? "No attachments"
        : `${attachments.length} photo${attachments.length > 1 ? "s" : ""} attached`;

  const categories = weeklyRecord?.categories ?? {};
  const categoryRows = Object.entries(categories).map(([key, value]) => ({
    key,
    label: formatLabel(key),
    ...value,
  }));

  const goodPoints = naText(weeklyRecord?.good_points);
  const notes = naText(weeklyRecord?.note);
  const overallScore = weeklyRecord?.overall_score;

  const handleSignatureSaved = (signatureUrl) => {
    setLocalSignature({
      signature_url: fixAttachmentUrl(signatureUrl),
      signature_refused: false,
      signed_at: new Date().toISOString(),
    });
    setSignatureDialogOpen(false);
  };

  const handleConfirmRefuse = async () => {
    if (!resolvedChecklistId || !weeklyRecord?.id) return;
    try {
      await signWeeklyRecord({
        id: resolvedChecklistId,
        recordId: weeklyRecord.id,
        body: { signature_refused: true },
      }).unwrap();
      setLocalSignature({
        signature_url: null,
        signature_refused: true,
        signed_at: new Date().toISOString(),
      });
      setRefuseConfirmOpen(false);
    } catch (err) {
      console.error("Failed to refuse signature:", err);
    }
  };

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="sm"
        fullWidth
        className="qsd"
        PaperProps={{ className: "qsd__paper" }}>
        <div className="qsd__header">
          <div className="qsd__header-left">
            <AssessmentIcon className="qsd__header-icon" />
            <span className="qsd__header-title">Score Breakdown</span>
          </div>
          <IconButton size="small" className="qsd__close" onClick={onClose}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </div>

        <DialogContent className="qsd__content">
          <div className="qsd__body">
            <div className="qsd__section-card">
              <p className="qsd__section-label">Category Scores</p>
              <div className="qsd__section-body qsd__section-body--no-pad">
                {categoryRows.length === 0 ? (
                  <div className="qsd__empty-pad">—</div>
                ) : (
                  <table className="qsd__table">
                    <thead>
                      <tr>
                        <th className="qsd__th">Category</th>
                        <th className="qsd__th qsd__th--center">Earned</th>
                        <th className="qsd__th qsd__th--center">Available</th>
                        <th className="qsd__th qsd__th--center">Score</th>
                      </tr>
                    </thead>
                    <tbody>
                      {categoryRows.map((row) => (
                        <tr key={row.key} className="qsd__tr">
                          <td className="qsd__td qsd__td--category">
                            {row.label}
                          </td>
                          <td className="qsd__td qsd__td--center">
                            {row.earned ?? "—"}
                          </td>
                          <td className="qsd__td qsd__td--center">
                            {row.available ?? "—"}
                          </td>
                          <td className="qsd__td qsd__td--center">
                            {row.score != null ? (
                              <span
                                className="qsd__score-chip"
                                style={{
                                  background: getScoreColor(row.score),
                                }}>
                                {row.score}%
                              </span>
                            ) : (
                              <span className="qsd__empty">—</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="qsd__tfoot-row">
                        <td className="qsd__td qsd__td--overall" colSpan={3}>
                          Overall Score
                        </td>
                        <td className="qsd__td qsd__td--center">
                          {overallScore != null ? (
                            <span
                              className="qsd__score-chip"
                              style={{
                                background: getScoreColor(overallScore),
                              }}>
                              {overallScore}%
                            </span>
                          ) : (
                            <span className="qsd__empty">—</span>
                          )}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                )}
              </div>
            </div>

            <div className="qsd__section-card">
              <p className="qsd__section-label">Category Feedback</p>
              <div className="qsd__feedback-body">
                <div className="qsd__feedback-grid">
                  <div className="qsd__feedback-col">
                    <span className="qsd__feedback-label">Good Points</span>
                    <p
                      className={`qsd__feedback-text${
                        goodPoints === "N/A" ? " qsd__feedback-text--empty" : ""
                      }`}>
                      {goodPoints}
                    </p>
                  </div>
                  <div className="qsd__feedback-col">
                    <span className="qsd__feedback-label">Notes</span>
                    <p
                      className={`qsd__feedback-text${
                        notes === "N/A" ? " qsd__feedback-text--empty" : ""
                      }`}>
                      {notes}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="qsd__section-card">
              <p className="qsd__section-label">Attachments</p>
              <div className="qsd__section-body qsd__section-body--attachment">
                <div className="qsd__attachment-row">
                  <span className="qsd__attachment-count">
                    <PhotoLibraryIcon sx={{ fontSize: 16 }} />
                    {attachmentCountText}
                  </span>
                  <button
                    className="qsd__btn-attachment"
                    type="button"
                    disabled={isRecordFetching || attachments.length === 0}
                    onClick={() => setGalleryOpen(true)}>
                    <span>View Attachment</span>
                  </button>
                </div>
              </div>
            </div>

            {weeklyRecord?.skip_reason && (
              <div className="qsd__section-card">
                <p className="qsd__section-label">Skip Reason</p>
                <div className="qsd__section-body">
                  <p className="qsd__section-text">
                    {weeklyRecord.skip_reason}
                  </p>
                </div>
              </div>
            )}

            <div className="qsd__section-card">
              <p className="qsd__section-label">Signature</p>
              <div className="qsd__section-body qsd__section-body--signature">
                {localSignature.signature_url ? (
                  <div className="qsd__signature-preview">
                    <div className="qsd__signature-frame">
                      <img
                        src={localSignature.signature_url}
                        alt="Signature"
                        className="qsd__signature-img"
                      />
                    </div>
                    {localSignature.signed_at && (
                      <span className="qsd__signature-meta">
                        Signed{" "}
                        {new Date(localSignature.signed_at).toLocaleString()}
                      </span>
                    )}
                  </div>
                ) : localSignature.signature_refused ? (
                  <div className="qsd__signature-refused">
                    <WarningAmberIcon sx={{ fontSize: 16 }} />
                    <span>Signature refused</span>
                  </div>
                ) : (
                  <div className="qsd__signature-actions">
                    <button
                      className="qsd__btn-signature"
                      type="button"
                      onClick={() => setSignatureDialogOpen(true)}>
                      <DrawIcon sx={{ fontSize: 16 }} />
                      <span>Add Signature</span>
                    </button>
                    <button
                      className="qsd__btn-refuse"
                      type="button"
                      onClick={() => setRefuseConfirmOpen(true)}>
                      <BlockIcon sx={{ fontSize: 16 }} />
                      <span>Refuse to Sign</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </DialogContent>

        <DialogActions className="qsd__footer">
          <button className="qsd__btn-close" onClick={onClose}>
            Close
          </button>
        </DialogActions>
      </Dialog>

      <SignatureDialog
        open={signatureDialogOpen}
        onClose={() => setSignatureDialogOpen(false)}
        checklistId={resolvedChecklistId}
        recordId={weeklyRecord?.id}
        onSignatureSaved={handleSignatureSaved}
      />

      <AttachmentGalleryDialog
        open={galleryOpen}
        onClose={() => setGalleryOpen(false)}
        attachments={attachments}
      />

      <Dialog
        open={refuseConfirmOpen}
        onClose={() => setRefuseConfirmOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ className: "qsd-confirm__paper" }}>
        <div className="qsd-confirm__body">
          <WarningAmberIcon className="qsd-confirm__icon" />
          <p className="qsd-confirm__title">Refuse to Sign?</p>
          <p className="qsd-confirm__text">
            Are you sure you want to refuse to sign this weekly record? This
            action will be recorded and cannot be undone from here.
          </p>
        </div>
        <DialogActions className="qsd-confirm__footer">
          <button
            className="qsd__btn-cancel"
            onClick={() => setRefuseConfirmOpen(false)}
            disabled={isRefusing}
            type="button">
            Cancel
          </button>
          <button
            className="qsd__btn-refuse-confirm"
            onClick={handleConfirmRefuse}
            disabled={isRefusing}
            type="button">
            {isRefusing ? (
              <CircularProgress size={14} sx={{ color: "#fff" }} />
            ) : (
              "Yes, Refuse"
            )}
          </button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default QAWeekScoreDialog;
