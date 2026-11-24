import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import IconButton from "@mui/material/IconButton";
import CloseIcon from "@mui/icons-material/Close";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import ReportProblemIcon from "@mui/icons-material/ReportProblem";
import { SaveButton } from "../../../reusable-components/universal-buttons/UniversalButtons";
import { useGetOneUserQuery } from "../../../features/api/one-rdf/oneUserApi";
import {
  useCreateUserMutation,
  useGetOneChargingsQuery,
} from "../../../features/api/usersmanagement/usersApi";
import { useGetRolesQuery } from "../../../features/api/usersmanagement/rolesApi";
import ConfirmDialog from "../../../reusable-components/confirm-dialog/ConfirmDialog";
import "./OneUserModal.scss";

const GENDER_OPTIONS = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
];

const EMPTY_FORM = {
  mobile_number: "",
  gender: "",
  role_id: "",
  one_charging_id: "",
};

const userSchema = yup.object({
  mobile_number: yup
    .string()
    .trim()
    .required("Mobile number is required.")
    .matches(/^\+639\d{9}$/, "Use the format +639XXXXXXXXX."),
  gender: yup
    .string()
    .required("Gender is required.")
    .oneOf(["male", "female"], "Gender is required."),
  role_id: yup.string().required("Role is required."),
  one_charging_id: yup.string().required("One Charging is required."),
});

const FIELD_GROUPS = [
  {
    label: "Personal Information",
    fields: [
      { name: "first_name", label: "First Name", half: true },
      { name: "middle_name", label: "Middle Name", half: true },
      { name: "last_name", label: "Last Name", half: true },
      { name: "suffix", label: "Suffix", half: true },
    ],
  },
  {
    label: "Identification",
    fields: [
      { name: "id_prefix", label: "ID Prefix", half: true },
      { name: "id_no", label: "ID Number", half: true },
    ],
  },
  {
    label: "Account",
    fields: [{ name: "username", label: "Username", half: false }],
  },
];

const getChargingLabel = (item) =>
  item?.name ?? item?.code ?? `Charging #${item?.id}`;

const SkeletonLoader = () => (
  <div className="oum__skeleton-wrap">
    {FIELD_GROUPS.map((group) => (
      <div key={group.label} className="oum__skeleton-group">
        <span className="ut__skeleton oum__skeleton-label" />
        <div className="oum__grid">
          {group.fields.map((f) => (
            <div
              key={f.name}
              className={f.half ? "oum__col-half" : "oum__col-full"}>
              <span className="ut__skeleton oum__skeleton-field" />
            </div>
          ))}
        </div>
      </div>
    ))}
    <div className="oum__skeleton-footer">
      <span className="ut__skeleton oum__skeleton-btn" />
    </div>
  </div>
);

const ViewField = ({ label, value, half }) => (
  <div className={half ? "oum__col-half" : "oum__col-full"}>
    <div className="oum__field">
      <div className="oum__input-wrap oum__input-wrap--disabled">
        <label className="oum__label">{label}</label>
        <input type="text" value={value ?? ""} disabled readOnly />
      </div>
    </div>
  </div>
);

const TextField = ({
  label,
  name,
  required,
  register,
  errors,
  placeholder,
}) => {
  const hasError = !!errors[name];

  return (
    <div className="oum__field">
      <div
        className={`oum__input-wrap${hasError ? " oum__input-wrap--error" : ""}`}>
        <label className="oum__label">
          {label}
          {required && <span className="oum__required">*</span>}
        </label>
        <input
          type="text"
          placeholder={placeholder}
          {...register(name)}
          autoComplete="off"
        />
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

const SelectField = ({
  label,
  name,
  required,
  register,
  errors,
  options,
  disabled,
}) => {
  const hasError = !!errors[name];

  return (
    <div className="oum__field">
      <div
        className={`oum__input-wrap${hasError ? " oum__input-wrap--error" : ""}`}>
        <label className="oum__label">
          {label}
          {required && <span className="oum__required">*</span>}
        </label>
        <select {...register(name)} disabled={disabled}>
          <option value="">Select {label}</option>
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
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

const OneUserModal = ({ open, onClose, selectedId = null, onCreated }) => {
  const { data: userDetail, isFetching: userLoading } = useGetOneUserQuery(
    selectedId,
    { skip: !selectedId || !open },
  );
  const rowData = userDetail?.data ?? null;

  const { data: rolesData, isFetching: rolesLoading } = useGetRolesQuery(
    { per_page: 1000 },
    { skip: !open },
  );
  const { data: chargingsData, isFetching: chargingsLoading } =
    useGetOneChargingsQuery({ per_page: 1000 }, { skip: !open });

  const [createUser, { isLoading: isCreating }] = useCreateUserMutation();

  const roleOptions = useMemo(
    () =>
      (rolesData?.data?.data ?? []).map((r) => ({
        value: String(r.id),
        label: r.name,
      })),
    [rolesData],
  );

  const chargingOptions = useMemo(
    () =>
      (chargingsData?.data?.data ?? []).map((c) => ({
        value: String(c.id),
        label: getChargingLabel(c),
      })),
    [chargingsData],
  );

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(userSchema),
    defaultValues: EMPTY_FORM,
  });

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingFormData, setPendingFormData] = useState(null);

  useEffect(() => {
    setConfirmOpen(false);
    setPendingFormData(null);
    reset(EMPTY_FORM);
  }, [open, selectedId, reset]);

  const onValidSubmit = (values) => {
    setPendingFormData(values);
    setConfirmOpen(true);
  };

  const handleConfirmSubmit = async () => {
    if (!pendingFormData || !rowData) return;
    try {
      const payload = {
        personal_info: {
          id_prefix: rowData.id_prefix,
          id_no: rowData.id_no,
          first_name: rowData.first_name ?? "",
          middle_name: rowData.middle_name ?? "",
          last_name: rowData.last_name ?? "",
          suffix: rowData.suffix ?? "",
          mobile_number: pendingFormData.mobile_number.trim(),
          gender: pendingFormData.gender,
          one_charging_id: Number(pendingFormData.one_charging_id),
        },
        username: rowData.username,
        role_id: Number(pendingFormData.role_id),
        for_syncing: true,
      };

      await createUser(payload).unwrap();

      window.__snackbar__?.enqueueSnackbar("User created successfully.", {
        variant: "success",
      });
      setConfirmOpen(false);
      setPendingFormData(null);
      reset(EMPTY_FORM);
      onCreated?.();
      onClose();
    } catch (err) {
      console.error("Create user failed:", err);
      window.__snackbar__?.enqueueSnackbar(
        err?.data?.message || "Something went wrong. Please try again.",
        { variant: "error" },
      );
    }
  };

  const handleCancelConfirm = () => {
    if (isCreating) return;
    setConfirmOpen(false);
    setPendingFormData(null);
  };

  const handleModalClose = () => {
    if (isCreating) return;
    setConfirmOpen(false);
    setPendingFormData(null);
    reset(EMPTY_FORM);
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={(e, reason) => {
        if (reason === "backdropClick") return;
        handleModalClose();
      }}
      disableEscapeKeyDown
      maxWidth="sm"
      fullWidth
      PaperProps={{ className: "oum__paper" }}>
      <div className="oum__header">
        <div className="oum__header-title">
          <PersonAddIcon className="oum__header-icon" />
          <span>Create User</span>
        </div>
        <div className="oum__header-actions">
          <IconButton
            className="oum__close"
            onClick={handleModalClose}
            size="small">
            <CloseIcon fontSize="small" />
          </IconButton>
        </div>
      </div>

      <DialogContent className="oum__content">
        {userLoading ? (
          <SkeletonLoader />
        ) : (
          <form onSubmit={handleSubmit(onValidSubmit)} noValidate>
            {FIELD_GROUPS.map((group) => (
              <div key={group.label} className="oum__group">
                <p className="oum__group-label">{group.label}</p>
                <div className="oum__grid">
                  {group.fields.map((f) => (
                    <ViewField
                      key={f.name}
                      label={f.label}
                      half={f.half}
                      value={rowData?.[f.name]}
                    />
                  ))}
                </div>
              </div>
            ))}

            <div className="oum__group">
              <p className="oum__group-label">User Details</p>
              <div className="oum__grid">
                <div className="oum__col-half">
                  <TextField
                    label="Mobile Number"
                    name="mobile_number"
                    placeholder="+639XXXXXXXXX"
                    required
                    register={register}
                    errors={errors}
                  />
                </div>
                <div className="oum__col-half">
                  <SelectField
                    label="Gender"
                    name="gender"
                    required
                    register={register}
                    errors={errors}
                    options={GENDER_OPTIONS}
                  />
                </div>
                <div className="oum__col-half">
                  <SelectField
                    label="Role"
                    name="role_id"
                    required
                    register={register}
                    errors={errors}
                    options={roleOptions}
                    disabled={rolesLoading}
                  />
                </div>
                <div className="oum__col-half">
                  <SelectField
                    label="One Charging"
                    name="one_charging_id"
                    required
                    register={register}
                    errors={errors}
                    options={chargingOptions}
                    disabled={chargingsLoading}
                  />
                </div>
              </div>
            </div>

            <div className="oum__footer">
              <button
                type="button"
                className="oum__cancel-btn"
                onClick={handleModalClose}
                disabled={isCreating}>
                Cancel
              </button>
              <SaveButton
                label="Save User"
                onClick={handleSubmit(onValidSubmit)}
                disabled={isCreating || !rowData}
              />
            </div>
          </form>
        )}
      </DialogContent>

      <ConfirmDialog
        open={confirmOpen}
        onClose={handleCancelConfirm}
        onConfirm={handleConfirmSubmit}
        isLoading={isCreating}
        title="Create User"
        message="Are you sure you want to create this user?"
        confirmLabel="Create User"
        confirmVariant="success"
      />
    </Dialog>
  );
};

export default OneUserModal;
