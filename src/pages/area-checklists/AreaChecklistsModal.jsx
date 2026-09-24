import { useEffect, useState, useRef, useMemo } from "react";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import IconButton from "@mui/material/IconButton";
import CloseIcon from "@mui/icons-material/Close";
import FactCheckIcon from "@mui/icons-material/FactCheck";
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
  useGetAreaChecklistQuery,
  useCreateAreaChecklistMutation,
} from "../../features/api/area-checklists/areaChecklistsApi";
import { useGetAreasQuery } from "../../features/api/areas/areasApi";
import { useGetChecklistsQuery } from "../../features/api/qa-checklist/qaChecklistApi";
import ConfirmDialog from "../../reusable-components/confirm-dialog/ConfirmDialog";
import "./AreaChecklistsModal.scss";

const schema = yup.object({
  area_id: yup
    .number()
    .typeError("Area is required.")
    .required("Area is required."),
  checklist_id: yup
    .number()
    .typeError("Checklist is required.")
    .required("Checklist is required."),
});

const SkeletonLoader = () => (
  <div className="acl__skeleton-wrap">
    <div className="acl__skeleton-group">
      <span className="ut__skeleton acl__skeleton-label" />
      <span className="ut__skeleton acl__skeleton-field" />
    </div>
    <div className="acl__skeleton-group">
      <span className="ut__skeleton acl__skeleton-label" />
      <span className="ut__skeleton acl__skeleton-field" />
    </div>
    <div className="acl__skeleton-footer">
      <span className="ut__skeleton acl__skeleton-btn" />
    </div>
  </div>
);

const getAreaOptionLabel = (area) => {
  if (!area) return "";
  return area.name ?? `Area #${area.id}`;
};

const getChecklistOptionLabel = (checklist) => {
  if (!checklist) return "";
  return checklist.name ?? `Checklist #${checklist.id}`;
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
      className={`acl__ac${error ? " acl__ac--error" : ""}${open ? " acl__ac--open" : ""}`}>
      <div className="acl__ac-box" onClick={() => setOpen((prev) => !prev)}>
        {open ? (
          <div className="acl__ac-search-wrap">
            <SearchIcon style={{ fontSize: "1rem" }} />
            <input
              className="acl__ac-input"
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
          <span className="acl__ac-value">
            {getOptionLabel(selectedOption)}
          </span>
        ) : (
          <span className="acl__ac-placeholder">
            {loading ? "Loading..." : placeholder}
          </span>
        )}
        <span className="acl__ac-arrow">
          {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
        </span>
      </div>

      {open && (
        <div className="acl__ac-dropdown">
          <div className="acl__ac-options">
            {loading ? (
              <p className="acl__ac-empty">Loading...</p>
            ) : filteredOptions.length === 0 ? (
              <p className="acl__ac-empty">No results found.</p>
            ) : (
              filteredOptions.map((option) => (
                <div
                  key={option.id}
                  className={`acl__ac-option${
                    option.id === value ? " acl__ac-option--selected" : ""
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

const AreaChecklistsModal = ({ open, onClose, selectedId = null }) => {
  const [mode, setMode] = useState("add");
  const [selectedRow, setSelectedRow] = useState(null);

  const [createAreaChecklist, { isLoading: isCreating }] =
    useCreateAreaChecklistMutation();
  const isLoading = isCreating;

  const { data: areaChecklistData, isFetching: areaChecklistLoading } =
    useGetAreaChecklistQuery(selectedId, {
      skip: !selectedId || !open,
    });

  const { data: areasData, isFetching: areasLoading } = useGetAreasQuery(
    { status: "active", page: 1, per_page: 1000 },
    { skip: !open },
  );
  const areaOptions = areasData?.data?.data ?? [];

  const { data: checklistsData, isFetching: checklistsLoading } =
    useGetChecklistsQuery(
      { status: "active", page: 1, per_page: 1000 },
      { skip: !open },
    );
  const checklistOptions = checklistsData?.data?.data ?? [];

  const {
    register: _register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      area_id: "",
      checklist_id: "",
    },
  });

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingFormData, setPendingFormData] = useState(null);

  useEffect(() => {
    if (!open) return;
    if (!selectedId) {
      setMode("add");
      setSelectedRow(null);
      reset({ area_id: "", checklist_id: "" });
    } else {
      setMode("view");
    }
  }, [open, selectedId, reset]);

  useEffect(() => {
    if (open && selectedId && areaChecklistData) {
      const data = areaChecklistData?.data ?? null;
      setSelectedRow(data);
      reset({
        area_id: data?.area?.id ?? "",
        checklist_id: data?.checklist?.id ?? "",
      });
    }
  }, [open, selectedId, areaChecklistData, reset]);

  const onValidSubmit = (form) => {
    setPendingFormData(form);
    setConfirmOpen(true);
  };

  const handleConfirmSubmit = async () => {
    if (!pendingFormData) return;
    try {
      await createAreaChecklist(pendingFormData).unwrap();
      window.__snackbar__?.enqueueSnackbar(
        "Area checklist created successfully.",
        { variant: "success" },
      );
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
    add: <FactCheckIcon className="acl__header-icon" />,
    view: <RemoveRedEyeIcon className="acl__header-icon" />,
    edit: <EditIcon className="acl__header-icon" />,
  };

  const headerTitle = {
    add: "Add Area Checklist",
    view: "View Area Checklist",
    edit: "Edit Area Checklist",
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
      PaperProps={{ className: "acl__paper" }}>
      <div className="acl__header">
        <div className="acl__header-title">
          {headerIcon[mode]}
          <span>{headerTitle[mode]}</span>
        </div>
        <IconButton className="acl__close" onClick={onClose} size="small">
          <CloseIcon fontSize="small" />
        </IconButton>
      </div>

      <DialogContent className="acl__content">
        {areaChecklistLoading ? (
          <SkeletonLoader />
        ) : isView ? (
          <>
            <div className="acl__group">
              <p className="acl__group-label">Area Checklist Details</p>
              <div className="acl__field">
                <div className="acl__input-wrap acl__input-wrap--disabled">
                  <label className="acl__label">Area</label>
                  <input
                    type="text"
                    value={selectedRow?.area?.name ?? "-"}
                    disabled
                    readOnly
                  />
                </div>
              </div>
              <div className="acl__field" style={{ marginTop: 12 }}>
                <div className="acl__input-wrap acl__input-wrap--disabled">
                  <label className="acl__label">Checklist</label>
                  <input
                    type="text"
                    value={selectedRow?.checklist?.name ?? "-"}
                    disabled
                    readOnly
                  />
                </div>
              </div>
            </div>
          </>
        ) : (
          <form onSubmit={handleSubmit(onValidSubmit)} noValidate>
            <div className="acl__group">
              <p className="acl__group-label">Area Checklist Details</p>
              <div className="acl__field">
                <label className="acl__label acl__label--static">
                  Area
                  <span className="acl__required">*</span>
                </label>
                <Controller
                  name="area_id"
                  control={control}
                  render={({ field }) => (
                    <SearchSelect
                      value={field.value}
                      onChange={field.onChange}
                      options={areaOptions}
                      getOptionLabel={getAreaOptionLabel}
                      loading={areasLoading}
                      error={!!errors.area_id}
                      placeholder="Select area"
                    />
                  )}
                />
                {errors.area_id && (
                  <p className="acl__error">
                    <ReportProblemIcon />
                    {errors.area_id?.message}
                  </p>
                )}
              </div>

              <div className="acl__field" style={{ marginTop: 12 }}>
                <label className="acl__label acl__label--static">
                  Checklist
                  <span className="acl__required">*</span>
                </label>
                <Controller
                  name="checklist_id"
                  control={control}
                  render={({ field }) => (
                    <SearchSelect
                      value={field.value}
                      onChange={field.onChange}
                      options={checklistOptions}
                      getOptionLabel={getChecklistOptionLabel}
                      loading={checklistsLoading}
                      error={!!errors.checklist_id}
                      placeholder="Select checklist"
                    />
                  )}
                />
                {errors.checklist_id && (
                  <p className="acl__error">
                    <ReportProblemIcon />
                    {errors.checklist_id?.message}
                  </p>
                )}
              </div>
            </div>

            <div className="acl__footer">
              {selectedId && (
                <BackModalButton onClick={() => setMode("view")} />
              )}
              <SaveButton
                label={isLoading ? "Saving..." : "Add Area Checklist"}
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
        title="Add Area Checklist"
        message="Are you sure you want to add this area checklist?"
        confirmLabel="Add Area Checklist"
        confirmVariant="success"
      />
    </Dialog>
  );
};

export default AreaChecklistsModal;
