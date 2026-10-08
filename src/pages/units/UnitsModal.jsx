import { useEffect, useMemo, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import IconButton from "@mui/material/IconButton";
import Autocomplete from "@mui/material/Autocomplete";
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
import { useGetUsersQuery } from "../../features/api/usersmanagement/usersApi";
import { useGetAreasQuery } from "../../features/api/areas/areasApi";
import ConfirmDialog from "../../reusable-components/confirm-dialog/ConfirmDialog";
import "./UnitsModal.scss";

const schema = yup.object({
  code: yup.string().trim().required("Unit code is required."),
  name: yup.string().trim().required("Unit name is required."),
  unit_head_id: yup
    .number()
    .nullable()
    .transform((value, original) =>
      original === "" || original === null || original === undefined
        ? null
        : value,
    ),
  area_ids: yup.array().of(yup.number()).default([]),
});

const emptyValues = {
  code: "",
  name: "",
  unit_head_id: null,
  area_ids: [],
};

const normalizeList = (response) => {
  if (!response) return [];
  if (Array.isArray(response)) return response;
  if (Array.isArray(response.data?.data)) return response.data.data;
  if (Array.isArray(response.data)) return response.data;
  if (Array.isArray(response.result?.data)) return response.result.data;
  if (Array.isArray(response.result)) return response.result;
  return [];
};

const getUserLabel = (user) =>
  user?.full_name || user?.name || user?.username || "";

const getAreaLabel = (area) => area?.name || area?.code || "";

const autocompleteSlotProps = {
  paper: { className: "um__popup-paper" },
  popper: { placement: "bottom-start" },
  clearIndicator: { className: "um__indicator", size: "small" },
  popupIndicator: { className: "um__indicator", size: "small" },
};

const SkeletonLoader = () => (
  <div className="um__skeleton-wrap">
    {[0, 1, 2, 3].map((item) => (
      <div className="um__skeleton-group" key={item}>
        <span className="ut__skeleton um__skeleton-label" />
        <span className="ut__skeleton um__skeleton-field" />
      </div>
    ))}
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

  const { data: usersData, isFetching: usersLoading } = useGetUsersQuery(
    { status: "active", page: 1, per_page: 100 },
    { skip: !open },
  );

  const { data: areasData, isFetching: areasLoading } = useGetAreasQuery(
    { status: "active", page: 1, per_page: 100 },
    { skip: !open },
  );

  const userOptions = useMemo(() => normalizeList(usersData), [usersData]);
  const areaOptions = useMemo(() => normalizeList(areasData), [areasData]);

  const {
    register,
    handleSubmit,
    reset,
    control,
    watch,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: emptyValues,
  });

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingFormData, setPendingFormData] = useState(null);

  const watchedHeadId = watch("unit_head_id");
  const watchedAreaIds = watch("area_ids");

  const getHeadValue = (id) => {
    if (id === null || id === undefined) return null;
    const found = userOptions.find((user) => user.id === id);
    if (found) return found;
    if (selectedRow?.unit_head?.id === id) return selectedRow.unit_head;
    return { id, full_name: `User #${id}` };
  };

  const getAreaValues = (ids) =>
    (ids ?? []).map((id) => {
      const found =
        areaOptions.find((area) => area.id === id) ||
        (selectedRow?.areas ?? []).find((area) => area.id === id);
      return found || { id, name: `Area #${id}` };
    });

  useEffect(() => {
    if (!open) return;
    if (!selectedId) {
      setMode("add");
      setSelectedRow(null);
      reset(emptyValues);
    } else {
      setMode("view");
    }
  }, [open, selectedId, reset]);

  useEffect(() => {
    if (open && selectedId && unitData) {
      const data = unitData?.data ?? null;
      setSelectedRow(data);
      reset({
        code: data?.code ?? "",
        name: data?.name ?? "",
        unit_head_id: data?.unit_head_id ?? data?.unit_head?.id ?? null,
        area_ids:
          data?.area_ids ?? (data?.areas ?? []).map((area) => area.id) ?? [],
      });
    }
  }, [open, selectedId, unitData, reset]);

  const onValidSubmit = (form) => {
    setPendingFormData({
      code: form.code,
      name: form.name,
      unit_head_id: form.unit_head_id ?? null,
      area_ids: form.area_ids ?? [],
    });
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
  const viewHead = getHeadValue(watchedHeadId);
  const viewAreas = getAreaValues(watchedAreaIds);

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
                  <label className="um__label">Unit Code</label>
                  <input
                    type="text"
                    value={selectedRow?.code ?? ""}
                    disabled
                    readOnly
                  />
                </div>
              </div>
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
              <div className="um__field">
                <div className="um__input-wrap um__input-wrap--disabled">
                  <label className="um__label">Unit Head</label>
                  <input
                    type="text"
                    value={viewHead ? getUserLabel(viewHead) : ""}
                    disabled
                    readOnly
                  />
                </div>
              </div>
              <div className="um__field">
                <div className="um__input-wrap um__input-wrap--multi um__input-wrap--disabled">
                  <label className="um__label">Areas</label>
                  {viewAreas.length > 0 ? (
                    viewAreas.map((area) => (
                      <span className="um__chip-static" key={area.id}>
                        {getAreaLabel(area)}
                      </span>
                    ))
                  ) : (
                    <span className="um__empty">No areas assigned</span>
                  )}
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
                  className={`um__input-wrap${errors.code ? " um__input-wrap--error" : ""}`}>
                  <label className="um__label">
                    Unit Code
                    <span className="um__required">*</span>
                  </label>
                  <input type="text" {...register("code")} autoComplete="off" />
                </div>
                {errors.code && (
                  <p className="um__error">
                    <ReportProblemIcon />
                    {errors.code?.message}
                  </p>
                )}
              </div>

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

              <div className="um__field">
                <Controller
                  name="unit_head_id"
                  control={control}
                  render={({ field }) => (
                    <Autocomplete
                      options={userOptions}
                      loading={usersLoading}
                      value={getHeadValue(field.value)}
                      onChange={(event, item) =>
                        field.onChange(item?.id ?? null)
                      }
                      getOptionLabel={getUserLabel}
                      isOptionEqualToValue={(option, value) =>
                        option?.id === value?.id
                      }
                      noOptionsText={
                        usersLoading ? "Loading users..." : "No users found"
                      }
                      slotProps={autocompleteSlotProps}
                      renderInput={(params) => (
                        <div
                          ref={params.slotProps?.input?.ref}
                          className={`um__input-wrap um__input-wrap--select${errors.unit_head_id ? " um__input-wrap--error" : ""}`}>
                          <label className="um__label">Unit Head</label>
                          <input type="text" {...params.slotProps?.htmlInput} />
                          {params.slotProps?.input?.endAdornment}
                        </div>
                      )}
                    />
                  )}
                />
                {errors.unit_head_id && (
                  <p className="um__error">
                    <ReportProblemIcon />
                    {errors.unit_head_id?.message}
                  </p>
                )}
              </div>

              <div className="um__field">
                <Controller
                  name="area_ids"
                  control={control}
                  render={({ field }) => (
                    <Autocomplete
                      multiple
                      disableCloseOnSelect
                      size="small"
                      options={areaOptions}
                      loading={areasLoading}
                      value={getAreaValues(field.value)}
                      onChange={(event, items) =>
                        field.onChange(items.map((item) => item.id))
                      }
                      getOptionLabel={getAreaLabel}
                      isOptionEqualToValue={(option, value) =>
                        option?.id === value?.id
                      }
                      noOptionsText={
                        areasLoading ? "Loading areas..." : "No areas found"
                      }
                      slotProps={{
                        ...autocompleteSlotProps,
                        chip: { className: "um__chip", size: "small" },
                      }}
                      renderInput={(params) => (
                        <div
                          ref={params.slotProps?.input?.ref}
                          className={`um__input-wrap um__input-wrap--select um__input-wrap--multi${errors.area_ids ? " um__input-wrap--error" : ""}`}>
                          <label className="um__label">Areas</label>
                          {params.slotProps?.input?.startAdornment}
                          <input type="text" {...params.slotProps?.htmlInput} />
                          {params.slotProps?.input?.endAdornment}
                        </div>
                      )}
                    />
                  )}
                />
                {errors.area_ids && (
                  <p className="um__error">
                    <ReportProblemIcon />
                    {errors.area_ids?.message}
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
