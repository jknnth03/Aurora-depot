import { useEffect, useState, useRef, useMemo } from "react";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import IconButton from "@mui/material/IconButton";
import CloseIcon from "@mui/icons-material/Close";
import MapIcon from "@mui/icons-material/Map";
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
  useGetAreaQuery,
  useCreateAreaMutation,
  useUpdateAreaMutation,
} from "../../features/api/areas/areasApi";
import { useGetUsersQuery } from "../../features/api/usersmanagement/usersApi";
import ConfirmDialog from "../../reusable-components/confirm-dialog/ConfirmDialog";
import "./AreasModal.scss";

const schema = yup.object({
  code: yup.string().required("Code is required."),
  name: yup.string().required("Area name is required."),
  unit_ids: yup.array().of(yup.number()).default([]),
  area_head_id: yup.number().nullable().typeError("Invalid area head."),
});

const SkeletonLoader = () => (
  <div className="areas-modal__skeleton-wrap">
    <div className="areas-modal__skeleton-group">
      <span className="ut__skeleton areas-modal__skeleton-label" />
      <span className="ut__skeleton areas-modal__skeleton-field" />
    </div>
    <div className="areas-modal__skeleton-group">
      <span className="ut__skeleton areas-modal__skeleton-label" />
      <span className="ut__skeleton areas-modal__skeleton-field" />
    </div>
    <div className="areas-modal__skeleton-group">
      <span className="ut__skeleton areas-modal__skeleton-label" />
      <span className="ut__skeleton areas-modal__skeleton-field" />
    </div>
    <div className="areas-modal__skeleton-footer">
      <span className="ut__skeleton areas-modal__skeleton-btn" />
    </div>
  </div>
);

const getAreaHeadName = (areaHead) => {
  if (!areaHead) return "-";
  const parts = [
    areaHead.first_name,
    areaHead.middle_name,
    areaHead.last_name,
    areaHead.suffix,
  ].filter(Boolean);
  return parts.length ? parts.join(" ") : "-";
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

const getAreaUnits = (area) => {
  if (!area) return [];
  if (Array.isArray(area.units)) return area.units;
  if (area.unit?.id) return [area.unit];
  return [];
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
      className={`areas-modal__ac${error ? " areas-modal__ac--error" : ""}${open ? " areas-modal__ac--open" : ""}`}>
      <div
        className="areas-modal__ac-box"
        onClick={() => setOpen((prev) => !prev)}>
        {open ? (
          <div className="areas-modal__ac-search-wrap">
            <SearchIcon style={{ fontSize: "1rem" }} />
            <input
              className="areas-modal__ac-input"
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
          <span className="areas-modal__ac-value">
            {getOptionLabel(selectedOption)}
          </span>
        ) : (
          <span className="areas-modal__ac-placeholder">
            {loading ? "Loading..." : placeholder}
          </span>
        )}
        <span className="areas-modal__ac-arrow">
          {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
        </span>
      </div>

      {open && (
        <div className="areas-modal__ac-dropdown">
          <div className="areas-modal__ac-options">
            {loading ? (
              <p className="areas-modal__ac-empty">Loading...</p>
            ) : filteredOptions.length === 0 ? (
              <p className="areas-modal__ac-empty">No results found.</p>
            ) : (
              filteredOptions.map((option) => (
                <div
                  key={option.id}
                  className={`areas-modal__ac-option${
                    option.id === value
                      ? " areas-modal__ac-option--selected"
                      : ""
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

const AreasModal = ({ open, onClose, selectedId = null }) => {
  const [mode, setMode] = useState("add");
  const [selectedRow, setSelectedRow] = useState(null);

  const [createArea, { isLoading: isCreating }] = useCreateAreaMutation();
  const [updateArea, { isLoading: isUpdating }] = useUpdateAreaMutation();
  const isLoading = isCreating || isUpdating;

  const { data: areaData, isFetching: areaLoading } = useGetAreaQuery(
    selectedId,
    {
      skip: !selectedId || !open,
    },
  );

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
      unit_ids: [],
      area_head_id: null,
    },
  });

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingFormData, setPendingFormData] = useState(null);

  useEffect(() => {
    if (!open) return;
    if (!selectedId) {
      setMode("add");
      setSelectedRow(null);
      reset({ code: "", name: "", unit_ids: [], area_head_id: null });
    } else {
      setMode("view");
    }
  }, [open, selectedId, reset]);

  useEffect(() => {
    if (open && selectedId && areaData) {
      const data = areaData?.data ?? null;
      setSelectedRow(data);
      reset({
        code: data?.code ?? "",
        name: data?.name ?? "",
        unit_ids: getAreaUnits(data).map((u) => u.id),
        area_head_id: data?.area_head?.id ?? null,
      });
    }
  }, [open, selectedId, areaData, reset]);

  const onValidSubmit = (form) => {
    setPendingFormData({
      code: form.code,
      name: form.name,
      unit_ids: mode === "edit" ? (form.unit_ids ?? []) : [],
      area_head_id: form.area_head_id ?? null,
    });
    setConfirmOpen(true);
  };

  const handleConfirmSubmit = async () => {
    if (!pendingFormData) return;
    try {
      if (mode === "edit") {
        await updateArea({ id: selectedId, ...pendingFormData }).unwrap();
        window.__snackbar__?.enqueueSnackbar("Area updated successfully.", {
          variant: "success",
        });
      } else {
        await createArea(pendingFormData).unwrap();
        window.__snackbar__?.enqueueSnackbar("Area created successfully.", {
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
    add: <MapIcon className="areas-modal__header-icon" />,
    view: <RemoveRedEyeIcon className="areas-modal__header-icon" />,
    edit: <EditIcon className="areas-modal__header-icon" />,
  };

  const headerTitle = {
    add: "Add Area",
    view: "View Area",
    edit: "Edit Area",
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
      slotProps={{ paper: { className: "areas-modal__paper" } }}>
      <div className="areas-modal__header">
        <div className="areas-modal__header-title">
          {headerIcon[mode]}
          <span>{headerTitle[mode]}</span>
        </div>
        <IconButton
          className="areas-modal__close"
          onClick={onClose}
          size="small">
          <CloseIcon fontSize="small" />
        </IconButton>
      </div>

      <DialogContent className="areas-modal__content">
        {areaLoading ? (
          <SkeletonLoader />
        ) : isView ? (
          <>
            <div className="areas-modal__group">
              <p className="areas-modal__group-label">Area Details</p>
              <div className="areas-modal__field">
                <div className="areas-modal__input-wrap areas-modal__input-wrap--disabled">
                  <label className="areas-modal__label">Code</label>
                  <input
                    type="text"
                    value={selectedRow?.code ?? ""}
                    disabled
                    readOnly
                  />
                </div>
              </div>
              <div className="areas-modal__field" style={{ marginTop: 12 }}>
                <div className="areas-modal__input-wrap areas-modal__input-wrap--disabled">
                  <label className="areas-modal__label">Area Name</label>
                  <input
                    type="text"
                    value={selectedRow?.name ?? ""}
                    disabled
                    readOnly
                  />
                </div>
              </div>
              <div className="areas-modal__field" style={{ marginTop: 12 }}>
                <div className="areas-modal__input-wrap areas-modal__input-wrap--disabled">
                  <label className="areas-modal__label">Area Head</label>
                  <input
                    type="text"
                    value={getAreaHeadName(selectedRow?.area_head)}
                    disabled
                    readOnly
                  />
                </div>
              </div>
            </div>

            <div className="areas-modal__footer">
              <EditButton onClick={() => setMode("edit")} />
            </div>
          </>
        ) : (
          <form onSubmit={handleSubmit(onValidSubmit)} noValidate>
            <div className="areas-modal__group">
              <p className="areas-modal__group-label">Area Details</p>
              <div className="areas-modal__field">
                <div
                  className={`areas-modal__input-wrap${errors.code ? " areas-modal__input-wrap--error" : ""}`}>
                  <label className="areas-modal__label">
                    Code
                    <span className="areas-modal__required">*</span>
                  </label>
                  <input type="text" {...register("code")} autoComplete="off" />
                </div>
                {errors.code && (
                  <p className="areas-modal__error">
                    <ReportProblemIcon />
                    {errors.code?.message}
                  </p>
                )}
              </div>

              <div className="areas-modal__field" style={{ marginTop: 12 }}>
                <div
                  className={`areas-modal__input-wrap${errors.name ? " areas-modal__input-wrap--error" : ""}`}>
                  <label className="areas-modal__label">
                    Area Name
                    <span className="areas-modal__required">*</span>
                  </label>
                  <input type="text" {...register("name")} autoComplete="off" />
                </div>
                {errors.name && (
                  <p className="areas-modal__error">
                    <ReportProblemIcon />
                    {errors.name?.message}
                  </p>
                )}
              </div>

              <div className="areas-modal__field" style={{ marginTop: 12 }}>
                <label className="areas-modal__label areas-modal__label--static">
                  Area Head
                </label>
                <Controller
                  name="area_head_id"
                  control={control}
                  render={({ field }) => (
                    <SearchSelect
                      value={field.value}
                      onChange={field.onChange}
                      options={userOptions}
                      getOptionLabel={getUserOptionLabel}
                      loading={usersLoading}
                      error={!!errors.area_head_id}
                      placeholder="Select area head"
                    />
                  )}
                />
                {errors.area_head_id && (
                  <p className="areas-modal__error">
                    <ReportProblemIcon />
                    {errors.area_head_id?.message}
                  </p>
                )}
              </div>
            </div>

            <div className="areas-modal__footer">
              {selectedId && (
                <BackModalButton onClick={() => setMode("view")} />
              )}
              <SaveButton
                label={
                  isLoading
                    ? "Saving..."
                    : mode === "edit"
                      ? "Save Changes"
                      : "Add Area"
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
        title={mode === "edit" ? "Update Area" : "Add Area"}
        message={
          mode === "edit"
            ? `Are you sure you want to update "${pendingFormData?.name}"?`
            : `Are you sure you want to add "${pendingFormData?.name}"?`
        }
        confirmLabel={mode === "edit" ? "Update Area" : "Add Area"}
        confirmVariant="success"
      />
    </Dialog>
  );
};

export default AreasModal;
