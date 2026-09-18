import { useEffect, useState, useRef, useMemo } from "react";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import IconButton from "@mui/material/IconButton";
import Checkbox from "@mui/material/Checkbox";
import CloseIcon from "@mui/icons-material/Close";
import ChecklistIcon from "@mui/icons-material/Checklist";
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
  useGetChecklistTypeQuery,
  useCreateChecklistTypeMutation,
  useUpdateChecklistTypeMutation,
} from "../../features/api/checklist-type/checklistTypeApi";
import { useGetAreasQuery } from "../../features/api/areas/areasApi";
import ConfirmDialog from "../../reusable-components/confirm-dialog/ConfirmDialog";
import "./ChecklistTypeModal.scss";

const schema = yup.object({
  name: yup.string().required("Checklist type name is required."),
  department_code: yup.string().nullable(),
  area_ids: yup.array().of(yup.number()).nullable(),
});

const getAreaOptionLabel = (area) => {
  if (!area) return "";
  return area.code ? `${area.code} - ${area.name}` : (area.name ?? "");
};

const MultiSearchSelect = ({
  value = [],
  onChange,
  options,
  getOptionLabel,
  loading,
  error,
  placeholder,
  disabled,
}) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const wrapRef = useRef(null);

  const selectedOptions = options.filter((o) => value.includes(o.id));

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

  const handleToggleOpen = () => {
    if (disabled) return;
    setOpen((prev) => !prev);
  };

  const handleToggleOption = (option) => {
    const exists = value.includes(option.id);
    onChange(
      exists ? value.filter((id) => id !== option.id) : [...value, option.id],
    );
  };

  const handleRemoveChip = (id, e) => {
    e.stopPropagation();
    onChange(value.filter((v) => v !== id));
  };

  return (
    <div
      ref={wrapRef}
      className={`ctm__ac${error ? " ctm__ac--error" : ""}${open ? " ctm__ac--open" : ""}${disabled ? " ctm__ac--disabled" : ""}`}>
      <div className="ctm__ac-box" onClick={handleToggleOpen}>
        <div className="ctm__ac-box-content">
          {selectedOptions.length > 0 && (
            <div className="ctm__ac-chips">
              {selectedOptions.map((option) => (
                <span key={option.id} className="ctm__ac-chip">
                  {getOptionLabel(option)}
                  {!disabled && (
                    <CloseIcon
                      fontSize="small"
                      className="ctm__ac-chip-remove"
                      onClick={(e) => handleRemoveChip(option.id, e)}
                    />
                  )}
                </span>
              ))}
            </div>
          )}
          {open ? (
            <div className="ctm__ac-search-wrap">
              <SearchIcon style={{ fontSize: "1rem" }} />
              <input
                className="ctm__ac-input"
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onClick={(e) => e.stopPropagation()}
                placeholder="Search..."
              />
            </div>
          ) : selectedOptions.length === 0 ? (
            <span className="ctm__ac-placeholder">
              {loading ? "Loading..." : placeholder}
            </span>
          ) : null}
        </div>
        <span className="ctm__ac-arrow">
          {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
        </span>
      </div>

      {open && (
        <div className="ctm__ac-dropdown">
          <div className="ctm__ac-options">
            {loading ? (
              <p className="ctm__ac-empty">Loading...</p>
            ) : filteredOptions.length === 0 ? (
              <p className="ctm__ac-empty">No results found.</p>
            ) : (
              filteredOptions.map((option) => {
                const isSelected = value.includes(option.id);
                return (
                  <div
                    key={option.id}
                    className={`ctm__ac-option${isSelected ? " ctm__ac-option--selected" : ""}`}
                    onClick={() => handleToggleOption(option)}>
                    <Checkbox
                      checked={isSelected}
                      size="small"
                      className="ctm__ac-option-checkbox"
                      onClick={(e) => e.stopPropagation()}
                      onChange={() => handleToggleOption(option)}
                    />
                    {getOptionLabel(option)}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const SkeletonLoader = () => (
  <div className="ctm__skeleton-wrap">
    <div className="ctm__skeleton-group">
      <span className="ut__skeleton ctm__skeleton-label" />
      <span className="ut__skeleton ctm__skeleton-field" />
    </div>
    <div className="ctm__skeleton-group">
      <span className="ut__skeleton ctm__skeleton-label" />
      <span className="ut__skeleton ctm__skeleton-field" />
    </div>
    <div className="ctm__skeleton-group">
      <span className="ut__skeleton ctm__skeleton-label" />
      <span className="ut__skeleton ctm__skeleton-field" />
    </div>
    <div className="ctm__skeleton-footer">
      <span className="ut__skeleton ctm__skeleton-btn" />
    </div>
  </div>
);

const ChecklistTypeModal = ({ open, onClose, selectedId = null }) => {
  const [mode, setMode] = useState("add");
  const [selectedRow, setSelectedRow] = useState(null);

  const [createChecklistType, { isLoading: isCreating }] =
    useCreateChecklistTypeMutation();
  const [updateChecklistType, { isLoading: isUpdating }] =
    useUpdateChecklistTypeMutation();
  const isLoading = isCreating || isUpdating;

  const { data: checklistTypeData, isFetching: checklistTypeLoading } =
    useGetChecklistTypeQuery(selectedId, {
      skip: !selectedId || !open,
    });

  const { data: areasData, isFetching: areasLoading } = useGetAreasQuery(
    { status: "active" },
    { skip: !open },
  );
  const areaOptions = areasData?.data?.data ?? areasData?.data ?? [];

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
      department_code: "",
      area_ids: [],
    },
  });

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingFormData, setPendingFormData] = useState(null);

  useEffect(() => {
    if (!open) return;
    if (!selectedId) {
      setMode("add");
      setSelectedRow(null);
      reset({ name: "", department_code: "", area_ids: [] });
    } else {
      setMode("view");
    }
  }, [open, selectedId, reset]);

  useEffect(() => {
    if (open && selectedId && checklistTypeData) {
      const data = checklistTypeData?.data ?? null;
      setSelectedRow(data);
      reset({
        name: data?.name ?? "",
        department_code: data?.department_code ?? "",
        area_ids: data?.areas?.map((area) => area.id) ?? [],
      });
    }
  }, [open, selectedId, checklistTypeData, reset]);

  const onValidSubmit = (form) => {
    setPendingFormData(form);
    setConfirmOpen(true);
  };

  const handleConfirmSubmit = async () => {
    if (!pendingFormData) return;
    try {
      if (mode === "edit") {
        await updateChecklistType({
          id: selectedId,
          ...pendingFormData,
        }).unwrap();
        window.__snackbar__?.enqueueSnackbar(
          "Checklist type updated successfully.",
          { variant: "success" },
        );
      } else {
        await createChecklistType(pendingFormData).unwrap();
        window.__snackbar__?.enqueueSnackbar(
          "Checklist type created successfully.",
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
    add: <ChecklistIcon className="ctm__header-icon" />,
    view: <RemoveRedEyeIcon className="ctm__header-icon" />,
    edit: <EditIcon className="ctm__header-icon" />,
  };

  const headerTitle = {
    add: "Add Checklist Type",
    view: "View Checklist Type",
    edit: "Edit Checklist Type",
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
      PaperProps={{ className: "ctm__paper" }}>
      <div className="ctm__header">
        <div className="ctm__header-title">
          {headerIcon[mode]}
          <span>{headerTitle[mode]}</span>
        </div>
        <IconButton className="ctm__close" onClick={onClose} size="small">
          <CloseIcon fontSize="small" />
        </IconButton>
      </div>

      <DialogContent className="ctm__content">
        {checklistTypeLoading ? (
          <SkeletonLoader />
        ) : isView ? (
          <>
            <div className="ctm__group">
              <p className="ctm__group-label">Checklist Type Details</p>
              <div className="ctm__field">
                <div className="ctm__input-wrap ctm__input-wrap--disabled">
                  <label className="ctm__label">Name</label>
                  <input
                    type="text"
                    value={selectedRow?.name ?? ""}
                    disabled
                    readOnly
                  />
                </div>
              </div>
              <div className="ctm__field">
                <div className="ctm__input-wrap ctm__input-wrap--disabled">
                  <label className="ctm__label">Department Code</label>
                  <input
                    type="text"
                    value={selectedRow?.department_code ?? ""}
                    disabled
                    readOnly
                  />
                </div>
              </div>
              <div className="ctm__field">
                <label className="ctm__label ctm__label--static">Areas</label>
                <div className="ctm__view-chips">
                  {selectedRow?.areas?.length ? (
                    selectedRow.areas.map((area) => (
                      <span key={area.id} className="ctm__view-chip">
                        {getAreaOptionLabel(area)}
                      </span>
                    ))
                  ) : (
                    <span className="ctm__view-empty">No areas assigned</span>
                  )}
                </div>
              </div>
            </div>

            <div className="ctm__footer">
              <EditButton onClick={() => setMode("edit")} />
            </div>
          </>
        ) : (
          <form onSubmit={handleSubmit(onValidSubmit)} noValidate>
            <div className="ctm__group">
              <p className="ctm__group-label">Checklist Type Details</p>
              <div className="ctm__field">
                <div
                  className={`ctm__input-wrap${errors.name ? " ctm__input-wrap--error" : ""}`}>
                  <label className="ctm__label">
                    Name
                    <span className="ctm__required">*</span>
                  </label>
                  <input type="text" {...register("name")} autoComplete="off" />
                </div>
                {errors.name && (
                  <p className="ctm__error">
                    <ReportProblemIcon />
                    {errors.name?.message}
                  </p>
                )}
              </div>

              <div className="ctm__field">
                <div
                  className={`ctm__input-wrap${errors.department_code ? " ctm__input-wrap--error" : ""}`}>
                  <label className="ctm__label">Department Code</label>
                  <input
                    type="text"
                    {...register("department_code")}
                    autoComplete="off"
                  />
                </div>
                {errors.department_code && (
                  <p className="ctm__error">
                    <ReportProblemIcon />
                    {errors.department_code?.message}
                  </p>
                )}
              </div>

              <div className="ctm__field">
                <label className="ctm__label ctm__label--static">Areas</label>
                <Controller
                  name="area_ids"
                  control={control}
                  render={({ field: { onChange, value } }) => (
                    <MultiSearchSelect
                      value={value ?? []}
                      onChange={onChange}
                      options={areaOptions}
                      getOptionLabel={getAreaOptionLabel}
                      loading={areasLoading}
                      error={!!errors.area_ids}
                      placeholder="Select areas"
                    />
                  )}
                />
                {errors.area_ids && (
                  <p className="ctm__error">
                    <ReportProblemIcon />
                    {errors.area_ids?.message}
                  </p>
                )}
              </div>
            </div>

            <div className="ctm__footer">
              {selectedId && (
                <BackModalButton onClick={() => setMode("view")} />
              )}
              <SaveButton
                label={
                  isLoading
                    ? "Saving..."
                    : mode === "edit"
                      ? "Save Changes"
                      : "Add Checklist Type"
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
        title={mode === "edit" ? "Update Checklist Type" : "Add Checklist Type"}
        message={
          mode === "edit"
            ? `Are you sure you want to update "${pendingFormData?.name}"?`
            : `Are you sure you want to add "${pendingFormData?.name}"?`
        }
        confirmLabel={
          mode === "edit" ? "Update Checklist Type" : "Add Checklist Type"
        }
        confirmVariant="success"
      />
    </Dialog>
  );
};

export default ChecklistTypeModal;
