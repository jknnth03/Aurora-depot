import { useState } from "react";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import VisibilityIcon from "@mui/icons-material/Visibility";
import BlockIcon from "@mui/icons-material/Block";
import RestoreIcon from "@mui/icons-material/Restore";
import MoreHorizIcon from "@mui/icons-material/MoreHoriz";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import ChecklistIcon from "@mui/icons-material/Checklist";
import {
  getChipBg,
  getChipTextColor,
  useChipColors,
} from "../../components/accountmenu/ChipColorPickerUtils";
import { isWeekActionable } from "./qaWeekUtils";
import QAAnswerModal from "./QAAnswerModal";
import QAWeekScoreDialog from "./QAWeekScoreDialog";
import ConfirmDialog from "../../reusable-components/confirm-dialog/ConfirmDialog";
import {
  useSkipChecklistMutation,
  useUndoSkipChecklistMutation,
} from "../../features/api/qa-dashboard/qaDashboardApi";
import "./QADashboardModal.scss";

const STATUS_CHIP_MAP = {
  completed: "chip-completed",
  skipped: "chip-rejected",
  not_started: "chip-pending",
};

const STATUS_LABEL_MAP = {
  completed: "Completed",
  skipped: "Skipped",
  not_started: "Not Started",
};

const getDoneOn = (weeklyRecord) => {
  if (!weeklyRecord?.updated_at) return "—";
  const date = new Date(weeklyRecord.updated_at);
  if (isNaN(date)) return "—";
  return date.toLocaleDateString("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const getTimeline = (weeklyRecord) => {
  if (!weeklyRecord?.time_in) return "—";
  const dateLabel = weeklyRecord.time_in_date
    ? new Date(weeklyRecord.time_in_date).toLocaleDateString("en-PH", {
        month: "short",
        day: "numeric",
      })
    : "";
  const timeRange = weeklyRecord.time_out
    ? `${weeklyRecord.time_in} - ${weeklyRecord.time_out}`
    : weeklyRecord.time_in;
  return dateLabel ? `${dateLabel}, ${timeRange}` : timeRange;
};

const StatusChip = ({ status }) => {
  useChipColors();
  const chipId = STATUS_CHIP_MAP[status] ?? null;
  if (!chipId) return <span className="qdm__dash">—</span>;
  return (
    <span
      className="qdm__chip"
      style={{
        background: getChipBg(chipId),
        color: getChipTextColor(chipId),
      }}>
      {STATUS_LABEL_MAP[status] ?? status}
    </span>
  );
};

const findWeeklyRecord = (weeklyRecords, weeklyRecordId) =>
  (weeklyRecords ?? []).find((record) => record.id === weeklyRecordId) ?? null;

const RowActionMenu = ({
  week,
  weeklyRecord,
  actionable,
  onAnswer,
  onSkip,
  onUndoSkip,
  onView,
  onShowChecklist,
}) => {
  const [anchor, setAnchor] = useState(null);
  const close = () => setAnchor(null);

  if (week.status === "not_started" && !actionable) {
    return <span className="qdm__dash">—</span>;
  }

  return (
    <div className="qdm__actions-cell">
      <IconButton
        size="small"
        className="qdm__icon-btn"
        onClick={(e) => {
          e.stopPropagation();
          setAnchor(e.currentTarget);
        }}>
        <MoreHorizIcon sx={{ fontSize: 18 }} />
      </IconButton>

      <Menu
        anchorEl={anchor}
        open={Boolean(anchor)}
        onClose={close}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        PaperProps={{ className: "qdm__menu-paper" }}>
        {week.status === "not_started" &&
          actionable && [
            <MenuItem
              key="answer"
              className="qdm__menu-item"
              onClick={() => {
                close();
                onAnswer();
              }}>
              <PlayArrowIcon className="qdm__menu-icon" />
              Answer
            </MenuItem>,
            <MenuItem
              key="skip"
              className="qdm__menu-item"
              onClick={() => {
                close();
                onSkip();
              }}>
              <BlockIcon className="qdm__menu-icon" />
              Skip
            </MenuItem>,
          ]}

        {week.status === "skipped" && (
          <MenuItem
            key="undo-skip"
            className="qdm__menu-item"
            onClick={() => {
              close();
              onUndoSkip();
            }}>
            <RestoreIcon className="qdm__menu-icon" />
            Undo Skip
          </MenuItem>
        )}

        {week.status === "completed" && [
          <MenuItem
            key="view"
            className="qdm__menu-item"
            onClick={() => {
              close();
              onView(weeklyRecord);
            }}>
            <VisibilityIcon className="qdm__menu-icon" />
            View Score Breakdown
          </MenuItem>,
          <MenuItem
            key="show-checklist"
            className="qdm__menu-item"
            onClick={() => {
              close();
              onShowChecklist(weeklyRecord, week.week);
            }}>
            <ChecklistIcon className="qdm__menu-icon" />
            Show Checklist
          </MenuItem>,
        ]}
      </Menu>
    </div>
  );
};

const QADashboardModal = ({ open, checklistData, onClose }) => {
  const [answerModalOpen, setAnswerModalOpen] = useState(false);
  const [answeringWeek, setAnsweringWeek] = useState(null);
  const [scoreDialogData, setScoreDialogData] = useState(null);
  const [checklistViewData, setChecklistViewData] = useState(null);
  const [confirmSkipOpen, setConfirmSkipOpen] = useState(false);
  const [confirmUndoSkipOpen, setConfirmUndoSkipOpen] = useState(false);
  const [skipReason, setSkipReason] = useState("");
  const [skipReasonError, setSkipReasonError] = useState(false);
  const [skippingWeek, setSkippingWeek] = useState(null);

  const [skipChecklist] = useSkipChecklistMutation();
  const [undoSkipChecklist] = useUndoSkipChecklistMutation();

  const checklistId = checklistData?.id;
  const weeks = checklistData?.current_month_weeks ?? [];
  const weeklyRecords = checklistData?.weekly_records ?? [];
  const monthLabel = checklistData?.weeks_period
    ? new Date(
        checklistData.weeks_period.year,
        checklistData.weeks_period.month - 1,
      ).toLocaleDateString("en-PH", { month: "long", year: "numeric" })
    : "";

  const handleAnswerModalClose = () => {
    setAnswerModalOpen(false);
    setAnsweringWeek(null);
  };

  const handleConfirmSkip = async () => {
    if (!skipReason.trim()) {
      setSkipReasonError(true);
      return;
    }
    try {
      await skipChecklist({
        id: checklistId,
        reason: skipReason.trim(),
      }).unwrap();
      window.__snackbar__?.enqueueSnackbar("Week skipped successfully.", {
        variant: "success",
      });
      setConfirmSkipOpen(false);
      setSkipReason("");
      setSkipReasonError(false);
      setSkippingWeek(null);
    } catch (err) {
      window.__snackbar__?.enqueueSnackbar(
        err?.data?.message || "Failed to skip week.",
        { variant: "error" },
      );
    }
  };

  const handleCancelSkip = () => {
    setConfirmSkipOpen(false);
    setSkipReason("");
    setSkipReasonError(false);
    setSkippingWeek(null);
  };

  const handleConfirmUndoSkip = async () => {
    try {
      await undoSkipChecklist(checklistId).unwrap();
      window.__snackbar__?.enqueueSnackbar(
        "Week restored to not started successfully.",
        { variant: "success" },
      );
    } catch (err) {
      window.__snackbar__?.enqueueSnackbar(
        err?.data?.message || "Failed to undo skip.",
        { variant: "error" },
      );
    }
    setConfirmUndoSkipOpen(false);
  };

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="md"
        fullWidth
        className="qdm"
        PaperProps={{ className: "qdm__paper", sx: { maxWidth: 900 } }}>
        <DialogTitle className="qdm__title">
          {checklistData?.checklist?.name} — {checklistData?.store?.name} (
          {monthLabel})
        </DialogTitle>

        <DialogContent className="qdm__content">
          <table className="qdm__table">
            <thead>
              <tr className="qdm__thead-row">
                <th className="qdm__th">Week</th>
                <th className="qdm__th">Total Score</th>
                <th className="qdm__th">Done On</th>
                <th className="qdm__th">Timeline</th>
                <th className="qdm__th">Status</th>
                <th className="qdm__th">Skip Reason</th>
                <th className="qdm__th qdm__th--actions">Actions</th>
              </tr>
            </thead>
            <tbody>
              {weeks.map((week, index) => {
                const weeklyRecord = findWeeklyRecord(
                  weeklyRecords,
                  week.weekly_record_id,
                );
                const actionable = isWeekActionable(weeks, index);
                return (
                  <tr key={week.week} className="qdm__tr">
                    <td className="qdm__td">Week {week.week}</td>
                    <td className="qdm__td">
                      {week.overall_score != null
                        ? `${week.overall_score}%`
                        : "—"}
                    </td>
                    <td className="qdm__td qdm__td--doneon">
                      {getDoneOn(weeklyRecord)}
                    </td>
                    <td className="qdm__td qdm__td--timeline">
                      {getTimeline(weeklyRecord)}
                    </td>
                    <td className="qdm__td">
                      <StatusChip status={week.status} />
                    </td>
                    <td className="qdm__td qdm__td--skipreason">
                      {week.status === "skipped"
                        ? weeklyRecord?.skip_reason || "—"
                        : "—"}
                    </td>
                    <td className="qdm__td qdm__td--actions">
                      <RowActionMenu
                        week={week}
                        weeklyRecord={weeklyRecord}
                        actionable={actionable}
                        onAnswer={() => {
                          setAnsweringWeek(week.week);
                          setAnswerModalOpen(true);
                        }}
                        onSkip={() => {
                          setSkippingWeek(week.week);
                          setConfirmSkipOpen(true);
                        }}
                        onUndoSkip={() => setConfirmUndoSkipOpen(true)}
                        onView={setScoreDialogData}
                        onShowChecklist={(record, weekNum) =>
                          setChecklistViewData({
                            weeklyRecordId: record?.id,
                            week: weekNum,
                          })
                        }
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </DialogContent>

        <DialogActions className="qdm__footer">
          <Button
            variant="outlined"
            onClick={onClose}
            className="qdm__btn-close">
            Close
          </Button>
        </DialogActions>
      </Dialog>

      <QAAnswerModal
        open={answerModalOpen}
        onClose={handleAnswerModalClose}
        checklistId={checklistId}
        checklistDetail={checklistData}
        week={answeringWeek}
      />

      <QAAnswerModal
        open={Boolean(checklistViewData)}
        onClose={() => setChecklistViewData(null)}
        checklistId={checklistId}
        checklistDetail={checklistData}
        week={checklistViewData?.week}
        viewOnly
        weeklyRecordId={checklistViewData?.weeklyRecordId}
      />

      <QAWeekScoreDialog
        open={Boolean(scoreDialogData)}
        onClose={() => setScoreDialogData(null)}
        weeklyRecord={scoreDialogData}
      />

      <Dialog
        open={confirmSkipOpen}
        onClose={handleCancelSkip}
        maxWidth="xs"
        fullWidth
        className="qdm"
        PaperProps={{ className: "qdm__skip-paper" }}>
        <DialogContent className="qdm__skip-content">
          <div className="qdm__skip-icon-wrap">
            <WarningAmberIcon className="qdm__skip-icon" />
          </div>
          <p className="qdm__skip-title">Skip Week {skippingWeek ?? ""}?</p>
          <p className="qdm__skip-desc">
            This will mark this week's checklist as skipped. This action cannot
            be undone.
          </p>

          <p className="qdm__skip-label">Reason</p>
          <textarea
            className={`qdm__skip-textarea${skipReasonError ? " qdm__skip-textarea--error" : ""}`}
            placeholder="Enter reason for skipping"
            value={skipReason}
            onChange={(e) => {
              setSkipReason(e.target.value);
              if (e.target.value.trim()) setSkipReasonError(false);
            }}
          />
          {skipReasonError && (
            <p className="qdm__skip-error">The reason field is required.</p>
          )}
        </DialogContent>
        <DialogActions className="qdm__skip-footer">
          <Button
            variant="outlined"
            onClick={handleCancelSkip}
            className="qdm__skip-btn-cancel">
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleConfirmSkip}
            className="qdm__skip-btn-confirm">
            Skip
          </Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={confirmUndoSkipOpen}
        onClose={() => setConfirmUndoSkipOpen(false)}
        onConfirm={handleConfirmUndoSkip}
        title="Undo Skip"
        message="Are you sure you want to restore this week back to not started?"
      />
    </>
  );
};

export default QADashboardModal;
