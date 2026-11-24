import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import IconButton from "@mui/material/IconButton";
import CloseIcon from "@mui/icons-material/Close";
import VpnKeyIcon from "@mui/icons-material/VpnKey";
import EditIcon from "@mui/icons-material/Edit";
import RemoveRedEyeIcon from "@mui/icons-material/RemoveRedEye";
import ReportProblemIcon from "@mui/icons-material/ReportProblem";
import {
  SaveButton,
  EditButton,
  BackModalButton,
} from "../../../reusable-components/universal-buttons/UniversalButtons";
import {
  useCreatePermissionMutation,
  useUpdatePermissionMutation,
} from "../../../features/api/usersmanagement/permissionsApi";
import ConfirmDialog from "../../../reusable-components/confirm-dialog/ConfirmDialog";
import "../roles/RolesModal.scss";

const schema = yup.object({
  name: yup.string().trim().required("Permission name is required."),
  group: yup.string().trim().required("Group is required."),
  description: yup.string().trim().required("Description is required."),
});

const PermissionsModal = ({ open, onClose, selectedRow = null }) => {
  const [mode, setMode] = useState("add");
  const selectedId = selectedRow?.id ?? null;

  const [createPermission, { isLoading: isCreating }] =
    useCreatePermissionMutation();
  const [updatePermission, { isLoading: isUpdating }] =
    useUpdatePermissionMutation();
  const isLoading = isCreating || isUpdating;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      name: "",
      group: "",
      description: "",
    },
  });

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingFormData, setPendingFormData] = useState(null);

  useEffect(() => {
    if (!open) return;
    if (!selectedRow) {
      setMode("add");
      reset({ name: "", group: "", description: "" });
    } else {
      setMode("view");
      reset({
        name: selectedRow.name ?? "",
        group: selectedRow.group ?? "",
        description: selectedRow.description ?? "",
      });
    }
  }, [open, selectedRow, reset]);

  const onValidSubmit = (form) => {
    setPendingFormData(form);
    setConfirmOpen(true);
  };

  const handleConfirmSubmit = async () => {
    if (!pendingFormData) return;
    try {
      if (mode === "edit") {
        await updatePermission({ id: selectedId, ...pendingFormData }).unwrap();
        window.__snackbar__?.enqueueSnackbar(
          "Permission updated successfully.",
          {
            variant: "success",
          },
        );
      } else {
        await createPermission(pendingFormData).unwrap();
        window.__snackbar__?.enqueueSnackbar(
          "Permission created successfully.",
          {
            variant: "success",
          },
        );
      }
      setConfirmOpen(false);
      setPendingFormData(null);
      onClose();
    } catch (err) {
      console.error("Save failed:", err);
      window.__snackbar__?.enqueueSnackbar(
        "Something went wrong. Please try again.",
        { variant: "error" },
      );
    }
  };

  const handleCancelConfirm = () => {
    if (isLoading) return;
    setConfirmOpen(false);
    setPendingFormData(null);
  };

  const handleBack = () => {
    reset({
      name: selectedRow?.name ?? "",
      group: selectedRow?.group ?? "",
      description: selectedRow?.description ?? "",
    });
    setMode("view");
  };

  const headerIcon = {
    add: <VpnKeyIcon className="rm__header-icon" />,
    view: <RemoveRedEyeIcon className="rm__header-icon" />,
    edit: <EditIcon className="rm__header-icon" />,
  };

  const headerTitle = {
    add: "Add Permission",
    view: "View Permission",
    edit: "Edit Permission",
  };

  const isView = mode === "view";

  const renderField = (name, label, extraStyle) => (
    <div className="rm__field" style={extraStyle}>
      <div
        className={`rm__input-wrap${errors[name] ? " rm__input-wrap--error" : ""}`}>
        <label className="rm__label">
          {label}
          <span className="rm__required">*</span>
        </label>
        <input type="text" {...register(name)} autoComplete="off" />
      </div>
      {errors[name] && (
        <p className="rm__error">
          <ReportProblemIcon />
          {errors[name]?.message}
        </p>
      )}
    </div>
  );

  const renderViewField = (label, value, extraStyle) => (
    <div className="rm__field" style={extraStyle}>
      <div className="rm__input-wrap rm__input-wrap--disabled">
        <label className="rm__label">{label}</label>
        <input type="text" value={value ?? ""} disabled readOnly />
      </div>
    </div>
  );

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
      PaperProps={{ className: "rm__paper" }}>
      <div className="rm__header">
        <div className="rm__header-title">
          {headerIcon[mode]}
          <span>{headerTitle[mode]}</span>
        </div>
        <IconButton className="rm__close" onClick={onClose} size="small">
          <CloseIcon fontSize="small" />
        </IconButton>
      </div>

      <DialogContent className="rm__content">
        {isView ? (
          <>
            <div className="rm__group">
              <p className="rm__group-label">Permission Details</p>
              {renderViewField("Permission Name", selectedRow?.name)}
              {renderViewField("Group", selectedRow?.group, { marginTop: 12 })}
              {renderViewField("Description", selectedRow?.description, {
                marginTop: 12,
              })}
            </div>

            <div className="rm__footer">
              <EditButton onClick={() => setMode("edit")} />
            </div>
          </>
        ) : (
          <form onSubmit={handleSubmit(onValidSubmit)} noValidate>
            <div className="rm__group">
              <p className="rm__group-label">Permission Details</p>
              {renderField("name", "Permission Name")}
              {renderField("group", "Group", { marginTop: 12 })}
              {renderField("description", "Description", { marginTop: 12 })}
            </div>

            <div className="rm__footer">
              {selectedId && <BackModalButton onClick={handleBack} />}
              <SaveButton
                label={
                  isLoading
                    ? "Saving..."
                    : mode === "edit"
                      ? "Save Changes"
                      : "Add Permission"
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
        title={mode === "edit" ? "Update Permission" : "Add Permission"}
        message={
          mode === "edit"
            ? `Are you sure you want to update "${pendingFormData?.name}"?`
            : `Are you sure you want to add "${pendingFormData?.name}"?`
        }
        confirmLabel={mode === "edit" ? "Update Permission" : "Add Permission"}
        confirmVariant="success"
      />
    </Dialog>
  );
};

export default PermissionsModal;
