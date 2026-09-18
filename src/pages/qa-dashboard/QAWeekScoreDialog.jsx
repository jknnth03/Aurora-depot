import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import IconButton from "@mui/material/IconButton";
import CloseIcon from "@mui/icons-material/Close";
import AssessmentIcon from "@mui/icons-material/Assessment";
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

const QAWeekScoreDialog = ({ open, onClose, weeklyRecord }) => {
  if (!weeklyRecord) return null;

  const categories = weeklyRecord?.categories ?? {};
  const categoryRows = Object.entries(categories).map(([key, value]) => ({
    key,
    label: formatLabel(key),
    ...value,
  }));

  return (
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
          <div className="qsd__details-card">
            <p className="qsd__details-title">Details</p>
            <div className="qsd__details-grid">
              <div className="qsd__details-col">
                <div className="qsd__detail-row">
                  <span className="qsd__detail-label">Week:</span>
                  <span className="qsd__detail-value qsd__detail-value--accent">
                    Week {weeklyRecord?.week ?? "—"}
                  </span>
                </div>
                <div className="qsd__detail-row">
                  <span className="qsd__detail-label">Status:</span>
                  <span className="qsd__detail-value qsd__detail-value--accent">
                    {formatLabel(weeklyRecord?.status ?? "—")}
                  </span>
                </div>
              </div>
              <div className="qsd__details-col">
                <div className="qsd__detail-row">
                  <span className="qsd__detail-label">Overall Score:</span>
                  <span
                    className="qsd__detail-value qsd__detail-value--accent"
                    style={{
                      color: getScoreColor(weeklyRecord?.overall_score),
                    }}>
                    {weeklyRecord?.overall_score != null
                      ? `${weeklyRecord.overall_score}%`
                      : "—"}
                  </span>
                </div>
              </div>
            </div>
          </div>

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
                              style={{ background: getScoreColor(row.score) }}>
                              {row.score}%
                            </span>
                          ) : (
                            <span className="qsd__empty">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {weeklyRecord?.skip_reason && (
            <div className="qsd__section-card">
              <p className="qsd__section-label">Skip Reason</p>
              <div className="qsd__section-body">
                <p className="qsd__section-text">{weeklyRecord.skip_reason}</p>
              </div>
            </div>
          )}
        </div>
      </DialogContent>

      <DialogActions className="qsd__footer">
        <button className="qsd__btn-close" onClick={onClose}>
          Close
        </button>
      </DialogActions>
    </Dialog>
  );
};

export default QAWeekScoreDialog;
