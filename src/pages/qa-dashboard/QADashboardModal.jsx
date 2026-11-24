import { useState } from "react";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Skeleton from "@mui/material/Skeleton";
import CircularProgress from "@mui/material/CircularProgress";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import VisibilityIcon from "@mui/icons-material/Visibility";
import BlockIcon from "@mui/icons-material/Block";
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
import { useSkipChecklistMutation } from "../../features/api/qa-dashboard/qaDashboardApi";
import "./QADashboardModal.scss";

const MIN_SKELETON_MS = 600;

const RESOLVED_STATUSES = ["completed", "skipped"];

const STATUS_CHIP_MAP = {
  completed: "chip-completed",
  for_signature: "chip-on-going",
  skipped: "chip-rejected",
  backlogged: "chip-rejected",
  not_started: "chip-pending",
  in_progress: "chip-on-going",
};

const STATUS_LABEL_MAP = {
  completed: "Completed",
  for_signature: "For Signature",
  skipped: "Skipped",
  backlogged: "Backlogged",
  not_started: "Not Started",
  in_progress: "Save as Draft",
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

const getWeekStatus = (week, weeklyRecord) => {
  if (week.status !== "completed") return week.status;
  if (!weeklyRecord) return week.status;
  const hasSignature = !!weeklyRecord.signature_url;
  const hasRefused = !!weeklyRecord.signature_refused;
  return hasSignature || hasRefused ? "completed" : "for_signature";
};

const hasAvailableActions = (status, actionable) => {
  if (status === "not_started") return actionable;
  if (status === "in_progress") return true;
  if (status === "completed" || status === "for_signature") return true;
  return false;
};

const RowActionMenu = ({
  week,
  weeklyRecord,
  status,
  actionable,
  onAnswer,
  onContinue,
  onSkip,
  onView,
  onShowChecklist,
}) => {
  const [anchor, setAnchor] = useState(null);

  const close = () => setAnchor(null);

  if (!hasAvailableActions(status, actionable)) {
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
        slotProps={{ paper: { className: "qdm__menu-paper" } }}>
        {status === "not_started" &&
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

        {status === "in_progress" && (
          <MenuItem
            key="continue"
            className="qdm__menu-item"
            onClick={() => {
              close();
              onContinue(weeklyRecord);
            }}>
            <PlayArrowIcon className="qdm__menu-icon" />
            Continue
          </MenuItem>
        )}

        {(status === "completed" || status === "for_signature") && [
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

const SkeletonRows = ({ count }) =>
  Array.from({ length: count }).map((_, rowIdx) => (
    <tr key={`skeleton-${rowIdx}`} className="qdm__tr">
      <td className="qdm__td">
        <Skeleton variant="text" width={60} height={20} />
      </td>
      <td className="qdm__td">
        <Skeleton variant="text" width={50} height={20} />
      </td>
      <td className="qdm__td qdm__td--doneon">
        <Skeleton variant="text" width={90} height={20} />
      </td>
      <td className="qdm__td">
        <Skeleton variant="rounded" width={90} height={22} />
      </td>
      <td className="qdm__td qdm__td--skipreason">
        <Skeleton variant="text" width={110} height={20} />
      </td>
      <td className="qdm__td qdm__td--actions">
        <Skeleton variant="circular" width={24} height={24} />
      </td>
    </tr>
  ));

const QADashboardModal = ({
  open,
  checklistData,
  onClose,
  onRefetch,
  isLoading = false,
}) => {
  const [answerModalOpen, setAnswerModalOpen] = useState(false);
  const [answeringWeek, setAnsweringWeek] = useState(null);
  const [answeringWeeklyRecordId, setAnsweringWeeklyRecordId] = useState(null);
  const [scoreDialogData, setScoreDialogData] = useState(null);
  const [checklistViewData, setChecklistViewData] = useState(null);
  const [confirmSkipOpen, setConfirmSkipOpen] = useState(false);
  const [skipReason, setSkipReason] = useState("");
  const [skipReasonError, setSkipReasonError] = useState(false);
  const [skippingWeek, setSkippingWeek] = useState(null);
  const [isSyncing, setIsSyncing] = useState(false);

  const [skipChecklist, { isLoading: isSkipping }] = useSkipChecklistMutation();

  const checklistId = checklistData?.id;
  const weeks = checklistData?.current_month_weeks ?? [];
  const weeklyRecords = checklistData?.weekly_records ?? [];
  const showSkeleton = isLoading || isSyncing;

  const weekStatuses = weeks.map((week) =>
    getWeekStatus(week, findWeeklyRecord(weeklyRecords, week.weekly_record_id)),
  );

  const monthLabel = checklistData?.weeks_period
    ? new Date(
        checklistData.weeks_period.year,
        checklistData.weeks_period.month - 1,
      ).toLocaleDateString("en-PH", {
        month: "long",
        year: "numeric",
      })
    : "";

  const syncData = async () => {
    setIsSyncing(true);
    try {
      await Promise.all([
        Promise.resolve(onRefetch?.()),
        new Promise((resolve) => setTimeout(resolve, MIN_SKELETON_MS)),
      ]);
    } catch (err) {
      console.error("Refetch failed:", err);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleAnswerModalClose = () => {
    setAnswerModalOpen(false);
    setAnsweringWeek(null);
    setAnsweringWeeklyRecordId(null);
  };

  const handleSaved = () => {
    syncData();
  };

  const handleConfirmSkip = async () => {
    if (!skipReason.trim()) {
      setSkipReasonError(true);
      return;
    }

    try {
      await skipChecklist({
        id: checklistId,
        week: skippingWeek,
        reason: skipReason.trim(),
      }).unwrap();

      window.__snackbar__?.enqueueSnackbar("Week skipped successfully.", {
        variant: "success",
      });

      setConfirmSkipOpen(false);
      setSkipReason("");
      setSkipReasonError(false);
      setSkippingWeek(null);
      syncData();
    } catch (err) {
      console.error("Skip failed:", err);
    }
  };

  const handleCancelSkip = () => {
    if (isSkipping) return;

    setConfirmSkipOpen(false);
    setSkipReason("");
    setSkipReasonError(false);
    setSkippingWeek(null);
  };

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="md"
        fullWidth
        className="qdm"
        slotProps={{
          paper: { className: "qdm__paper", sx: { maxWidth: 900 } },
        }}>
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
                <th className="qdm__th">Status</th>
                <th className="qdm__th">Skip Reason</th>
                <th className="qdm__th qdm__th--actions">Actions</th>
              </tr>
            </thead>

            <tbody>
              {showSkeleton ? (
                <SkeletonRows count={weeks.length || 4} />
              ) : (
                weeks.map((week, index) => {
                  const weeklyRecord = findWeeklyRecord(
                    weeklyRecords,
                    week.weekly_record_id,
                  );

                  const status = weekStatuses[index];
                  const previousWeekDone =
                    index === 0 ||
                    RESOLVED_STATUSES.includes(weekStatuses[index - 1]);
                  const actionable =
                    previousWeekDone && isWeekActionable(weeks, index);

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

                      <td className="qdm__td">
                        <StatusChip status={status} />
                      </td>

                      <td className="qdm__td qdm__td--skipreason">
                        {weeklyRecord?.skip_reason || "—"}
                      </td>

                      <td className="qdm__td qdm__td--actions">
                        <RowActionMenu
                          week={week}
                          weeklyRecord={weeklyRecord}
                          status={status}
                          actionable={actionable}
                          onAnswer={() => {
                            setAnsweringWeek(week.week);
                            setAnsweringWeeklyRecordId(null);
                            setAnswerModalOpen(true);
                          }}
                          onContinue={(record) => {
                            setAnsweringWeek(week.week);
                            setAnsweringWeeklyRecordId(record?.id ?? null);
                            setAnswerModalOpen(true);
                          }}
                          onSkip={() => {
                            setSkippingWeek(week.week);
                            setConfirmSkipOpen(true);
                          }}
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
                })
              )}
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
        onSaved={handleSaved}
        checklistId={checklistId}
        checklistDetail={checklistData}
        week={answeringWeek}
        weeklyRecordId={answeringWeeklyRecordId}
      />

      <QAAnswerModal
        open={Boolean(checklistViewData)}
        onClose={() => setChecklistViewData(null)}
        onSaved={handleSaved}
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
        slotProps={{ paper: { className: "qdm__skip-paper" } }}>
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
            className={`qdm__skip-textarea${
              skipReasonError ? " qdm__skip-textarea--error" : ""
            }`}
            placeholder="Enter reason for skipping"
            value={skipReason}
            disabled={isSkipping}
            onChange={(e) => {
              setSkipReason(e.target.value);

              if (e.target.value.trim()) {
                setSkipReasonError(false);
              }
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
            disabled={isSkipping}
            className="qdm__skip-btn-cancel">
            Cancel
          </Button>

          <Button
            variant="contained"
            onClick={handleConfirmSkip}
            disabled={isSkipping}
            startIcon={
              isSkipping ? <CircularProgress size={16} color="inherit" /> : null
            }
            className="qdm__skip-btn-confirm">
            {isSkipping ? "Skipping..." : "Skip"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default QADashboardModal;
