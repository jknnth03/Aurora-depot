import { useEffect, useMemo, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import IconButton from "@mui/material/IconButton";
import CloseIcon from "@mui/icons-material/Close";
import PeopleAltIcon from "@mui/icons-material/PeopleAlt";
import EditIcon from "@mui/icons-material/Edit";
import RemoveRedEyeIcon from "@mui/icons-material/RemoveRedEye";
import ReportProblemIcon from "@mui/icons-material/ReportProblem";
import {
  SaveButton,
  EditButton,
  BackModalButton,
} from "../../../reusable-components/universal-buttons/UniversalButtons";
import {
  useGetRoleQuery,
  useCreateRoleMutation,
  useUpdateRoleMutation,
} from "../../../features/api/usersmanagement/rolesApi";
import { useGetPermissionsQuery } from "../../../features/api/usersmanagement/permissionsApi";
import ConfirmDialog from "../../../reusable-components/confirm-dialog/ConfirmDialog";
import "./RolesModal.scss";

const schema = yup.object({
  name: yup.string().required("Role name is required."),
  description: yup.string().required("Description is required."),
  permissions: yup
    .array()
    .of(yup.string())
    .min(1, "At least one permission is required."),
});

const normalizePermissions = (permissions) =>
  (permissions ?? []).map((p) => (typeof p === "string" ? p : p?.name));

const formatLabel = (str) =>
  str.replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

const buildPermissionGroups = (permissions) => {
  const map = {};
  (permissions ?? []).forEach((perm) => {
    const name = typeof perm === "string" ? perm : perm?.name;
    if (!name || !name.includes(".")) return;
    const [moduleKey, ...actionParts] = name.split(".");
    const moduleLabel = formatLabel(moduleKey);
    const actionLabel = formatLabel(actionParts.join(" "));
    if (!map[moduleLabel]) map[moduleLabel] = [];
    map[moduleLabel].push({ value: name, label: actionLabel });
  });
  return Object.entries(map).map(([module, perms]) => ({
    module,
    permissions: perms,
  }));
};

const SkeletonLoader = () => (
  <div className="rm__skeleton-wrap">
    <div className="rm__skeleton-group">
      <span className="ut__skeleton rm__skeleton-label" />
      <span className="ut__skeleton rm__skeleton-field" />
    </div>
    <div className="rm__skeleton-group">
      <span className="ut__skeleton rm__skeleton-label" />
      <span className="ut__skeleton rm__skeleton-field" />
    </div>
    <div className="rm__skeleton-group">
      <span className="ut__skeleton rm__skeleton-label" />
      <span className="ut__skeleton rm__skeleton-field rm__skeleton-field--tall" />
    </div>
    <div className="rm__skeleton-footer">
      <span className="ut__skeleton rm__skeleton-btn" />
    </div>
  </div>
);

const PermissionsChecklist = ({
  groups,
  value = [],
  onChange,
  error,
  readOnly = false,
  isLoading = false,
}) => {
  const handleToggle = (perm) => {
    if (readOnly) return;
    const already = value.includes(perm);
    onChange(already ? value.filter((v) => v !== perm) : [...value, perm]);
  };

  if (isLoading) {
    return (
      <div className="rm__perm-wrap">
        <span className="ut__skeleton rm__skeleton-field rm__skeleton-field--tall" />
      </div>
    );
  }

  if (!groups || groups.length === 0) {
    return (
      <div className="rm__perm-wrap">
        <p className="rm__perm-empty">No permissions available.</p>
      </div>
    );
  }

  return (
    <div className={`rm__perm-wrap${error ? " rm__perm-wrap--error" : ""}`}>
      {groups.map((group) => (
        <div key={group.module} className="rm__perm-group">
          <p className="rm__perm-group-label">{group.module}</p>
          <div className="rm__perm-options">
            {group.permissions.map((perm) => {
              const checked = value.includes(perm.value);
              return (
                <div
                  key={perm.value}
                  className={`rm__perm-option${checked ? " rm__perm-option--selected" : ""}${
                    readOnly ? " rm__perm-option--readonly" : ""
                  }`}
                  onClick={() => handleToggle(perm.value)}>
                  <span
                    className={`rm__ac-checkbox${checked ? " rm__ac-checkbox--checked" : ""}`}
                  />
                  {perm.label}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};

const RolesModal = ({ open, onClose, selectedId = null }) => {
  const [mode, setMode] = useState("add");
  const [selectedRow, setSelectedRow] = useState(null);

  const [createRole, { isLoading: isCreating }] = useCreateRoleMutation();
  const [updateRole, { isLoading: isUpdating }] = useUpdateRoleMutation();
  const isLoading = isCreating || isUpdating;

  const { data: roleData, isFetching: roleLoading } = useGetRoleQuery(
    selectedId,
    {
      skip: !selectedId || !open,
    },
  );

  const { data: permissionsData, isFetching: permissionsLoading } =
    useGetPermissionsQuery(undefined, { skip: !open });

  const allPermissions = useMemo(
    () => permissionsData?.data?.data ?? permissionsData?.data ?? [],
    [permissionsData],
  );

  const permissionGroups = useMemo(
    () => buildPermissionGroups(allPermissions),
    [allPermissions],
  );

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      name: "",
      description: "",
      permissions: [],
    },
  });

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingFormData, setPendingFormData] = useState(null);

  useEffect(() => {
    if (!open) return;
    if (!selectedId) {
      setMode("add");
      setSelectedRow(null);
      reset({ name: "", description: "", permissions: [] });
    } else {
      setMode("view");
    }
  }, [open, selectedId, reset]);

  useEffect(() => {
    if (open && selectedId && roleData) {
      const data = roleData?.data ?? null;
      setSelectedRow(data);
      reset({
        name: data?.name ?? "",
        description: data?.description ?? "",
        permissions: normalizePermissions(data?.permissions),
      });
    }
  }, [open, selectedId, roleData, reset]);

  const onValidSubmit = (form) => {
    setPendingFormData(form);
    setConfirmOpen(true);
  };

  const handleConfirmSubmit = async () => {
    if (!pendingFormData) return;
    try {
      if (mode === "edit") {
        await updateRole({ id: selectedId, ...pendingFormData }).unwrap();
        window.__snackbar__?.enqueueSnackbar("Role updated successfully.", {
          variant: "success",
        });
      } else {
        await createRole(pendingFormData).unwrap();
        window.__snackbar__?.enqueueSnackbar("Role created successfully.", {
          variant: "success",
        });
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

  const headerIcon = {
    add: <PeopleAltIcon className="rm__header-icon" />,
    view: <RemoveRedEyeIcon className="rm__header-icon" />,
    edit: <EditIcon className="rm__header-icon" />,
  };

  const headerTitle = {
    add: "Add Role",
    view: "View Role",
    edit: "Edit Role",
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
        {roleLoading ? (
          <SkeletonLoader />
        ) : isView ? (
          <>
            <div className="rm__group">
              <p className="rm__group-label">Role Details</p>
              <div className="rm__field">
                <div className="rm__input-wrap rm__input-wrap--disabled">
                  <label className="rm__label">Role Name</label>
                  <input
                    type="text"
                    value={selectedRow?.name ?? ""}
                    disabled
                    readOnly
                  />
                </div>
              </div>
              <div className="rm__field" style={{ marginTop: 12 }}>
                <div className="rm__input-wrap rm__input-wrap--disabled">
                  <label className="rm__label">Description</label>
                  <input
                    type="text"
                    value={selectedRow?.description ?? ""}
                    disabled
                    readOnly
                  />
                </div>
              </div>
            </div>

            <div className="rm__group">
              <p className="rm__group-label">Permissions</p>
              <PermissionsChecklist
                groups={permissionGroups}
                value={normalizePermissions(selectedRow?.permissions)}
                readOnly
                isLoading={permissionsLoading}
              />
            </div>

            <div className="rm__footer">
              <EditButton onClick={() => setMode("edit")} />
            </div>
          </>
        ) : (
          <form onSubmit={handleSubmit(onValidSubmit)} noValidate>
            <div className="rm__group">
              <p className="rm__group-label">Role Details</p>
              <div className="rm__field">
                <div
                  className={`rm__input-wrap${errors.name ? " rm__input-wrap--error" : ""}`}>
                  <label className="rm__label">
                    Role Name
                    <span className="rm__required">*</span>
                  </label>
                  <input type="text" {...register("name")} autoComplete="off" />
                </div>
                {errors.name && (
                  <p className="rm__error">
                    <ReportProblemIcon />
                    {errors.name?.message}
                  </p>
                )}
              </div>

              <div className="rm__field" style={{ marginTop: 12 }}>
                <div
                  className={`rm__input-wrap${errors.description ? " rm__input-wrap--error" : ""}`}>
                  <label className="rm__label">
                    Description
                    <span className="rm__required">*</span>
                  </label>
                  <input
                    type="text"
                    {...register("description")}
                    autoComplete="off"
                  />
                </div>
                {errors.description && (
                  <p className="rm__error">
                    <ReportProblemIcon />
                    {errors.description?.message}
                  </p>
                )}
              </div>
            </div>

            <div className="rm__group">
              <p className="rm__group-label">Permissions</p>
              <Controller
                name="permissions"
                control={control}
                render={({ field }) => (
                  <PermissionsChecklist
                    groups={permissionGroups}
                    value={field.value}
                    onChange={field.onChange}
                    error={!!errors.permissions}
                    isLoading={permissionsLoading}
                  />
                )}
              />
              {errors.permissions && (
                <p className="rm__error" style={{ marginTop: 6 }}>
                  <ReportProblemIcon />
                  {errors.permissions?.message}
                </p>
              )}
            </div>

            <div className="rm__footer">
              {selectedId && (
                <BackModalButton onClick={() => setMode("view")} />
              )}
              <SaveButton
                label={
                  isLoading
                    ? "Saving..."
                    : mode === "edit"
                      ? "Save Changes"
                      : "Add Role"
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
        title={mode === "edit" ? "Update Role" : "Add Role"}
        message={
          mode === "edit"
            ? `Are you sure you want to update "${pendingFormData?.name}"?`
            : `Are you sure you want to add "${pendingFormData?.name}"?`
        }
        confirmLabel={mode === "edit" ? "Update Role" : "Add Role"}
        confirmVariant="success"
      />
    </Dialog>
  );
};

export default RolesModal;
