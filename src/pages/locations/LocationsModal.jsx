import { useEffect, useState, useRef, useMemo } from "react";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import IconButton from "@mui/material/IconButton";
import CloseIcon from "@mui/icons-material/Close";
import PlaceIcon from "@mui/icons-material/Place";
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
  useGetLocationQuery,
  useCreateLocationMutation,
  useUpdateLocationMutation,
} from "../../features/api/locations/locationsApi";
import { useGetUsersQuery } from "../../features/api/usersmanagement/usersApi";
import ConfirmDialog from "../../reusable-components/confirm-dialog/ConfirmDialog";
import "./LocationsModal.scss";

const schema = yup.object({
  code: yup.string().required("Code is required."),
  name: yup.string().required("Location name is required."),
  location_head_id: yup
    .number()
    .typeError("Location head is required.")
    .required("Location head is required."),
});

const SkeletonLoader = () => (
  <div className="lm__skeleton-wrap">
    <div className="lm__skeleton-group">
      <span className="ut__skeleton lm__skeleton-label" />
      <span className="ut__skeleton lm__skeleton-field" />
    </div>
    <div className="lm__skeleton-group">
      <span className="ut__skeleton lm__skeleton-label" />
      <span className="ut__skeleton lm__skeleton-field" />
    </div>
    <div className="lm__skeleton-group">
      <span className="ut__skeleton lm__skeleton-label" />
      <span className="ut__skeleton lm__skeleton-field" />
    </div>
    <div className="lm__skeleton-footer">
      <span className="ut__skeleton lm__skeleton-btn" />
    </div>
  </div>
);

const getLocationHeadName = (locationHead) => {
  if (!locationHead) return "-";
  const parts = [
    locationHead.first_name,
    locationHead.middle_name,
    locationHead.last_name,
    locationHead.suffix,
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

const LocationHeadAutocomplete = ({
  value,
  onChange,
  options,
  loading,
  error,
}) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const wrapRef = useRef(null);

  const selectedUser = options.find((u) => u.id === value) ?? null;

  const filteredOptions = useMemo(() => {
    if (!query.trim()) return options;
    const q = query.toLowerCase();
    return options.filter((u) =>
      getUserOptionLabel(u).toLowerCase().includes(q),
    );
  }, [options, query]);

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

  const handleSelect = (user) => {
    onChange(user.id);
    setOpen(false);
    setQuery("");
  };

  return (
    <div
      ref={wrapRef}
      className={`lm__ac${error ? " lm__ac--error" : ""}${open ? " lm__ac--open" : ""}`}>
      <div className="lm__ac-box" onClick={() => setOpen((prev) => !prev)}>
        {open ? (
          <div className="lm__ac-search-wrap">
            <SearchIcon style={{ fontSize: "1rem" }} />
            <input
              className="lm__ac-input"
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onClick={(e) => e.stopPropagation()}
              placeholder={
                selectedUser ? getUserOptionLabel(selectedUser) : "Search..."
              }
            />
          </div>
        ) : selectedUser ? (
          <span className="lm__ac-value">
            {getUserOptionLabel(selectedUser)}
          </span>
        ) : (
          <span className="lm__ac-placeholder">
            {loading ? "Loading users..." : "Select location head"}
          </span>
        )}
        <span className="lm__ac-arrow">
          {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
        </span>
      </div>

      {open && (
        <div className="lm__ac-dropdown">
          <div className="lm__ac-options">
            {loading ? (
              <p className="lm__ac-empty">Loading users...</p>
            ) : filteredOptions.length === 0 ? (
              <p className="lm__ac-empty">No users found.</p>
            ) : (
              filteredOptions.map((user) => (
                <div
                  key={user.id}
                  className={`lm__ac-option${
                    user.id === value ? " lm__ac-option--selected" : ""
                  }`}
                  onClick={() => handleSelect(user)}>
                  {getUserOptionLabel(user)}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const LocationsModal = ({ open, onClose, selectedId = null }) => {
  const [mode, setMode] = useState("add");
  const [selectedRow, setSelectedRow] = useState(null);

  const [createLocation, { isLoading: isCreating }] =
    useCreateLocationMutation();
  const [updateLocation, { isLoading: isUpdating }] =
    useUpdateLocationMutation();
  const isLoading = isCreating || isUpdating;

  const { data: locationData, isFetching: locationLoading } =
    useGetLocationQuery(selectedId, {
      skip: !selectedId || !open,
    });

  const { data: usersData, isFetching: usersLoading } = useGetUsersQuery(
    {
      status: "active",
      page: 1,
      per_page: 1000,
    },
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
      location_head_id: "",
    },
  });

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingFormData, setPendingFormData] = useState(null);

  useEffect(() => {
    if (!open) return;
    if (!selectedId) {
      setMode("add");
      setSelectedRow(null);
      reset({ code: "", name: "", location_head_id: "" });
    } else {
      setMode("view");
    }
  }, [open, selectedId, reset]);

  useEffect(() => {
    if (open && selectedId && locationData) {
      const data = locationData?.data ?? null;
      setSelectedRow(data);
      reset({
        code: data?.code ?? "",
        name: data?.name ?? "",
        location_head_id: data?.location_head?.id ?? "",
      });
    }
  }, [open, selectedId, locationData, reset]);

  const onValidSubmit = (form) => {
    setPendingFormData(form);
    setConfirmOpen(true);
  };

  const handleConfirmSubmit = async () => {
    if (!pendingFormData) return;
    try {
      if (mode === "edit") {
        await updateLocation({ id: selectedId, ...pendingFormData }).unwrap();
        window.__snackbar__?.enqueueSnackbar("Location updated successfully.", {
          variant: "success",
        });
      } else {
        await createLocation(pendingFormData).unwrap();
        window.__snackbar__?.enqueueSnackbar("Location created successfully.", {
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
    add: <PlaceIcon className="lm__header-icon" />,
    view: <RemoveRedEyeIcon className="lm__header-icon" />,
    edit: <EditIcon className="lm__header-icon" />,
  };

  const headerTitle = {
    add: "Add Location",
    view: "View Location",
    edit: "Edit Location",
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
      PaperProps={{ className: "lm__paper" }}>
      <div className="lm__header">
        <div className="lm__header-title">
          {headerIcon[mode]}
          <span>{headerTitle[mode]}</span>
        </div>
        <IconButton className="lm__close" onClick={onClose} size="small">
          <CloseIcon fontSize="small" />
        </IconButton>
      </div>

      <DialogContent className="lm__content">
        {locationLoading ? (
          <SkeletonLoader />
        ) : isView ? (
          <>
            <div className="lm__group">
              <p className="lm__group-label">Location Details</p>
              <div className="lm__field">
                <div className="lm__input-wrap lm__input-wrap--disabled">
                  <label className="lm__label">Code</label>
                  <input
                    type="text"
                    value={selectedRow?.code ?? ""}
                    disabled
                    readOnly
                  />
                </div>
              </div>
              <div className="lm__field" style={{ marginTop: 12 }}>
                <div className="lm__input-wrap lm__input-wrap--disabled">
                  <label className="lm__label">Location Name</label>
                  <input
                    type="text"
                    value={selectedRow?.name ?? ""}
                    disabled
                    readOnly
                  />
                </div>
              </div>
              <div className="lm__field" style={{ marginTop: 12 }}>
                <div className="lm__input-wrap lm__input-wrap--disabled">
                  <label className="lm__label">Location Head</label>
                  <input
                    type="text"
                    value={getLocationHeadName(selectedRow?.location_head)}
                    disabled
                    readOnly
                  />
                </div>
              </div>
            </div>

            <div className="lm__footer">
              <EditButton onClick={() => setMode("edit")} />
            </div>
          </>
        ) : (
          <form onSubmit={handleSubmit(onValidSubmit)} noValidate>
            <div className="lm__group">
              <p className="lm__group-label">Location Details</p>
              <div className="lm__field">
                <div
                  className={`lm__input-wrap${errors.code ? " lm__input-wrap--error" : ""}`}>
                  <label className="lm__label">
                    Code
                    <span className="lm__required">*</span>
                  </label>
                  <input type="text" {...register("code")} autoComplete="off" />
                </div>
                {errors.code && (
                  <p className="lm__error">
                    <ReportProblemIcon />
                    {errors.code?.message}
                  </p>
                )}
              </div>

              <div className="lm__field" style={{ marginTop: 12 }}>
                <div
                  className={`lm__input-wrap${errors.name ? " lm__input-wrap--error" : ""}`}>
                  <label className="lm__label">
                    Location Name
                    <span className="lm__required">*</span>
                  </label>
                  <input type="text" {...register("name")} autoComplete="off" />
                </div>
                {errors.name && (
                  <p className="lm__error">
                    <ReportProblemIcon />
                    {errors.name?.message}
                  </p>
                )}
              </div>

              <div className="lm__field" style={{ marginTop: 12 }}>
                <label className="lm__label lm__label--static">
                  Location Head
                  <span className="lm__required">*</span>
                </label>
                <Controller
                  name="location_head_id"
                  control={control}
                  render={({ field }) => (
                    <LocationHeadAutocomplete
                      value={field.value}
                      onChange={field.onChange}
                      options={userOptions}
                      loading={usersLoading}
                      error={!!errors.location_head_id}
                    />
                  )}
                />
                {errors.location_head_id && (
                  <p className="lm__error">
                    <ReportProblemIcon />
                    {errors.location_head_id?.message}
                  </p>
                )}
              </div>
            </div>

            <div className="lm__footer">
              {selectedId && (
                <BackModalButton onClick={() => setMode("view")} />
              )}
              <SaveButton
                label={
                  isLoading
                    ? "Saving..."
                    : mode === "edit"
                      ? "Save Changes"
                      : "Add Location"
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
        title={mode === "edit" ? "Update Location" : "Add Location"}
        message={
          mode === "edit"
            ? `Are you sure you want to update "${pendingFormData?.name}"?`
            : `Are you sure you want to add "${pendingFormData?.name}"?`
        }
        confirmLabel={mode === "edit" ? "Update Location" : "Add Location"}
        confirmVariant="success"
      />
    </Dialog>
  );
};

export default LocationsModal;
