import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import IconButton from "@mui/material/IconButton";
import CloseIcon from "@mui/icons-material/Close";
import AccountTreeIcon from "@mui/icons-material/AccountTree";
import EditIcon from "@mui/icons-material/Edit";
import RemoveRedEyeIcon from "@mui/icons-material/RemoveRedEye";
import ReportProblemIcon from "@mui/icons-material/ReportProblem";
import {
  SaveButton,
  EditButton,
  BackModalButton,
} from "../../reusable-components/universal-buttons/UniversalButtons";
import {
  useGetUnitQuery,
  useCreateUnitMutation,
  useUpdateUnitMutation,
} from "../../features/api/units/unitsApi";
import ConfirmDialog from "../../reusable-components/confirm-dialog/ConfirmDialog";
import "./UnitsModal.scss";

const schema = yup.object({
  name: yup.string().trim().required("Unit name is required."),
});

const SkeletonLoader = () => (
  <div className="um__skeleton-wrap">
    <div className="um__skeleton-group">
      <span className="ut__skeleton um__skeleton-label" />
      <span className="ut__skeleton um__skeleton-field" />
    </div>
    <div className="um__skeleton-footer">
      <span className="ut__skeleton um__skeleton-btn" />
    </div>
  </div>
);

const UnitsModal = ({ open, onClose, selectedId = null }) => {
  const [mode, setMode] = useState("add");
  const [selectedRow, setSelectedRow] = useState(null);

  const [createUnit, { isLoading: isCreating }] = useCreateUnitMutation();
  const [updateUnit, { isLoading: isUpdating }] = useUpdateUnitMutation();
  const isLoading = isCreating || isUpdating;

  const { data: unitData, isFetching: unitLoading } = useGetUnitQuery(
    selectedId,
    {
      skip: !selectedId || !open,
    },
  );

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      name: "",
    },
  });

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingFormData, setPendingFormData] = useState(null);

  useEffect(() => {
    if (!open) return;
    if (!selectedId) {
      setMode("add");
      setSelectedRow(null);
      reset({ name: "" });
    } else {
      setMode("view");
    }
  }, [open, selectedId, reset]);

  useEffect(() => {
    if (open && selectedId && unitData) {
      const data = unitData?.data ?? null;
      setSelectedRow(data);
      reset({
        name: data?.name ?? "",
      });
    }
  }, [open, selectedId, unitData, reset]);

  const onValidSubmit = (form) => {
    setPendingFormData(form);
    setConfirmOpen(true);
  };

  const handleConfirmSubmit = async () => {
    if (!pendingFormData) return;
    try {
      if (mode === "edit") {
        await updateUnit({ id: selectedId, ...pendingFormData }).unwrap();
        window.__snackbar__?.enqueueSnackbar("Unit updated successfully.", {
          variant: "success",
        });
      } else {
        await createUnit(pendingFormData).unwrap();
        window.__snackbar__?.enqueueSnackbar("Unit created successfully.", {
          variant: "success",
        });
      }
      setConfirmOpen(false);
      setPendingFormData(null);
      onClose();
    } catch (err) {
      console.error("Save failed:", err);
      window.__snackbar__?.enqueueSnackbar(
        err?.data?.message ?? "Something went wrong. Please try again.",
        { variant: "error" },
      );
    }
  };

  const handleCancelConfirm = () => {
    if (isLoading) return;
    setConfirmOpen(false);
    setPendingFormData(null);
  };

  const headerIcon = {
    add: <AccountTreeIcon className="um__header-icon" />,
    view: <RemoveRedEyeIcon className="um__header-icon" />,
    edit: <EditIcon className="um__header-icon" />,
  };

  const headerTitle = {
    add: "Add Unit",
    view: "View Unit",
    edit: "Edit Unit",
  };

  const isView = mode === "view";

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
      PaperProps={{ className: "um__paper" }}>
      <div className="um__header">
        <div className="um__header-title">
          {headerIcon[mode]}
          <span>{headerTitle[mode]}</span>
        </div>
        <IconButton className="um__close" onClick={onClose} size="small">
          <CloseIcon fontSize="small" />
        </IconButton>
      </div>

      <DialogContent className="um__content">
        {unitLoading ? (
          <SkeletonLoader />
        ) : isView ? (
          <>
            <div className="um__group">
              <p className="um__group-label">Unit Details</p>
              <div className="um__field">
                <div className="um__input-wrap um__input-wrap--disabled">
                  <label className="um__label">Unit Name</label>
                  <input
                    type="text"
                    value={selectedRow?.name ?? ""}
                    disabled
                    readOnly
                  />
                </div>
              </div>
            </div>

            <div className="um__footer">
              <EditButton onClick={() => setMode("edit")} />
            </div>
          </>
        ) : (
          <form onSubmit={handleSubmit(onValidSubmit)} noValidate>
            <div className="um__group">
              <p className="um__group-label">Unit Details</p>
              <div className="um__field">
                <div
                  className={`um__input-wrap${errors.name ? " um__input-wrap--error" : ""}`}>
                  <label className="um__label">
                    Unit Name
                    <span className="um__required">*</span>
                  </label>
                  <input type="text" {...register("name")} autoComplete="off" />
                </div>
                {errors.name && (
                  <p className="um__error">
                    <ReportProblemIcon />
                    {errors.name?.message}
                  </p>
                )}
              </div>
            </div>

            <div className="um__footer">
              {selectedId && (
                <BackModalButton onClick={() => setMode("view")} />
              )}
              <SaveButton
                label={
                  isLoading
                    ? "Saving..."
                    : mode === "edit"
                      ? "Save Changes"
                      : "Add Unit"
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
        title={mode === "edit" ? "Update Unit" : "Add Unit"}
        message={
          mode === "edit"
            ? `Are you sure you want to update "${pendingFormData?.name}"?`
            : `Are you sure you want to add "${pendingFormData?.name}"?`
        }
        confirmLabel={mode === "edit" ? "Update Unit" : "Add Unit"}
        confirmVariant="success"
      />
    </Dialog>
  );
};

export default UnitsModal;
