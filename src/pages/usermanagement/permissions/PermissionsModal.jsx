import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import IconButton from "@mui/material/IconButton";
import CloseIcon from "@mui/icons-material/Close";
// import EditIcon from "@mui/icons-material/Edit";
import VpnKeyIcon from "@mui/icons-material/VpnKey";
// import RemoveRedEyeIcon from "@mui/icons-material/RemoveRedEye";
import PushPinIcon from "@mui/icons-material/PushPin";
import ReportProblemIcon from "@mui/icons-material/ReportProblem";
import { SaveButton } from "../../../reusable-components/universal-buttons/UniversalButtons";
import {
  // useGetPermissionQuery,
  useCreatePermissionMutation,
  // useUpdatePermissionMutation,
} from "../../../features/api/usersmanagement/permissionsApi";
import ConfirmDialog from "../../../reusable-components/confirm-dialog/ConfirmDialog";
import "./PermissionsModal.scss";

const schema = yup.object({
  name: yup.string().required("Permission name is required."),
  group: yup.string().required("Group is required."),
  description: yup.string().required("Description is required."),
});

// const SkeletonLoader = () => (
//   <div className="pm__skeleton-wrap">
//     <div className="pm__skeleton-group">
//       <span className="ut__skeleton pm__skeleton-label" />
//       <span className="ut__skeleton pm__skeleton-field" />
//     </div>
//     <div className="pm__skeleton-group">
//       <span className="ut__skeleton pm__skeleton-label" />
//       <span className="ut__skeleton pm__skeleton-field" />
//     </div>
//     <div className="pm__skeleton-group">
//       <span className="ut__skeleton pm__skeleton-label" />
//       <span className="ut__skeleton pm__skeleton-field" />
//     </div>
//     <div className="pm__skeleton-footer">
//       <span className="ut__skeleton pm__skeleton-btn" />
//     </div>
//   </div>
// );

// const ViewField = ({ label, value }) => (
//   <div className="pm__field">
//     <div className="pm__input-wrap pm__input-wrap--disabled">
//       <label className="pm__label">{label}</label>
//       <input type="text" value={value ?? ""} disabled readOnly />
//     </div>
//   </div>
// );

const FormField = ({ name, label, required, register, errors }) => {
  const hasError = !!errors[name];

  return (
    <div className="pm__field">
      <div
        className={`pm__input-wrap${hasError ? " pm__input-wrap--error" : ""}`}>
        <label className="pm__label">
          {label}
          {required && (
            <span className="pm__required">
              <PushPinIcon />
            </span>
          )}
        </label>
        <input type="text" {...register(name)} autoComplete="off" />
      </div>
      {hasError && (
        <p className="pm__error">
          <ReportProblemIcon />
          {errors[name]?.message}
        </p>
      )}
    </div>
  );
};

// NOTE: View/Edit mode is on hold until GET /permissions/{id} and
// PUT /permissions/{id} are confirmed by backend. This modal currently
// only supports the Add Permission flow (selectedId is unused for now).
const PermissionsModal = ({ open, onClose, selectedId = null }) => {
  // const isViewOnly = !!selectedId;
  // const [isEditMode, setIsEditMode] = useState(false);

  // const { data: permissionDetail, isFetching: permissionLoading } =
  //   useGetPermissionQuery(selectedId, { skip: !selectedId || !open });
  // const rowData = permissionDetail?.data ?? null;

  const [createPermission, { isLoading: isCreating }] =
    useCreatePermissionMutation();
  // const [updatePermission, { isLoading: isUpdating }] =
  //   useUpdatePermissionMutation();
  const isSaving = isCreating;

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
    if (open) {
      reset({ name: "", group: "", description: "" });
    }
  }, [open, reset]);

  // useEffect(() => {
  //   setIsEditMode(false);
  // }, [selectedId]);

  // useEffect(() => {
  //   if (rowData) {
  //     reset({
  //       name: rowData?.name ?? "",
  //       group: rowData?.group ?? "",
  //       description: rowData?.description ?? "",
  //     });
  //   }
  // }, [rowData, reset]);

  const onValidSubmit = (form) => {
    setPendingFormData(form);
    setConfirmOpen(true);
  };

  const handleConfirmSubmit = async () => {
    if (!pendingFormData) return;
    try {
      // if (isEditMode && selectedId) {
      //   await updatePermission({ id: selectedId, ...pendingFormData }).unwrap();
      //   window.__snackbar__?.enqueueSnackbar(
      //     "Permission updated successfully.",
      //     { variant: "success" },
      //   );
      // } else {
      await createPermission(pendingFormData).unwrap();
      window.__snackbar__?.enqueueSnackbar("Permission created successfully.", {
        variant: "success",
      });
      // }
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
    if (isSaving) return;
    setConfirmOpen(false);
    setPendingFormData(null);
  };

  // const handleEditClick = () => {
  //   setIsEditMode(true);
  // };

  // const handleCancelEdit = () => {
  //   setIsEditMode(false);
  //   reset({
  //     name: rowData?.name ?? "",
  //     group: rowData?.group ?? "",
  //     description: rowData?.description ?? "",
  //   });
  // };

  const handleModalClose = () => {
    // setIsEditMode(false);
    setConfirmOpen(false);
    setPendingFormData(null);
    onClose();
  };

  const headerIcon = <VpnKeyIcon className="pm__header-icon" />;
  const headerTitle = "Add Permission";

  return (
    <Dialog
      open={open}
      onClose={(e, reason) => {
        if (reason === "backdropClick") return;
        handleModalClose();
      }}
      disableEscapeKeyDown
      maxWidth="xs"
      fullWidth
      PaperProps={{ className: "pm__paper" }}>
      <div className="pm__header">
        <div className="pm__header-title">
          {headerIcon}
          <span>{headerTitle}</span>
        </div>
        <div className="pm__header-actions">
          <IconButton
            className="pm__close"
            onClick={handleModalClose}
            size="small">
            <CloseIcon fontSize="small" />
          </IconButton>
        </div>
      </div>

      <DialogContent className="pm__content">
        <form onSubmit={handleSubmit(onValidSubmit)} noValidate>
          <div className="pm__group">
            <p className="pm__group-label">Permission Details</p>
            <FormField
              name="name"
              label="Permission Name"
              required
              register={register}
              errors={errors}
            />
            <div style={{ marginTop: 12 }}>
              <FormField
                name="group"
                label="Group"
                required
                register={register}
                errors={errors}
              />
            </div>
            <div style={{ marginTop: 12 }}>
              <FormField
                name="description"
                label="Description"
                required
                register={register}
                errors={errors}
              />
            </div>
          </div>

          <div className="pm__footer">
            <SaveButton
              label={isSaving ? "Saving..." : "Add Permission"}
              onClick={handleSubmit(onValidSubmit)}
              disabled={isSaving}
            />
          </div>
        </form>
      </DialogContent>

      <ConfirmDialog
        open={confirmOpen}
        onClose={handleCancelConfirm}
        onConfirm={handleConfirmSubmit}
        isLoading={isSaving}
        title="Add Permission"
        message={`Are you sure you want to add "${pendingFormData?.name}"?`}
        confirmLabel="Add Permission"
        confirmVariant="success"
      />
    </Dialog>
  );
};

export default PermissionsModal;
