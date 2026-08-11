import { useEffect, useState, useRef } from "react";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { addSchema, passwordSchema } from "./UserModalSchema";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import IconButton from "@mui/material/IconButton";
import CloseIcon from "@mui/icons-material/Close";
import EditIcon from "@mui/icons-material/Edit";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import RemoveRedEyeIcon from "@mui/icons-material/RemoveRedEye";
import SearchIcon from "@mui/icons-material/Search";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import ArrowDropUpIcon from "@mui/icons-material/ArrowDropUp";
import ReportProblemIcon from "@mui/icons-material/ReportProblem";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import { SaveButton } from "../../../reusable-components/universal-buttons/UniversalButtons";
import {
  useGetUserQuery,
  useCreateUserMutation,
  useChangePasswordMutation,
  useGetOneChargingsQuery,
} from "../../../features/api/usersmanagement/usersApi";
import { useGetRolesQuery } from "../../../features/api/usersmanagement/rolesApi";
import ConfirmDialog from "../../../reusable-components/confirm-dialog/ConfirmDialog";
import useDebounce from "../../../hooks/useDebounce";
import "./UsersModal.scss";

const genderLabel = (value) => {
  if (value === "male") return "Male";
  if (value === "female") return "Female";
  return "—";
};

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
    label: "Contact & Identification",
    fields: [
      {
        name: "mobile_number",
        label: "Mobile Number",
        required: true,
        half: true,
        type: "phone",
      },
      {
        name: "gender",
        label: "Gender",
        required: true,
        half: true,
        type: "select",
        options: [
          { value: "male", label: "Male" },
          { value: "female", label: "Female" },
        ],
        format: genderLabel,
      },
      { name: "id_prefix", label: "ID Prefix", required: true, half: true },
      { name: "id_no", label: "ID Number", required: true, half: true },
    ],
  },
  {
    label: "Account Credentials",
    fields: [
      { name: "username", label: "Username", required: true, half: true },
    ],
  },
];

const SkeletonLoader = () => (
  <div className="um__skeleton-wrap">
    {FIELD_GROUPS.map((group) => (
      <div key={group.label} className="um__skeleton-group">
        <span className="ut__skeleton um__skeleton-label" />
        <div className="um__grid">
          {group.fields.map((f) => (
            <div
              key={f.name}
              className={f.half ? "um__col-half" : "um__col-full"}>
              <span className="ut__skeleton um__skeleton-field" />
            </div>
          ))}
        </div>
      </div>
    ))}
    <div className="um__skeleton-group">
      <span className="ut__skeleton um__skeleton-label" />
      <div className="um__grid">
        <span className="ut__skeleton um__skeleton-field um__col-half" />
        <span className="ut__skeleton um__skeleton-field um__col-half" />
      </div>
    </div>
    <div className="um__skeleton-footer">
      <span className="ut__skeleton um__skeleton-btn" />
    </div>
  </div>
);

const SearchAutocomplete = ({
  label,
  value,
  onChange,
  error,
  displayValue,
  useQueryHook,
  getOptionLabel = (o) => o.name,
  getOptionValue = (o) => o.id,
}) => {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 400);
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);

  const { data, isFetching } = useQueryHook(
    { status: "active", search: debouncedSearch, page: 1, per_page: 50 },
    { skip: !open },
  );
  const options = data?.data?.data ?? [];
  const filteredOptions = search.trim()
    ? options.filter((o) =>
        getOptionLabel(o)
          ?.toLowerCase()
          .startsWith(search.trim().toLowerCase()),
      )
    : options;
  const selected = options.find((o) => getOptionValue(o) === value) ?? null;

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setOpen(false);
        setSearch("");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (option) => {
    onChange(getOptionValue(option));
    setSearch("");
    setOpen(false);
  };

  return (
    <div className={`um__ac${error ? " um__ac--error" : ""}`} ref={wrapRef}>
      <label className="um__label">
        {label}
        <span className="um__required">*</span>
      </label>

      <div className="um__ac-box" onClick={() => setOpen((p) => !p)}>
        {open ? (
          <div className="um__ac-search-wrap">
            <SearchIcon
              sx={{ fontSize: "0.9rem", flexShrink: 0, color: "inherit" }}
            />
            <input
              autoFocus
              type="text"
              placeholder={`Search ${label.toLowerCase()}...`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="um__ac-input"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        ) : (
          <span
            className={
              selected || displayValue ? "um__ac-value" : "um__ac-placeholder"
            }>
            {selected
              ? getOptionLabel(selected)
              : displayValue || `Select ${label.toLowerCase()}...`}
          </span>
        )}
        <span className="um__ac-arrow">
          {open ? <ArrowDropUpIcon /> : <ArrowDropDownIcon />}
        </span>
      </div>

      {open && (
        <div className="um__ac-dropdown">
          <div className="um__ac-options">
            {isFetching ? (
              <p className="um__ac-empty">Loading...</p>
            ) : filteredOptions.length === 0 ? (
              <p className="um__ac-empty">No results found</p>
            ) : (
              filteredOptions.map((o) => {
                const optValue = getOptionValue(o);
                return (
                  <div
                    key={optValue}
                    className={`um__ac-option${value === optValue ? " um__ac-option--selected" : ""}`}
                    onClick={() => handleSelect(o)}>
                    {getOptionLabel(o)}
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

const SelectDropdown = ({
  label,
  value,
  onChange,
  error,
  required,
  options,
}) => {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);
  const selected = options.find((o) => o.value === value) ?? null;

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (option) => {
    onChange(option.value);
    setOpen(false);
  };

  return (
    <div className={`um__ac${error ? " um__ac--error" : ""}`} ref={wrapRef}>
      <label className="um__label">
        {label}
        {required && <span className="um__required">*</span>}
      </label>

      <div className="um__ac-box" onClick={() => setOpen((p) => !p)}>
        <span className={selected ? "um__ac-value" : "um__ac-placeholder"}>
          {selected ? selected.label : `Select ${label.toLowerCase()}...`}
        </span>
        <span className="um__ac-arrow">
          {open ? <ArrowDropUpIcon /> : <ArrowDropDownIcon />}
        </span>
      </div>

      {open && (
        <div className="um__ac-dropdown">
          <div className="um__ac-options">
            {options.map((opt) => (
              <div
                key={opt.value}
                className={`um__ac-option${value === opt.value ? " um__ac-option--selected" : ""}`}
                onClick={() => handleSelect(opt)}>
                {opt.label}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const PhoneField = ({ label, required, value, onChange, error }) => {
  const digits = (value || "").replace(/^\+63/, "");

  const handleChange = (e) => {
    const raw = e.target.value.replace(/[^0-9]/g, "").slice(0, 10);
    onChange(raw ? `+63${raw}` : "");
  };

  return (
    <div
      className={`um__input-wrap um__input-wrap--phone${error ? " um__input-wrap--error" : ""}`}>
      <label className="um__label">
        {label}
        {required && <span className="um__required">*</span>}
      </label>
      <span className="um__phone-prefix">+63</span>
      <input
        type="text"
        value={digits}
        onChange={handleChange}
        placeholder="9XXXXXXXXX"
        autoComplete="off"
        className="um__phone-input-field"
      />
    </div>
  );
};

const ViewField = ({ label, value, half }) => (
  <div className={half ? "um__col-half" : "um__col-full"}>
    <div className="um__field">
      <div className="um__input-wrap um__input-wrap--disabled">
        <label className="um__label">{label}</label>
        <input type="text" value={value ?? ""} disabled readOnly />
      </div>
    </div>
  </div>
);

const PasswordField = ({ label, name, required, register, errors }) => {
  const [visible, setVisible] = useState(false);
  const hasError = !!errors[name];

  return (
    <div className="um__field">
      <div
        className={`um__input-wrap${hasError ? " um__input-wrap--error" : ""}`}>
        <label className="um__label">
          {label}
          {required && <span className="um__required">*</span>}
        </label>
        <input
          type={visible ? "text" : "password"}
          {...register(name)}
          autoComplete="new-password"
        />
        <IconButton
          className="um__pw-toggle"
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
        <p className="um__error">
          <ReportProblemIcon />
          {errors[name]?.message}
        </p>
      )}
    </div>
  );
};

const FormField = ({
  name,
  label,
  required,
  type = "text",
  options,
  register,
  control,
  errors,
}) => {
  const hasError = !!errors[name];
  const isSelect = type === "select";
  const isPhone = type === "phone";

  if (isPhone) {
    return (
      <div className="um__field">
        <Controller
          name={name}
          control={control}
          render={({ field }) => (
            <PhoneField
              label={label}
              required={required}
              value={field.value}
              onChange={field.onChange}
              error={hasError}
            />
          )}
        />
        {hasError && (
          <p className="um__error">
            <ReportProblemIcon />
            {errors[name]?.message}
          </p>
        )}
      </div>
    );
  }

  if (isSelect) {
    return (
      <div className="um__field">
        <Controller
          name={name}
          control={control}
          render={({ field }) => (
            <SelectDropdown
              label={label}
              value={field.value}
              onChange={field.onChange}
              error={hasError}
              required={required}
              options={options}
            />
          )}
        />
        {hasError && (
          <p className="um__error">
            <ReportProblemIcon />
            {errors[name]?.message}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="um__field">
      <div
        className={`um__input-wrap${hasError ? " um__input-wrap--error" : ""}`}>
        <label className="um__label">
          {label}
          {required && <span className="um__required">*</span>}
        </label>
        <input type="text" {...register(name)} autoComplete="off" />
      </div>
      {hasError && (
        <p className="um__error">
          <ReportProblemIcon />
          {errors[name]?.message}
        </p>
      )}
    </div>
  );
};

const UsersModal = ({
  open,
  onClose,
  selectedId = null,
  onPasswordChanged,
}) => {
  const isViewOnly = !!selectedId;
  const [isEditMode, setIsEditMode] = useState(false);

  const { data: userDetail, isFetching: userLoading } = useGetUserQuery(
    selectedId,
    { skip: !selectedId || !open },
  );
  const rowData = userDetail?.data ?? null;

  const [createUser, { isLoading: isCreating }] = useCreateUserMutation();
  const [changePassword, { isLoading: isChangingPassword }] =
    useChangePasswordMutation();

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(addSchema),
    defaultValues: {
      role_id: "",
      one_charging_id: "",
      id_prefix: "",
      id_no: "",
      first_name: "",
      middle_name: "",
      last_name: "",
      suffix: "",
      mobile_number: "",
      gender: "",
      username: "",
    },
  });

  const {
    register: registerPw,
    handleSubmit: handleSubmitPw,
    reset: resetPw,
    formState: { errors: pwErrors },
  } = useForm({
    resolver: yupResolver(passwordSchema),
    defaultValues: {
      old_password: "",
      new_password: "",
      confirm_password: "",
    },
  });

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingFormData, setPendingFormData] = useState(null);
  const [confirmMode, setConfirmMode] = useState("add");

  useEffect(() => {
    if (open && !selectedId) {
      reset({
        role_id: "",
        one_charging_id: "",
        id_prefix: "",
        id_no: "",
        first_name: "",
        middle_name: "",
        last_name: "",
        suffix: "",
        mobile_number: "",
        gender: "",
        username: "",
      });
    }
  }, [open, selectedId, reset]);

  useEffect(() => {
    if (!open) {
      setIsEditMode(false);
      resetPw({ old_password: "", new_password: "", confirm_password: "" });
    }
  }, [open, resetPw]);

  useEffect(() => {
    setIsEditMode(false);
    resetPw({ old_password: "", new_password: "", confirm_password: "" });
  }, [selectedId, resetPw]);

  const onValidSubmit = (form) => {
    setConfirmMode("add");
    setPendingFormData(form);
    setConfirmOpen(true);
  };

  const onValidPasswordSubmit = (values) => {
    setConfirmMode("password");
    setPendingFormData(values);
    setConfirmOpen(true);
  };

  const handleConfirmSubmit = async () => {
    if (!pendingFormData) return;

    if (confirmMode === "password") {
      try {
        const compositeId = `${rowData?.id_prefix}-${rowData?.id_no}`;

        await changePassword({
          id: compositeId,
          old_password: pendingFormData.old_password,
          new_password: pendingFormData.new_password,
          confirm_password: pendingFormData.confirm_password,
        }).unwrap();

        window.__snackbar__?.enqueueSnackbar("Password updated successfully.", {
          variant: "success",
        });
        setConfirmOpen(false);
        setPendingFormData(null);
        setIsEditMode(false);
        resetPw({ old_password: "", new_password: "", confirm_password: "" });
        onPasswordChanged?.();
      } catch (err) {
        console.error("Password update failed:", err);
        window.__snackbar__?.enqueueSnackbar(
          "Something went wrong. Please try again.",
          {
            variant: "error",
          },
        );
      }
      return;
    }

    try {
      const {
        first_name,
        middle_name,
        last_name,
        suffix,
        mobile_number,
        gender,
        id_prefix,
        id_no,
        one_charging_id,
        username,
        role_id,
      } = pendingFormData;

      await createUser({
        personal_info: {
          id_prefix,
          id_no,
          first_name,
          middle_name,
          last_name,
          suffix,
          mobile_number,
          gender,
          one_charging_id,
        },
        username,
        role_id,
      }).unwrap();

      window.__snackbar__?.enqueueSnackbar("User created successfully.", {
        variant: "success",
      });
      setConfirmOpen(false);
      setPendingFormData(null);
      onClose();
    } catch (err) {
      console.error("Save failed:", err);
      window.__snackbar__?.enqueueSnackbar(
        "Something went wrong. Please try again.",
        {
          variant: "error",
        },
      );
    }
  };

  const isConfirmLoading =
    confirmMode === "password" ? isChangingPassword : isCreating;

  const handleCancelConfirm = () => {
    if (isConfirmLoading) return;
    setConfirmOpen(false);
    setPendingFormData(null);
  };

  const handleEditClick = () => {
    setIsEditMode(true);
  };

  const handleCancelEdit = () => {
    if (isChangingPassword) return;
    setIsEditMode(false);
    resetPw({ old_password: "", new_password: "", confirm_password: "" });
  };

  const handleModalClose = () => {
    setIsEditMode(false);
    setConfirmOpen(false);
    setPendingFormData(null);
    resetPw({ old_password: "", new_password: "", confirm_password: "" });
    onClose();
  };

  const headerIcon = isEditMode ? (
    <EditIcon className="um__header-icon" />
  ) : isViewOnly ? (
    <RemoveRedEyeIcon className="um__header-icon" />
  ) : (
    <PersonAddIcon className="um__header-icon" />
  );
  const headerTitle = isEditMode
    ? "Edit User"
    : isViewOnly
      ? "View User"
      : "Add User";

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
      PaperProps={{ className: "um__paper" }}>
      <div className="um__header">
        <div className="um__header-title">
          {headerIcon}
          <span>{headerTitle}</span>
        </div>
        <div className="um__header-actions">
          {isViewOnly && !isEditMode && (
            <IconButton
              className="um__edit"
              onClick={handleEditClick}
              size="small">
              <EditIcon fontSize="small" />
            </IconButton>
          )}
          <IconButton
            className="um__close"
            onClick={handleModalClose}
            size="small">
            <CloseIcon fontSize="small" />
          </IconButton>
        </div>
      </div>

      <DialogContent className="um__content">
        {userLoading ? (
          <SkeletonLoader />
        ) : isViewOnly ? (
          <>
            {FIELD_GROUPS.map((group) => (
              <div key={group.label} className="um__group">
                <p className="um__group-label">{group.label}</p>
                <div className="um__grid">
                  {group.fields.map((f) => {
                    const raw = rowData?.[f.name];
                    const value = f.format ? f.format(raw) : raw;
                    return (
                      <ViewField
                        key={f.name}
                        label={f.label}
                        half={f.half}
                        value={value}
                      />
                    );
                  })}
                </div>
              </div>
            ))}
            <div className="um__group">
              <p className="um__group-label">Role & One Charging</p>
              <div className="um__grid">
                <ViewField label="Role" half value={rowData?.role?.name} />
                <ViewField
                  label="One Charging"
                  half
                  value={rowData?.one_charging?.name}
                />
              </div>
            </div>

            {isEditMode && (
              <form onSubmit={handleSubmitPw(onValidPasswordSubmit)} noValidate>
                <div className="um__group">
                  <p className="um__group-label">Change Password</p>
                  <div className="um__grid">
                    <div className="um__col-full">
                      <PasswordField
                        label="Old Password"
                        name="old_password"
                        required
                        register={registerPw}
                        errors={pwErrors}
                      />
                    </div>
                    <div className="um__col-half">
                      <PasswordField
                        label="New Password"
                        name="new_password"
                        required
                        register={registerPw}
                        errors={pwErrors}
                      />
                    </div>
                    <div className="um__col-half">
                      <PasswordField
                        label="Confirm Password"
                        name="confirm_password"
                        required
                        register={registerPw}
                        errors={pwErrors}
                      />
                    </div>
                  </div>
                </div>

                <div className="um__footer">
                  <button
                    type="button"
                    className="um__cancel-btn"
                    onClick={handleCancelEdit}
                    disabled={isChangingPassword}>
                    Cancel
                  </button>
                  <SaveButton
                    label="Save Password"
                    onClick={handleSubmitPw(onValidPasswordSubmit)}
                    disabled={isChangingPassword}
                  />
                </div>
              </form>
            )}
          </>
        ) : (
          <form onSubmit={handleSubmit(onValidSubmit)} noValidate>
            {FIELD_GROUPS.map((group) => (
              <div key={group.label} className="um__group">
                <p className="um__group-label">{group.label}</p>
                <div className="um__grid">
                  {group.fields.map((f) => (
                    <div
                      key={f.name}
                      className={f.half ? "um__col-half" : "um__col-full"}>
                      <FormField
                        name={f.name}
                        label={f.label}
                        required={f.required}
                        type={f.type || "text"}
                        options={f.options}
                        register={register}
                        control={control}
                        errors={errors}
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}

            <div className="um__group">
              <p className="um__group-label">Role & One Charging</p>
              <div className="um__grid">
                <div className="um__col-half">
                  <Controller
                    name="role_id"
                    control={control}
                    render={({ field }) => (
                      <SearchAutocomplete
                        label="Role"
                        value={field.value}
                        onChange={field.onChange}
                        error={!!errors.role_id}
                        useQueryHook={useGetRolesQuery}
                      />
                    )}
                  />
                  {errors.role_id && (
                    <p className="um__error" style={{ marginTop: 6 }}>
                      <ReportProblemIcon />
                      {errors.role_id?.message}
                    </p>
                  )}
                </div>
                <div className="um__col-half">
                  <Controller
                    name="one_charging_id"
                    control={control}
                    render={({ field }) => (
                      <SearchAutocomplete
                        label="One Charging"
                        value={field.value}
                        onChange={field.onChange}
                        error={!!errors.one_charging_id}
                        useQueryHook={useGetOneChargingsQuery}
                      />
                    )}
                  />
                  {errors.one_charging_id && (
                    <p className="um__error" style={{ marginTop: 6 }}>
                      <ReportProblemIcon />
                      {errors.one_charging_id?.message}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="um__footer">
              <SaveButton
                label="Add User"
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
        onConfirm={handleConfirmSubmit}
        isLoading={isConfirmLoading}
        title={confirmMode === "password" ? "Update Password" : "Add User"}
        message={
          confirmMode === "password"
            ? "Are you sure you want to update this user's password?"
            : "Are you sure you want to add this user?"
        }
        confirmLabel={
          confirmMode === "password" ? "Update Password" : "Add User"
        }
        confirmVariant="success"
      />
    </Dialog>
  );
};

export default UsersModal;
