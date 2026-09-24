import { useEffect, useState, useRef, useMemo } from "react";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import IconButton from "@mui/material/IconButton";
import CloseIcon from "@mui/icons-material/Close";
import ApartmentIcon from "@mui/icons-material/Apartment";
import EditIcon from "@mui/icons-material/Edit";
import RemoveRedEyeIcon from "@mui/icons-material/RemoveRedEye";
import ReportProblemIcon from "@mui/icons-material/ReportProblem";
import SearchIcon from "@mui/icons-material/Search";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import {
  SaveButton,
  EditButton,
  BackModalButton,
} from "../../reusable-components/universal-buttons/UniversalButtons";
import {
  useGetDepartmentQuery,
  useCreateDepartmentMutation,
  useUpdateDepartmentMutation,
} from "../../features/api/departments/departmentsApi";
import { useGetUsersQuery } from "../../features/api/usersmanagement/usersApi";
import ConfirmDialog from "../../reusable-components/confirm-dialog/ConfirmDialog";
import "./DepartmentsModal.scss";

const schema = yup.object({
  code: yup.string().required("Code is required."),
  name: yup.string().required("Department name is required."),
  department_head_id: yup
    .number()
    .typeError("Department head is required.")
    .required("Department head is required."),
});

const SkeletonLoader = () => (
  <div className="dm__skeleton-wrap">
    <div className="dm__skeleton-group">
      <span className="ut__skeleton dm__skeleton-label" />
      <span className="ut__skeleton dm__skeleton-field" />
    </div>
    <div className="dm__skeleton-group">
      <span className="ut__skeleton dm__skeleton-label" />
      <span className="ut__skeleton dm__skeleton-field" />
    </div>
    <div className="dm__skeleton-group">
      <span className="ut__skeleton dm__skeleton-label" />
      <span className="ut__skeleton dm__skeleton-field" />
    </div>
    <div className="dm__skeleton-footer">
      <span className="ut__skeleton dm__skeleton-btn" />
    </div>
  </div>
);

const getDepartmentHeadName = (departmentHead) => {
  if (!departmentHead) return "-";
  const parts = [
    departmentHead.first_name,
    departmentHead.middle_name,
    departmentHead.last_name,
    departmentHead.suffix,
  ].filter(Boolean);
  return parts.join(" ");
};

const getUserOptionLabel = (user) => {
  if (!user) return "";
  if (user.full_name) return user.full_name;
  const parts = [
    user.first_name,
    user.middle_name,
    user.last_name,
    user.suffix,
  ].filter(Boolean);
  return parts.join(" ") || user.username || `User #${user.id}`;
};

const SearchSelect = ({
  value,
  onChange,
  options,
  getOptionLabel,
  loading,
  error,
  placeholder,
}) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const wrapRef = useRef(null);

  const selectedOption = options.find((o) => o.id === value) ?? null;

  const filteredOptions = useMemo(() => {
    if (!query.trim()) return options;
    const q = query.toLowerCase();
    return options.filter((o) => getOptionLabel(o).toLowerCase().includes(q));
  }, [options, query, getOptionLabel]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setOpen(false);
        setQuery("");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (option) => {
    onChange(option.id);
    setOpen(false);
    setQuery("");
  };

  return (
    <div
      ref={wrapRef}
      className={`dm__ac${error ? " dm__ac--error" : ""}${open ? " dm__ac--open" : ""}`}>
      <div className="dm__ac-box" onClick={() => setOpen((prev) => !prev)}>
        {open ? (
          <div className="dm__ac-search-wrap">
            <SearchIcon style={{ fontSize: "1rem" }} />
            <input
              className="dm__ac-input"
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onClick={(e) => e.stopPropagation()}
              placeholder={
                selectedOption ? getOptionLabel(selectedOption) : "Search..."
              }
            />
          </div>
        ) : selectedOption ? (
          <span className="dm__ac-value">{getOptionLabel(selectedOption)}</span>
        ) : (
          <span className="dm__ac-placeholder">
            {loading ? "Loading..." : placeholder}
          </span>
        )}
        <span className="dm__ac-arrow">
          {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
        </span>
      </div>

      {open && (
        <div className="dm__ac-dropdown">
          <div className="dm__ac-options">
            {loading ? (
              <p className="dm__ac-empty">Loading...</p>
            ) : filteredOptions.length === 0 ? (
              <p className="dm__ac-empty">No results found.</p>
            ) : (
              filteredOptions.map((option) => (
                <div
                  key={option.id}
                  className={`dm__ac-option${
                    option.id === value ? " dm__ac-option--selected" : ""
                  }`}
                  onClick={() => handleSelect(option)}>
                  {getOptionLabel(option)}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const DepartmentsModal = ({ open, onClose, selectedId = null }) => {
  const [mode, setMode] = useState("add");
  const [selectedRow, setSelectedRow] = useState(null);

  const [createDepartment, { isLoading: isCreating }] =
    useCreateDepartmentMutation();
  const [updateDepartment, { isLoading: isUpdating }] =
    useUpdateDepartmentMutation();
  const isLoading = isCreating || isUpdating;

  const { data: departmentData, isFetching: departmentLoading } =
    useGetDepartmentQuery(selectedId, {
      skip: !selectedId || !open,
    });

  const { data: usersData, isFetching: usersLoading } = useGetUsersQuery(
    { status: "active", page: 1, per_page: 1000 },
    { skip: !open },
  );
  const userOptions = usersData?.data?.data ?? [];

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      code: "",
      name: "",
      department_head_id: "",
    },
  });

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingFormData, setPendingFormData] = useState(null);

  useEffect(() => {
    if (!open) return;
    if (!selectedId) {
      setMode("add");
      setSelectedRow(null);
      reset({ code: "", name: "", department_head_id: "" });
    } else {
      setMode("view");
    }
  }, [open, selectedId, reset]);

  useEffect(() => {
    if (open && selectedId && departmentData) {
      const data = departmentData?.data ?? null;
      setSelectedRow(data);
      reset({
        code: data?.code ?? "",
        name: data?.name ?? "",
        department_head_id: data?.department_head?.id ?? "",
      });
    }
  }, [open, selectedId, departmentData, reset]);

  const onValidSubmit = (form) => {
    setPendingFormData(form);
    setConfirmOpen(true);
  };

  const handleConfirmSubmit = async () => {
    if (!pendingFormData) return;
    try {
      if (mode === "edit") {
        await updateDepartment({ id: selectedId, ...pendingFormData }).unwrap();
        window.__snackbar__?.enqueueSnackbar(
          "Department updated successfully.",
          { variant: "success" },
        );
      } else {
        await createDepartment(pendingFormData).unwrap();
        window.__snackbar__?.enqueueSnackbar(
          "Department created successfully.",
          { variant: "success" },
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

  const headerIcon = {
    add: <ApartmentIcon className="dm__header-icon" />,
    view: <RemoveRedEyeIcon className="dm__header-icon" />,
    edit: <EditIcon className="dm__header-icon" />,
  };

  const headerTitle = {
    add: "Add Department",
    view: "View Department",
    edit: "Edit Department",
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
      PaperProps={{ className: "dm__paper" }}>
      <div className="dm__header">
        <div className="dm__header-title">
          {headerIcon[mode]}
          <span>{headerTitle[mode]}</span>
        </div>
        <IconButton className="dm__close" onClick={onClose} size="small">
          <CloseIcon fontSize="small" />
        </IconButton>
      </div>

      <DialogContent className="dm__content">
        {departmentLoading ? (
          <SkeletonLoader />
        ) : isView ? (
          <>
            <div className="dm__group">
              <p className="dm__group-label">Department Details</p>
              <div className="dm__field">
                <div className="dm__input-wrap dm__input-wrap--disabled">
                  <label className="dm__label">Code</label>
                  <input
                    type="text"
                    value={selectedRow?.code ?? ""}
                    disabled
                    readOnly
                  />
                </div>
              </div>
              <div className="dm__field" style={{ marginTop: 12 }}>
                <div className="dm__input-wrap dm__input-wrap--disabled">
                  <label className="dm__label">Department Name</label>
                  <input
                    type="text"
                    value={selectedRow?.name ?? ""}
                    disabled
                    readOnly
                  />
                </div>
              </div>
              <div className="dm__field" style={{ marginTop: 12 }}>
                <div className="dm__input-wrap dm__input-wrap--disabled">
                  <label className="dm__label">Department Head</label>
                  <input
                    type="text"
                    value={getDepartmentHeadName(selectedRow?.department_head)}
                    disabled
                    readOnly
                  />
                </div>
              </div>
            </div>

            <div className="dm__footer">
              <EditButton onClick={() => setMode("edit")} />
            </div>
          </>
        ) : (
          <form onSubmit={handleSubmit(onValidSubmit)} noValidate>
            <div className="dm__group">
              <p className="dm__group-label">Department Details</p>
              <div className="dm__field">
                <div
                  className={`dm__input-wrap${errors.code ? " dm__input-wrap--error" : ""}`}>
                  <label className="dm__label">
                    Code
                    <span className="dm__required">*</span>
                  </label>
                  <input type="text" {...register("code")} autoComplete="off" />
                </div>
                {errors.code && (
                  <p className="dm__error">
                    <ReportProblemIcon />
                    {errors.code?.message}
                  </p>
                )}
              </div>

              <div className="dm__field" style={{ marginTop: 12 }}>
                <div
                  className={`dm__input-wrap${errors.name ? " dm__input-wrap--error" : ""}`}>
                  <label className="dm__label">
                    Department Name
                    <span className="dm__required">*</span>
                  </label>
                  <input type="text" {...register("name")} autoComplete="off" />
                </div>
                {errors.name && (
                  <p className="dm__error">
                    <ReportProblemIcon />
                    {errors.name?.message}
                  </p>
                )}
              </div>

              <div className="dm__field" style={{ marginTop: 12 }}>
                <label className="dm__label dm__label--static">
                  Department Head
                  <span className="dm__required">*</span>
                </label>
                <Controller
                  name="department_head_id"
                  control={control}
                  render={({ field }) => (
                    <SearchSelect
                      value={field.value}
                      onChange={field.onChange}
                      options={userOptions}
                      getOptionLabel={getUserOptionLabel}
                      loading={usersLoading}
                      error={!!errors.department_head_id}
                      placeholder="Select department head"
                    />
                  )}
                />
                {errors.department_head_id && (
                  <p className="dm__error">
                    <ReportProblemIcon />
                    {errors.department_head_id?.message}
                  </p>
                )}
              </div>
            </div>

            <div className="dm__footer">
              {selectedId && (
                <BackModalButton onClick={() => setMode("view")} />
              )}
              <SaveButton
                label={
                  isLoading
                    ? "Saving..."
                    : mode === "edit"
                      ? "Save Changes"
                      : "Add Department"
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
        title={mode === "edit" ? "Update Department" : "Add Department"}
        message={
          mode === "edit"
            ? `Are you sure you want to update "${pendingFormData?.name}"?`
            : `Are you sure you want to add "${pendingFormData?.name}"?`
        }
        confirmLabel={mode === "edit" ? "Update Department" : "Add Department"}
        confirmVariant="success"
      />
    </Dialog>
  );
};

export default DepartmentsModal;
