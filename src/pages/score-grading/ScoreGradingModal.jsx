import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import IconButton from "@mui/material/IconButton";
import CloseIcon from "@mui/icons-material/Close";
import GradeIcon from "@mui/icons-material/Grade";
import EditIcon from "@mui/icons-material/Edit";
import RemoveRedEyeIcon from "@mui/icons-material/RemoveRedEye";
import ReportProblemIcon from "@mui/icons-material/ReportProblem";
import {
  SaveButton,
  EditButton,
  BackModalButton,
} from "../../reusable-components/universal-buttons/UniversalButtons";
import {
  useGetScoreGradingQuery,
  useCreateScoreGradingMutation,
  useUpdateScoreGradingMutation,
} from "../../features/api/score-grading/scoreGradingApi";
import ConfirmDialog from "../../reusable-components/confirm-dialog/ConfirmDialog";
import "./ScoreGradingModal.scss";

const schema = yup.object({
  percentage: yup
    .number()
    .typeError("Percentage is required.")
    .min(0, "Percentage must be at least 0.")
    .max(100, "Percentage must not exceed 100.")
    .required("Percentage is required."),
  layer: yup
    .number()
    .typeError("Layer is required.")
    .required("Layer is required."),
  description: yup.string().nullable(),
});

const clampPercentageInput = (e) => {
  const raw = e.target.value;
  if (raw === "" || raw === "-") return;
  const num = Number(raw);
  if (Number.isNaN(num)) return;
  if (num < 0) {
    e.target.value = "0";
  } else if (num > 100) {
    e.target.value = "100";
  }
};

const SkeletonLoader = () => (
  <div className="sgm__skeleton-wrap">
    <div className="sgm__skeleton-group">
      <span className="ut__skeleton sgm__skeleton-label" />
      <span className="ut__skeleton sgm__skeleton-field" />
    </div>
    <div className="sgm__skeleton-group">
      <span className="ut__skeleton sgm__skeleton-label" />
      <span className="ut__skeleton sgm__skeleton-field" />
    </div>
    <div className="sgm__skeleton-group">
      <span className="ut__skeleton sgm__skeleton-label" />
      <span className="ut__skeleton sgm__skeleton-field sgm__skeleton-field--tall" />
    </div>
    <div className="sgm__skeleton-footer">
      <span className="ut__skeleton sgm__skeleton-btn" />
    </div>
  </div>
);

const ScoreGradingModal = ({ open, onClose, selectedId = null }) => {
  const [mode, setMode] = useState("add");
  const [selectedRow, setSelectedRow] = useState(null);

  const [createScoreGrading, { isLoading: isCreating }] =
    useCreateScoreGradingMutation();
  const [updateScoreGrading, { isLoading: isUpdating }] =
    useUpdateScoreGradingMutation();
  const isLoading = isCreating || isUpdating;

  const { data: scoreGradingData, isFetching: scoreGradingLoading } =
    useGetScoreGradingQuery(selectedId, {
      skip: !selectedId || !open,
    });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      percentage: "",
      layer: "",
      description: "",
    },
  });

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingFormData, setPendingFormData] = useState(null);

  useEffect(() => {
    if (!open) return;
    if (!selectedId) {
      setMode("add");
      setSelectedRow(null);
      reset({ percentage: "", layer: "", description: "" });
    } else {
      setMode("view");
    }
  }, [open, selectedId, reset]);

  useEffect(() => {
    if (open && selectedId && scoreGradingData) {
      const data = scoreGradingData?.data ?? null;
      setSelectedRow(data);
      reset({
        percentage: data?.percentage ?? "",
        layer: data?.layer ?? "",
        description: data?.description ?? "",
      });
    }
  }, [open, selectedId, scoreGradingData, reset]);

  const onValidSubmit = (form) => {
    setPendingFormData(form);
    setConfirmOpen(true);
  };

  const handleConfirmSubmit = async () => {
    if (!pendingFormData) return;
    try {
      if (mode === "edit") {
        await updateScoreGrading({
          id: selectedId,
          ...pendingFormData,
        }).unwrap();
        window.__snackbar__?.enqueueSnackbar(
          "Score grading updated successfully.",
          { variant: "success" },
        );
      } else {
        await createScoreGrading(pendingFormData).unwrap();
        window.__snackbar__?.enqueueSnackbar(
          "Score grading created successfully.",
          { variant: "success" },
        );
      }
      setConfirmOpen(false);
      setPendingFormData(null);
      onClose();
    } catch (err) {
      console.error("Save failed:", err);
    }
  };

  const handleCancelConfirm = () => {
    if (isLoading) return;
    setConfirmOpen(false);
    setPendingFormData(null);
  };

  const headerIcon = {
    add: <GradeIcon className="sgm__header-icon" />,
    view: <RemoveRedEyeIcon className="sgm__header-icon" />,
    edit: <EditIcon className="sgm__header-icon" />,
  };

  const headerTitle = {
    add: "Add Score Grading",
    view: "View Score Grading",
    edit: "Edit Score Grading",
  };

  const isView = mode === "view";
  const isEdit = mode === "edit";

  return (
    <Dialog
      open={open}
      onClose={(e, reason) => {
        if (reason === "backdropClick") return;
        onClose();
      }}
      disableEscapeKeyDown
      maxWidth="sm"
      fullWidth
      PaperProps={{ className: "sgm__paper" }}>
      <div className="sgm__header">
        <div className="sgm__header-title">
          {headerIcon[mode]}
          <span>{headerTitle[mode]}</span>
        </div>
        <IconButton className="sgm__close" onClick={onClose} size="small">
          <CloseIcon fontSize="small" />
        </IconButton>
      </div>

      <DialogContent className="sgm__content">
        {scoreGradingLoading ? (
          <SkeletonLoader />
        ) : isView ? (
          <>
            <div className="sgm__group">
              <p className="sgm__group-label">Score Grading Details</p>
              <div className="sgm__field">
                <div className="sgm__input-wrap sgm__input-wrap--disabled">
                  <label className="sgm__label">Percentage</label>
                  <input
                    type="text"
                    value={
                      selectedRow?.percentage != null
                        ? `${selectedRow.percentage}%`
                        : ""
                    }
                    disabled
                    readOnly
                  />
                </div>
              </div>
              <div className="sgm__field" style={{ marginTop: 12 }}>
                <div className="sgm__input-wrap sgm__input-wrap--disabled">
                  <label className="sgm__label">Layer</label>
                  <input
                    type="text"
                    value={selectedRow?.layer ?? ""}
                    disabled
                    readOnly
                  />
                </div>
              </div>
              <div className="sgm__field" style={{ marginTop: 12 }}>
                <div className="sgm__input-wrap sgm__input-wrap--disabled">
                  <label className="sgm__label">Description</label>
                  <input
                    type="text"
                    value={selectedRow?.description ?? "-"}
                    disabled
                    readOnly
                  />
                </div>
              </div>
            </div>

            <div className="sgm__footer">
              <EditButton onClick={() => setMode("edit")} />
            </div>
          </>
        ) : (
          <form onSubmit={handleSubmit(onValidSubmit)} noValidate>
            <div className="sgm__group">
              <p className="sgm__group-label">Score Grading Details</p>
              <div className="sgm__field">
                <div
                  className={`sgm__input-wrap${errors.percentage ? " sgm__input-wrap--error" : ""}`}>
                  <label className="sgm__label">
                    Percentage
                    <span className="sgm__required">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    {...register("percentage", {
                      onChange: clampPercentageInput,
                    })}
                    onInput={clampPercentageInput}
                    onPaste={(e) => {
                      const pasted = e.clipboardData.getData("text");
                      const num = Number(pasted);
                      if (Number.isNaN(num) || num < 0 || num > 100) {
                        e.preventDefault();
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "-" || e.key === "e" || e.key === "+") {
                        e.preventDefault();
                      }
                    }}
                    autoComplete="off"
                  />
                </div>
                {errors.percentage && (
                  <p className="sgm__error">
                    <ReportProblemIcon />
                    {errors.percentage?.message}
                  </p>
                )}
              </div>

              <div className="sgm__field" style={{ marginTop: 12 }}>
                <div
                  className={`sgm__input-wrap${errors.layer ? " sgm__input-wrap--error" : ""}${isEdit ? " sgm__input-wrap--disabled" : ""}`}>
                  <label className="sgm__label">
                    Layer
                    <span className="sgm__required">*</span>
                  </label>
                  <input
                    type="number"
                    {...register("layer")}
                    disabled={isEdit}
                    readOnly={isEdit}
                    autoComplete="off"
                  />
                </div>
                {errors.layer && !isEdit && (
                  <p className="sgm__error">
                    <ReportProblemIcon />
                    {errors.layer?.message}
                  </p>
                )}
              </div>

              <div className="sgm__field" style={{ marginTop: 12 }}>
                <div
                  className={`sgm__input-wrap${errors.description ? " sgm__input-wrap--error" : ""}`}>
                  <label className="sgm__label">Description</label>
                  <input
                    type="text"
                    {...register("description")}
                    autoComplete="off"
                  />
                </div>
                {errors.description && (
                  <p className="sgm__error">
                    <ReportProblemIcon />
                    {errors.description?.message}
                  </p>
                )}
              </div>
            </div>

            <div className="sgm__footer">
              {selectedId && (
                <BackModalButton onClick={() => setMode("view")} />
              )}
              <SaveButton
                label={
                  isLoading
                    ? "Saving..."
                    : mode === "edit"
                      ? "Save Changes"
                      : "Add Score Grading"
                }
                onClick={handleSubmit(onValidSubmit)}
                disabled={isLoading}
              />
            </div>
          </form>
        )}
      </DialogContent>

      <ConfirmDialog
        open={confirmOpen}
        onClose={handleCancelConfirm}
        onConfirm={handleConfirmSubmit}
        isLoading={isLoading}
        title={mode === "edit" ? "Update Score Grading" : "Add Score Grading"}
        message={
          mode === "edit"
            ? `Are you sure you want to update this score grading entry (Layer ${pendingFormData?.layer})?`
            : `Are you sure you want to add this score grading entry (Layer ${pendingFormData?.layer})?`
        }
        confirmLabel={mode === "edit" ? "Update" : "Add"}
        confirmVariant="success"
      />
    </Dialog>
  );
};

export default ScoreGradingModal;
