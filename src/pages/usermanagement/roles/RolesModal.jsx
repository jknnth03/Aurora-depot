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
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import FolderSpecialIcon from "@mui/icons-material/FolderSpecial";
import WidgetsIcon from "@mui/icons-material/Widgets";
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
import { MODULES, iconStyles } from "../../../config/modules";
import "./RolesModal.scss";

const PERMISSIONS_KEY = "permissions";

const schema = yup.object({
  name: yup.string().required("Role name is required."),
  description: yup.string().required("Description is required."),
  permissions: yup
    .array()
    .of(yup.string())
    .min(1, "At least one permission is required."),
});

const normalizePermissions = (permissions) =>
  (permissions ?? [])
    .map((p) => (typeof p === "string" ? p : p?.name))
    .filter(Boolean);

const getRolePermissions = (role) =>
  normalizePermissions(role?.access_permission ?? role?.permissions);

const buildPayload = (form) => ({
  name: form.name,
  description: form.description,
  [PERMISSIONS_KEY]: form.permissions,
});

const formatLabel = (str) =>
  (str ?? "").replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

const buildPermissionTree = (permissions) => {
  const available = new Set(normalizePermissions(permissions));
  if (available.size === 0) return [];

  const used = new Set();
  const tree = [];

  Object.values(MODULES).forEach((mod) => {
    const children = mod.children
      ? Object.values(mod.children)
          .filter((c) => c.permissionKey && available.has(c.permissionKey))
          .map((c) => ({
            id: c.permissionId,
            value: c.permissionKey,
            label: c.name,
            icon: c.icon,
          }))
      : [];

    const self =
      mod.permissionKey && available.has(mod.permissionKey)
        ? mod.permissionKey
        : null;

    if (!self && children.length === 0) return;

    if (self) used.add(self);
    children.forEach((c) => used.add(c.value));

    tree.push({
      key: mod.permissionId,
      label: mod.name,
      icon: mod.icon,
      self,
      children,
    });
  });

  const others = Array.from(available)
    .filter((name) => !used.has(name))
    .map((name) => ({
      id: name,
      value: name,
      label: formatLabel(name),
      icon: <WidgetsIcon sx={iconStyles.child} />,
    }));

  if (others.length > 0) {
    tree.push({
      key: "OTHERS",
      label: "Others",
      icon: <FolderSpecialIcon sx={iconStyles.main} />,
      self: null,
      children: others,
    });
  }

  return tree;
};

const getNodeValues = (node) =>
  Array.from(
    new Set([
      ...(node.self ? [node.self] : []),
      ...node.children.map((c) => c.value),
    ]),
  );

const getAllPermissionValues = (tree) =>
  Array.from(new Set((tree ?? []).flatMap((node) => getNodeValues(node))));

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

const Checkbox = ({ checked, indeterminate }) => (
  <span
    className={`rm__ac-checkbox${checked ? " rm__ac-checkbox--checked" : ""}${
      indeterminate ? " rm__ac-checkbox--indeterminate" : ""
    }`}
  />
);

const PermissionsChecklist = ({
  tree,
  value = [],
  onChange,
  error,
  readOnly = false,
  isLoading = false,
}) => {
  const [expanded, setExpanded] = useState({});

  const allValues = useMemo(() => getAllPermissionValues(tree), [tree]);

  const isAllSelected =
    allValues.length > 0 && allValues.every((v) => value.includes(v));
  const isIndeterminate =
    !isAllSelected && allValues.some((v) => value.includes(v));

  const handleToggleAll = () => {
    if (readOnly) return;
    onChange(isAllSelected ? [] : allValues);
  };

  const handleToggleValue = (perm) => {
    if (readOnly) return;
    const already = value.includes(perm);
    onChange(already ? value.filter((v) => v !== perm) : [...value, perm]);
  };

  const handleToggleNode = (node) => {
    if (readOnly) return;
    const nodeValues = getNodeValues(node);
    const allChecked = nodeValues.every((v) => value.includes(v));
    if (allChecked) {
      onChange(value.filter((v) => !nodeValues.includes(v)));
    } else {
      onChange([...new Set([...value, ...nodeValues])]);
    }
  };

  const handleToggleExpand = (key) => {
    setExpanded((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  if (isLoading) {
    return (
      <div className="rm__perm-wrap">
        <span className="ut__skeleton rm__skeleton-field rm__skeleton-field--tall" />
      </div>
    );
  }

  if (!tree || tree.length === 0) {
    return (
      <div className="rm__perm-wrap">
        <p className="rm__perm-empty">No permissions available.</p>
      </div>
    );
  }

  return (
    <div className={`rm__perm-wrap${error ? " rm__perm-wrap--error" : ""}`}>
      <span className="rm__perm-legend">
        Permissions
        <span className="rm__required">*</span>
      </span>

      <div
        className={`rm__perm-row rm__perm-row--all${
          readOnly ? " rm__perm-row--readonly" : ""
        }`}
        onClick={handleToggleAll}>
        <Checkbox checked={isAllSelected} indeterminate={isIndeterminate} />
        <span className="rm__perm-all-label">Select All</span>
      </div>

      {tree.map((node) => {
        const nodeValues = getNodeValues(node);
        const isNodeAllSelected =
          nodeValues.length > 0 && nodeValues.every((v) => value.includes(v));
        const isNodeIndeterminate =
          !isNodeAllSelected && nodeValues.some((v) => value.includes(v));
        const hasChildren = node.children.length > 0;
        const isOpen = !!expanded[node.key];

        return (
          <div key={node.key} className="rm__perm-item">
            <div
              className={`rm__perm-row${
                hasChildren ? " rm__perm-row--expandable" : ""
              }${readOnly && !hasChildren ? " rm__perm-row--readonly" : ""}`}
              onClick={() =>
                hasChildren
                  ? handleToggleExpand(node.key)
                  : handleToggleNode(node)
              }>
              <span
                className="rm__perm-check-hit"
                onClick={(e) => {
                  e.stopPropagation();
                  handleToggleNode(node);
                }}>
                <Checkbox
                  checked={isNodeAllSelected}
                  indeterminate={isNodeIndeterminate}
                />
              </span>
              <span className="rm__perm-icon">{node.icon}</span>
              <span className="rm__perm-label">{node.label}</span>
              {hasChildren && (
                <span className="rm__perm-chevron">
                  {isOpen ? (
                    <KeyboardArrowUpIcon fontSize="small" />
                  ) : (
                    <KeyboardArrowDownIcon fontSize="small" />
                  )}
                </span>
              )}
            </div>

            {hasChildren && isOpen && (
              <div className="rm__perm-children">
                {node.children.map((child) => {
                  const checked = value.includes(child.value);
                  return (
                    <div
                      key={child.id}
                      className={`rm__perm-chip${
                        checked ? " rm__perm-chip--selected" : ""
                      }${readOnly ? " rm__perm-chip--readonly" : ""}`}
                      onClick={() => handleToggleValue(child.value)}>
                      <Checkbox checked={checked} />
                      <span className="rm__perm-chip-icon">{child.icon}</span>
                      <span>{child.label}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
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
    useGetPermissionsQuery({ pagination: "none" }, { skip: !open });

  const allPermissions = useMemo(
    () => permissionsData?.data?.data ?? permissionsData?.data ?? [],
    [permissionsData],
  );

  const permissionTree = useMemo(
    () => buildPermissionTree(allPermissions),
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
        permissions: getRolePermissions(data),
      });
    }
  }, [open, selectedId, roleData, reset]);

  const onValidSubmit = (form) => {
    setPendingFormData(form);
    setConfirmOpen(true);
  };

  const handleConfirmSubmit = async () => {
    if (!pendingFormData) return;
    const payload = buildPayload(pendingFormData);
    try {
      if (mode === "edit") {
        await updateRole({ id: selectedId, ...payload }).unwrap();
        window.__snackbar__?.enqueueSnackbar("Role updated successfully.", {
          variant: "success",
        });
      } else {
        await createRole(payload).unwrap();
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

  const handleBack = () => {
    reset({
      name: selectedRow?.name ?? "",
      description: selectedRow?.description ?? "",
      permissions: getRolePermissions(selectedRow),
    });
    setMode("view");
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
                tree={permissionTree}
                value={getRolePermissions(selectedRow)}
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
                    tree={permissionTree}
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
              {selectedId && <BackModalButton onClick={handleBack} />}
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
