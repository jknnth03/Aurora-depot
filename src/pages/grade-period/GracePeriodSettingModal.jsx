import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import IconButton from "@mui/material/IconButton";
import CloseIcon from "@mui/icons-material/Close";
import EventBusyIcon from "@mui/icons-material/EventBusy";
import ReportProblemIcon from "@mui/icons-material/ReportProblem";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import { SaveButton } from "../../reusable-components/universal-buttons/UniversalButtons";
import {
  useCreateLateGraceDaySettingMutation,
  useGetLateGraceDaySettingsQuery,
} from "../../features/api/grace-period/gracePeriodSetting";
import ConfirmDialog from "../../reusable-components/confirm-dialog/ConfirmDialog";
import "./GracePeriodSettingModal.scss";

const schema = yup.object({
  days: yup
    .number()
    .typeError("Grace days is required.")
    .required("Grace days is required.")
    .min(1, "Grace days must be at least 1."),
  is_active: yup.boolean(),
});

const GracePeriodSettingModal = ({ open, onClose }) => {
  const [createLateGraceDaySetting, { isLoading }] =
    useCreateLateGraceDaySettingMutation();

  const { data: settingsData } = useGetLateGraceDaySettingsQuery(undefined, {
    skip: !open,
  });
  const activeSetting = settingsData?.data?.find(
    (setting) => setting.is_active,
  );

  const {
    register,
    handleSubmit,
    reset,
    control,
    watch,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      days: "",
      is_active: false,
    },
  });

  const watchedIsActive = watch("is_active");

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingFormData, setPendingFormData] = useState(null);

  useEffect(() => {
    if (!open) return;
    reset({ days: "", is_active: false });
  }, [open, reset]);

  const onValidSubmit = (form) => {
    setPendingFormData(form);
    setConfirmOpen(true);
  };

  const handleConfirmSubmit = async () => {
    if (!pendingFormData) return;
    try {
      await createLateGraceDaySetting(pendingFormData).unwrap();
      window.__snackbar__?.enqueueSnackbar(
        "Grace period setting created successfully.",
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
      PaperProps={{ className: "gpsm__paper" }}>
      <div className="gpsm__header">
        <div className="gpsm__header-title">
          <EventBusyIcon className="gpsm__header-icon" />
          <span>Add Grace Period Setting</span>
        </div>
        <IconButton className="gpsm__close" onClick={onClose} size="small">
          <CloseIcon fontSize="small" />
        </IconButton>
      </div>

      <DialogContent className="gpsm__content">
        <form onSubmit={handleSubmit(onValidSubmit)} noValidate>
          <div className="gpsm__group">
            <p className="gpsm__group-label">Grace Period Details</p>

            <div className="gpsm__field">
              <div
                className={`gpsm__input-wrap${
                  errors.days ? " gpsm__input-wrap--error" : ""
                }`}>
                <label className="gpsm__label">
                  Grace Days
                  <span className="gpsm__required">*</span>
                </label>
                <input
                  type="number"
                  min={1}
                  {...register("days")}
                  autoComplete="off"
                />
              </div>
              {errors.days && (
                <p className="gpsm__error">
                  <ReportProblemIcon />
                  {errors.days?.message}
                </p>
              )}
            </div>

            <div className="gpsm__field" style={{ marginTop: 16 }}>
              <Controller
                name="is_active"
                control={control}
                render={({ field }) => (
                  <div className="gpsm__toggle-row">
                    <label className="gpsm__toggle-label">
                      <input
                        type="checkbox"
                        className="gpsm__toggle-input"
                        checked={field.value}
                        onChange={(e) => field.onChange(e.target.checked)}
                      />
                      <span className="gpsm__toggle-track">
                        <span className="gpsm__toggle-thumb" />
                      </span>
                      Set as active setting
                    </label>
                  </div>
                )}
              />
              {watchedIsActive && activeSetting && (
                <p className="gpsm__note">
                  <InfoOutlinedIcon />
                  This will deactivate the current {activeSetting.days}-day
                  active setting.
                </p>
              )}
            </div>
          </div>

          <div className="gpsm__footer">
            <SaveButton
              label={isLoading ? "Saving..." : "Add Grace Period"}
              onClick={handleSubmit(onValidSubmit)}
              disabled={isLoading}
            />
          </div>
        </form>
      </DialogContent>

      <ConfirmDialog
        open={confirmOpen}
        onClose={handleCancelConfirm}
        onConfirm={handleConfirmSubmit}
        isLoading={isLoading}
        title="Add Grace Period Setting"
        message={`Are you sure you want to add a ${
          pendingFormData?.days ?? ""
        }-day grace period setting${
          pendingFormData?.is_active ? " and set it as active" : ""
        }?`}
        confirmLabel="Add Grace Period"
        confirmVariant="success"
      />
    </Dialog>
  );
};

export default GracePeriodSettingModal;
