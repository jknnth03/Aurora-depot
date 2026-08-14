import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { createOneUserSchema } from "./OneUserModalSchema";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import IconButton from "@mui/material/IconButton";
import CloseIcon from "@mui/icons-material/Close";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import RemoveRedEyeIcon from "@mui/icons-material/RemoveRedEye";
import EditIcon from "@mui/icons-material/Edit";
import ReportProblemIcon from "@mui/icons-material/ReportProblem";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import { SaveButton } from "../../../reusable-components/universal-buttons/UniversalButtons";
import { useCreateOneUserMutation } from "../../../features/api/one-rdf/oneUserApi";
import ConfirmDialog from "../../../reusable-components/confirm-dialog/ConfirmDialog";
import "./OneUserModal.scss";

const FIELD_GROUPS = [
  {
    label: "Personal Information",
    fields: [
      { name: "first_name", label: "First Name", required: true, half: true },
      {
        name: "middle_name",
        label: "Middle Name",
        required: false,
        half: true,
      },
      { name: "last_name", label: "Last Name", required: true, half: true },
      { name: "suffix", label: "Suffix", required: false, half: true },
    ],
  },
  {
    label: "Account Credentials",
    fields: [
      { name: "id_prefix", label: "ID Prefix", required: true, half: true },
      { name: "id_no", label: "ID Number", required: true, half: true },
      { name: "username", label: "Username", required: true, half: true },
    ],
  },
];

const FormField = ({ name, label, required, register, errors }) => {
  const hasError = !!errors[name];
  return (
    <div className="oum__field">
      <div
        className={`oum__input-wrap oum__input-wrap--editable${hasError ? " oum__input-wrap--error" : ""}`}>
        <label className="oum__label">
          {label}
          {required && <span className="oum__required">*</span>}
        </label>
        <input type="text" {...register(name)} autoComplete="off" />
      </div>
      {hasError && (
        <p className="oum__error">
          <ReportProblemIcon />
          {errors[name]?.message}
        </p>
      )}
    </div>
  );
};

const PasswordField = ({ label, name, required, register, errors }) => {
  const [visible, setVisible] = useState(false);
  const hasError = !!errors[name];

  return (
    <div className="oum__field">
      <div
        className={`oum__input-wrap oum__input-wrap--editable${hasError ? " oum__input-wrap--error" : ""}`}>
        <label className="oum__label">
          {label}
          {required && <span className="oum__required">*</span>}
        </label>
        <input
          type={visible ? "text" : "password"}
          {...register(name)}
          autoComplete="new-password"
        />
        <IconButton
          className="oum__pw-toggle"
          size="small"
          tabIndex={-1}
          onClick={() => setVisible((v) => !v)}>
          {visible ? (
            <VisibilityOffIcon fontSize="small" />
          ) : (
            <VisibilityIcon fontSize="small" />
          )}
        </IconButton>
      </div>
      {hasError && (
        <p className="oum__error">
          <ReportProblemIcon />
          {errors[name]?.message}
        </p>
      )}
    </div>
  );
};

const OneUserModal = ({ open, onClose, selectedRow = null, onEdit }) => {
  const isView = !!selectedRow;

  const [createOneUser, { isLoading: isCreating }] = useCreateOneUserMutation();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(createOneUserSchema),
    defaultValues: {
      id_prefix: "",
      id_no: "",
      first_name: "",
      middle_name: "",
      last_name: "",
      suffix: "",
      username: "",
      password: "",
    },
  });

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingFormData, setPendingFormData] = useState(null);

  useEffect(() => {
    if (open && !isView) {
      reset({
        id_prefix: "",
        id_no: "",
        first_name: "",
        middle_name: "",
        last_name: "",
        suffix: "",
        username: "",
        password: "",
      });
    }
  }, [open, isView, reset]);

  const onValidSubmit = (form) => {
    setPendingFormData(form);
    setConfirmOpen(true);
  };

  const handleConfirmCreate = async () => {
    if (!pendingFormData) return;
    try {
      await createOneUser(pendingFormData).unwrap();
      window.__snackbar__?.enqueueSnackbar("One User created successfully.", {
        variant: "success",
      });
      setConfirmOpen(false);
      setPendingFormData(null);
      onClose();
    } catch (err) {
      console.error("Create failed:", err);
      window.__snackbar__?.enqueueSnackbar(
        "Something went wrong while creating. Please try again.",
        { variant: "error" },
      );
    }
  };

  const handleCancelConfirm = () => {
    if (isCreating) return;
    setConfirmOpen(false);
    setPendingFormData(null);
  };

  const handleEditClick = () => {
    onEdit?.(selectedRow);
    onClose();
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
      PaperProps={{ className: "oum__paper" }}>
      <div className="oum__header">
        <div className="oum__header-title">
          {isView ? (
            <RemoveRedEyeIcon className="oum__header-icon" />
          ) : (
            <PersonAddIcon className="oum__header-icon" />
          )}
          <span>{isView ? "View One User" : "Add One User"}</span>
        </div>
        <div className="oum__header-actions">
          {isView && (
            <IconButton
              className="oum__edit"
              onClick={handleEditClick}
              size="small">
              <EditIcon fontSize="small" />
            </IconButton>
          )}
          <IconButton className="oum__close" onClick={onClose} size="small">
            <CloseIcon fontSize="small" />
          </IconButton>
        </div>
      </div>

      <DialogContent className="oum__content">
        {isView ? (
          <div className="oum__group">
            <p className="oum__group-label">User Details</p>

            <div className="oum__field">
              <div className="oum__input-wrap">
                <label className="oum__label">Employee ID</label>
                <input
                  type="text"
                  value={`${selectedRow?.id_prefix ?? ""}${selectedRow?.id_no ?? ""}`}
                  disabled
                  readOnly
                />
              </div>
            </div>

            <div className="oum__field" style={{ marginTop: 12 }}>
              <div className="oum__input-wrap">
                <label className="oum__label">Name</label>
                <input
                  type="text"
                  value={[
                    selectedRow?.first_name,
                    selectedRow?.middle_name,
                    selectedRow?.last_name,
                    selectedRow?.suffix,
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  disabled
                  readOnly
                />
              </div>
            </div>

            <div className="oum__field" style={{ marginTop: 12 }}>
              <div className="oum__input-wrap">
                <label className="oum__label">Username</label>
                <input
                  type="text"
                  value={selectedRow?.username ?? ""}
                  disabled
                  readOnly
                />
              </div>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onValidSubmit)} noValidate>
            {FIELD_GROUPS.map((group) => (
              <div key={group.label} className="oum__group">
                <p className="oum__group-label">{group.label}</p>
                <div className="oum__grid">
                  {group.fields.map((f) => (
                    <div
                      key={f.name}
                      className={f.half ? "oum__col-half" : "oum__col-full"}>
                      <FormField
                        name={f.name}
                        label={f.label}
                        required={f.required}
                        register={register}
                        errors={errors}
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}

            <div className="oum__group">
              <p className="oum__group-label">Password</p>
              <div className="oum__grid">
                <div className="oum__col-full">
                  <PasswordField
                    label="Password"
                    name="password"
                    required
                    register={register}
                    errors={errors}
                  />
                </div>
              </div>
            </div>

            <div className="oum__footer">
              <SaveButton
                label="Add One User"
                onClick={handleSubmit(onValidSubmit)}
                disabled={isCreating}
              />
            </div>
          </form>
        )}
      </DialogContent>

      <ConfirmDialog
        open={confirmOpen}
        onClose={handleCancelConfirm}
        onConfirm={handleConfirmCreate}
        isLoading={isCreating}
        title="Add One User"
        message={`Are you sure you want to add "${pendingFormData?.first_name} ${pendingFormData?.last_name}"?`}
        confirmLabel="Add One User"
        confirmVariant="success"
      />
    </Dialog>
  );
};

export default OneUserModal;
