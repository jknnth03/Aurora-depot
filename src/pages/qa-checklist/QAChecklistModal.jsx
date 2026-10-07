import { useEffect, useState, useRef, useMemo } from "react";
import { useForm, useFieldArray, useWatch, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import IconButton from "@mui/material/IconButton";
import Checkbox from "@mui/material/Checkbox";
import FormControlLabel from "@mui/material/FormControlLabel";
import Skeleton from "@mui/material/Skeleton";
import CloseIcon from "@mui/icons-material/Close";
import FactCheckIcon from "@mui/icons-material/FactCheck";
import EditIcon from "@mui/icons-material/Edit";
import RemoveRedEyeIcon from "@mui/icons-material/RemoveRedEye";
import ReportProblemIcon from "@mui/icons-material/ReportProblem";
import SearchIcon from "@mui/icons-material/Search";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";
import {
  SaveButton,
  EditButton,
  BackModalButton,
} from "../../reusable-components/universal-buttons/UniversalButtons";
import ConfirmDialog from "../../reusable-components/confirm-dialog/ConfirmDialog";
import {
  useCreateChecklistMutation,
  useUpdateChecklistMutation,
  useGetChecklistQuery,
} from "../../features/api/qa-checklist/qaChecklistApi";
import { useLazyGetChecklistTypesQuery } from "../../features/api/checklist-type/checklistTypeApi";
import "./QAChecklistModal.scss";

const TOTAL_CENTS = 10000;

const toCents = (value) => Math.round((Number(value) || 0) * 100);

const sumCents = (sections = []) =>
  sections.reduce((total, section) => total + toCents(section?.percentage), 0);

const formatCents = (cents) => String(Number((cents / 100).toFixed(2)));

const sanitizePercentage = (raw) => {
  let value = String(raw ?? "").replace(/[^\d.]/g, "");
  const firstDot = value.indexOf(".");
  if (firstDot !== -1) {
    value =
      value.slice(0, firstDot + 1) +
      value.slice(firstDot + 1).replace(/\./g, "");
  }
  let [whole, decimal] = value.split(".");
  whole = whole.replace(/^0+(?=\d)/, "");
  if (decimal !== undefined) {
    decimal = decimal.slice(0, 2);
    if (whole === "") whole = "0";
    return `${whole}.${decimal}`;
  }
  return whole;
};

const questionSchema = yup.object({
  name: yup.string().required("Question is required."),
  is_sanitation: yup.boolean().default(false),
  is_structural: yup.boolean().default(false),
  is_equipment: yup.boolean().default(false),
});

const sectionSchema = yup.object({
  name: yup.string().required("Section name is required."),
  percentage: yup
    .number()
    .typeError("Percentage is required.")
    .required("Percentage is required.")
    .min(0, "Percentage cannot be negative.")
    .max(100, "Percentage cannot exceed 100."),
  questions: yup
    .array()
    .of(questionSchema)
    .min(1, "At least one question is required."),
});

const schema = yup.object({
  name: yup.string().required("Checklist name is required."),
  description: yup.string().nullable(),
  checklist_type_id: yup
    .number()
    .typeError("Checklist type is required.")
    .required("Checklist type is required."),
  sections: yup
    .array()
    .of(sectionSchema)
    .min(1, "At least one section is required.")
    .test("sections-sum-100", function (value) {
      if (!value?.length) return true;
      const total = sumCents(value);
      if (total === TOTAL_CENTS) return true;
      return this.createError({
        message:
          total > TOTAL_CENTS
            ? `Section percentages exceed 100%. Current total: ${formatCents(total)}%.`
            : `Section percentages must add up to 100%. Current total: ${formatCents(total)}%.`,
      });
    }),
});

const emptyQuestion = () => ({
  name: "",
  is_sanitation: false,
  is_structural: false,
  is_equipment: false,
});
const emptySection = () => ({
  name: "",
  percentage: "",
  questions: [emptyQuestion()],
});

const getChecklistTypeOptionLabel = (type) => {
  if (!type) return "";
  return type.name ?? `Type #${type.id}`;
};

const SearchSelect = ({
  value,
  onChange,
  options,
  getOptionLabel,
  loading,
  error,
  placeholder,
  disabled,
  onOpen,
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

  const handleToggleOpen = () => {
    if (disabled) return;
    setOpen((prev) => {
      const next = !prev;
      if (next) onOpen?.();
      return next;
    });
  };

  const handleSelect = (option) => {
    onChange(option.id);
    setOpen(false);
    setQuery("");
  };

  return (
    <div
      ref={wrapRef}
      className={`qcm__ac${error ? " qcm__ac--error" : ""}${open ? " qcm__ac--open" : ""}${disabled ? " qcm__ac--disabled" : ""}`}>
      <div className="qcm__ac-box" onClick={handleToggleOpen}>
        {open ? (
          <div className="qcm__ac-search-wrap">
            <SearchIcon style={{ fontSize: "1rem" }} />
            <input
              className="qcm__ac-input"
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
          <span className="qcm__ac-value">
            {getOptionLabel(selectedOption)}
          </span>
        ) : (
          <span className="qcm__ac-placeholder">
            {loading ? (
              <Skeleton
                className="qcm__skeleton"
                variant="text"
                width={140}
                height={22}
              />
            ) : (
              placeholder
            )}
          </span>
        )}
        <span className="qcm__ac-arrow">
          {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
        </span>
      </div>

      {open && (
        <div className="qcm__ac-dropdown">
          <div className="qcm__ac-options">
            {loading ? (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 6,
                  padding: "8px 12px",
                }}>
                {[0, 1, 2, 3].map((item) => (
                  <Skeleton
                    key={item}
                    className="qcm__skeleton"
                    variant="rounded"
                    height={28}
                  />
                ))}
              </div>
            ) : filteredOptions.length === 0 ? (
              <p className="qcm__ac-empty">No results found.</p>
            ) : (
              filteredOptions.map((option) => (
                <div
                  key={option.id}
                  className={`qcm__ac-option${
                    option.id === value ? " qcm__ac-option--selected" : ""
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

const QuestionCard = ({
  control,
  register,
  errors,
  sectionIndex,
  questionIndex,
  onRemoveQuestion,
  isView,
}) => {
  const basePath = `sections.${sectionIndex}.questions.${questionIndex}`;
  const questionErrors =
    errors?.sections?.[sectionIndex]?.questions?.[questionIndex];

  return (
    <div className="qcm__question-card">
      <div className="qcm__question-header">
        <span className="qcm__question-label">Q{questionIndex + 1}</span>
        {!isView && (
          <IconButton
            className="qcm__delete-btn"
            size="small"
            onClick={onRemoveQuestion}>
            <DeleteIcon fontSize="small" />
          </IconButton>
        )}
      </div>

      <div className="qcm__field">
        <div
          className={`qcm__input-wrap${questionErrors?.name ? " qcm__input-wrap--error" : ""}`}>
          <label className="qcm__label">
            Question<span className="qcm__required">*</span>
          </label>
          <input
            type="text"
            placeholder="Enter question text"
            disabled={isView}
            {...register(`${basePath}.name`)}
          />
        </div>
        {questionErrors?.name && (
          <p className="qcm__error">
            <ReportProblemIcon />
            {questionErrors.name.message}
          </p>
        )}
      </div>

      <div className="qcm__checkbox-row">
        <Controller
          control={control}
          name={`${basePath}.is_sanitation`}
          render={({ field }) => (
            <FormControlLabel
              control={
                <Checkbox
                  {...field}
                  checked={!!field.value}
                  disabled={isView}
                  size="small"
                />
              }
              label="Sanitation"
            />
          )}
        />
        <Controller
          control={control}
          name={`${basePath}.is_structural`}
          render={({ field }) => (
            <FormControlLabel
              control={
                <Checkbox
                  {...field}
                  checked={!!field.value}
                  disabled={isView}
                  size="small"
                />
              }
              label="Structural"
            />
          )}
        />
        <Controller
          control={control}
          name={`${basePath}.is_equipment`}
          render={({ field }) => (
            <FormControlLabel
              control={
                <Checkbox
                  {...field}
                  checked={!!field.value}
                  disabled={isView}
                  size="small"
                />
              }
              label="Equipment"
            />
          )}
        />
      </div>
    </div>
  );
};

const SectionCard = ({
  control,
  register,
  errors,
  sectionIndex,
  onRemoveSection,
  isView,
}) => {
  const {
    fields: questionFields,
    append: appendQuestion,
    remove: removeQuestion,
  } = useFieldArray({
    control,
    name: `sections.${sectionIndex}.questions`,
  });

  const sectionErrors = errors?.sections?.[sectionIndex];
  const percentageField = register(`sections.${sectionIndex}.percentage`);

  return (
    <div className="qcm__section-card">
      <div className="qcm__section-header">
        <DragIndicatorIcon className="qcm__drag-handle" fontSize="small" />
        <span className="qcm__section-label">Section {sectionIndex + 1}</span>
        {!isView && (
          <IconButton
            className="qcm__delete-btn"
            size="small"
            onClick={onRemoveSection}>
            <DeleteIcon fontSize="small" />
          </IconButton>
        )}
      </div>

      <div className="qcm__field-row">
        <div className="qcm__field">
          <div
            className={`qcm__input-wrap${sectionErrors?.name ? " qcm__input-wrap--error" : ""}`}>
            <label className="qcm__label">
              Title<span className="qcm__required">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Customer Service"
              disabled={isView}
              {...register(`sections.${sectionIndex}.name`)}
            />
          </div>
          {sectionErrors?.name && (
            <p className="qcm__error">
              <ReportProblemIcon />
              {sectionErrors.name.message}
            </p>
          )}
        </div>

        <div className="qcm__field qcm__field--percentage">
          <div
            className={`qcm__input-wrap${sectionErrors?.percentage ? " qcm__input-wrap--error" : ""}`}>
            <label className="qcm__label">
              Weight (%)<span className="qcm__required">*</span>
            </label>
            <input
              type="text"
              inputMode="decimal"
              placeholder="0"
              autoComplete="off"
              disabled={isView}
              {...percentageField}
              onChange={(e) => {
                e.target.value = sanitizePercentage(e.target.value);
                percentageField.onChange(e);
              }}
            />
          </div>
          {sectionErrors?.percentage && (
            <p className="qcm__error">
              <ReportProblemIcon />
              {sectionErrors.percentage.message}
            </p>
          )}
        </div>
      </div>

      {questionFields.map((q, qIndex) => (
        <QuestionCard
          key={q.id}
          control={control}
          register={register}
          errors={errors}
          sectionIndex={sectionIndex}
          questionIndex={qIndex}
          isView={isView}
          onRemoveQuestion={() => removeQuestion(qIndex)}
        />
      ))}

      {!isView && (
        <button
          type="button"
          className="qcm__add-link"
          onClick={() => appendQuestion(emptyQuestion())}>
          <AddIcon fontSize="small" /> Add Question
        </button>
      )}
    </div>
  );
};

const SectionCardSkeleton = () => (
  <div className="qcm__section-card">
    <div className="qcm__section-header">
      <Skeleton
        className="qcm__skeleton"
        variant="circular"
        width={20}
        height={20}
      />
      <Skeleton
        className="qcm__skeleton"
        variant="text"
        width={100}
        height={24}
        sx={{ ml: 1 }}
      />
    </div>
    <div className="qcm__field-row">
      <div className="qcm__field">
        <Skeleton
          className="qcm__skeleton"
          variant="text"
          width={60}
          height={16}
        />
        <Skeleton className="qcm__skeleton" variant="rounded" height={40} />
      </div>
      <div className="qcm__field qcm__field--percentage">
        <Skeleton
          className="qcm__skeleton"
          variant="text"
          width={80}
          height={16}
        />
        <Skeleton className="qcm__skeleton" variant="rounded" height={40} />
      </div>
    </div>
    <div className="qcm__question-card">
      <Skeleton
        className="qcm__skeleton"
        variant="text"
        width={40}
        height={20}
      />
      <Skeleton
        className="qcm__skeleton"
        variant="text"
        width={60}
        height={16}
        sx={{ mt: 1 }}
      />
      <Skeleton className="qcm__skeleton" variant="rounded" height={40} />
      <div className="qcm__checkbox-row">
        <Skeleton
          className="qcm__skeleton"
          variant="rounded"
          width={90}
          height={28}
        />
        <Skeleton
          className="qcm__skeleton"
          variant="rounded"
          width={90}
          height={28}
        />
        <Skeleton
          className="qcm__skeleton"
          variant="rounded"
          width={90}
          height={28}
        />
      </div>
    </div>
  </div>
);

const WeightTotal = ({ totalCents }) => {
  const isComplete = totalCents === TOTAL_CENTS;
  const isOver = totalCents > TOTAL_CENTS;
  const color = isComplete ? "#2e7d32" : isOver ? "#d32f2f" : "#f47b20";
  const remaining = TOTAL_CENTS - totalCents;

  let note = `${formatCents(remaining)}% remaining`;
  if (isComplete) note = "Complete";
  if (isOver) note = `${formatCents(Math.abs(remaining))}% over`;

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "8px 12px",
        marginTop: 8,
        borderRadius: 8,
        border: `1px solid ${color}`,
        color,
        fontSize: "0.8rem",
        fontWeight: 600,
      }}>
      <span>Total Weight: {formatCents(totalCents)}% / 100%</span>
      <span>{note}</span>
    </div>
  );
};

const QAChecklistModal = ({ open, onClose, selectedChecklist = null }) => {
  const [mode, setMode] = useState("add");

  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      name: "",
      description: "",
      checklist_type_id: "",
      sections: [emptySection()],
    },
  });

  const {
    fields: sectionFields,
    append: appendSection,
    remove: removeSection,
  } = useFieldArray({ control, name: "sections" });

  const watchedSections = useWatch({ control, name: "sections" });
  const totalCents = sumCents(watchedSections ?? []);
  const isTotalReached = totalCents >= TOTAL_CENTS;

  const [
    triggerGetChecklistTypes,
    { data: checklistTypesData, isFetching: checklistTypesLoading },
  ] = useLazyGetChecklistTypesQuery();
  const checklistTypeOptions = checklistTypesData?.data?.data ?? [];

  const handleOpenChecklistTypes = () => {
    triggerGetChecklistTypes({ status: "active", per_page: 100 }, true);
  };

  const { data: checklistDetailData, isFetching: checklistDetailLoading } =
    useGetChecklistQuery(selectedChecklist?.id, {
      skip: !open || !selectedChecklist?.id,
    });
  const checklistDetail = checklistDetailData?.data;

  const [createChecklist] = useCreateChecklistMutation();
  const [updateChecklist] = useUpdateChecklistMutation();

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingFormData, setPendingFormData] = useState(null);

  useEffect(() => {
    if (!open) return;
    if (!selectedChecklist) {
      setMode("add");
      reset({
        name: "",
        description: "",
        checklist_type_id: "",
        sections: [emptySection()],
      });
      return;
    }
    setMode("view");
    if (!checklistDetail) return;
    reset({
      name: checklistDetail.name ?? "",
      description: checklistDetail.description ?? "",
      checklist_type_id: checklistDetail.checklist_type_id ?? "",
      sections: checklistDetail.sections?.length
        ? checklistDetail.sections
        : [emptySection()],
    });
  }, [open, selectedChecklist, checklistDetail, reset]);

  const onValidSubmit = (form) => {
    setPendingFormData(form);
    setConfirmOpen(true);
  };

  const handleConfirmSubmit = async () => {
    if (!pendingFormData) return;
    try {
      if (mode === "edit") {
        await updateChecklist({
          id: selectedChecklist.id,
          ...pendingFormData,
        }).unwrap();
        window.__snackbar__?.enqueueSnackbar(
          "Checklist updated successfully.",
          { variant: "success" },
        );
      } else {
        await createChecklist(pendingFormData).unwrap();
        window.__snackbar__?.enqueueSnackbar(
          "Checklist created successfully.",
          { variant: "success" },
        );
      }
      setConfirmOpen(false);
      setPendingFormData(null);
      onClose();
    } catch (err) {
      window.__snackbar__?.enqueueSnackbar(
        err?.data?.message || "Failed to save checklist.",
        { variant: "error" },
      );
      setConfirmOpen(false);
    }
  };

  const handleCancelConfirm = () => {
    setConfirmOpen(false);
    setPendingFormData(null);
  };

  const headerIcon = {
    add: <FactCheckIcon className="qcm__header-icon" />,
    view: <RemoveRedEyeIcon className="qcm__header-icon" />,
    edit: <EditIcon className="qcm__header-icon" />,
  };

  const headerTitle = {
    add: "Add Checklist",
    view: "View Checklist",
    edit: "Edit Checklist",
  };

  const isView = mode === "view";
  const isDetailLoading = checklistDetailLoading && !!selectedChecklist;
  const sectionsErrorMessage =
    errors.sections?.message ?? errors.sections?.root?.message;

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
      PaperProps={{ className: "qcm__paper" }}>
      <div className="qcm__header">
        <div className="qcm__header-title">
          {headerIcon[mode]}
          <span>{headerTitle[mode]}</span>
        </div>
        <IconButton className="qcm__close" onClick={onClose} size="small">
          <CloseIcon fontSize="small" />
        </IconButton>
      </div>

      <DialogContent className="qcm__content">
        <form onSubmit={handleSubmit(onValidSubmit)} noValidate>
          <div className="qcm__group">
            <p className="qcm__group-label">Checklist Details</p>
            {isDetailLoading ? (
              <>
                <div className="qcm__field">
                  <Skeleton
                    className="qcm__skeleton"
                    variant="text"
                    width={80}
                    height={16}
                  />
                  <Skeleton
                    className="qcm__skeleton"
                    variant="rounded"
                    height={40}
                  />
                </div>
                <div className="qcm__field">
                  <Skeleton
                    className="qcm__skeleton"
                    variant="text"
                    width={100}
                    height={16}
                  />
                  <Skeleton
                    className="qcm__skeleton"
                    variant="rounded"
                    height={72}
                  />
                </div>
                <div className="qcm__field">
                  <Skeleton
                    className="qcm__skeleton"
                    variant="text"
                    width={110}
                    height={16}
                  />
                  <Skeleton
                    className="qcm__skeleton"
                    variant="rounded"
                    height={40}
                  />
                </div>
              </>
            ) : (
              <>
                <div className="qcm__field">
                  <div
                    className={`qcm__input-wrap${errors.name ? " qcm__input-wrap--error" : ""}`}>
                    <label className="qcm__label">
                      Name<span className="qcm__required">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Enter checklist name"
                      disabled={isView}
                      {...register("name")}
                      autoComplete="off"
                    />
                  </div>
                  {errors.name && (
                    <p className="qcm__error">
                      <ReportProblemIcon />
                      {errors.name.message}
                    </p>
                  )}
                </div>

                <div className="qcm__field">
                  <div className="qcm__input-wrap qcm__input-wrap--textarea">
                    <label className="qcm__label">Description</label>
                    <textarea
                      rows={3}
                      placeholder="Enter checklist description"
                      disabled={isView}
                      {...register("description")}
                    />
                  </div>
                </div>

                <div className="qcm__field">
                  <label className="qcm__label qcm__label--static">
                    Checklist Type<span className="qcm__required">*</span>
                  </label>
                  <Controller
                    name="checklist_type_id"
                    control={control}
                    render={({ field }) => (
                      <SearchSelect
                        value={field.value}
                        onChange={field.onChange}
                        options={checklistTypeOptions}
                        getOptionLabel={getChecklistTypeOptionLabel}
                        loading={checklistTypesLoading}
                        error={!!errors.checklist_type_id}
                        placeholder="Select checklist type"
                        disabled={isView}
                        onOpen={handleOpenChecklistTypes}
                      />
                    )}
                  />
                  {errors.checklist_type_id && (
                    <p className="qcm__error">
                      <ReportProblemIcon />
                      {errors.checklist_type_id.message}
                    </p>
                  )}
                </div>
              </>
            )}
          </div>

          <div className="qcm__group">
            <p className="qcm__group-label">Sections</p>
            {isDetailLoading ? (
              <>
                <SectionCardSkeleton />
                <SectionCardSkeleton />
              </>
            ) : (
              <>
                {sectionFields.map((s, sIndex) => (
                  <SectionCard
                    key={s.id}
                    control={control}
                    register={register}
                    errors={errors}
                    sectionIndex={sIndex}
                    isView={isView}
                    onRemoveSection={() => removeSection(sIndex)}
                  />
                ))}

                {!isView && <WeightTotal totalCents={totalCents} />}

                {sectionsErrorMessage && (
                  <p className="qcm__error">
                    <ReportProblemIcon />
                    {sectionsErrorMessage}
                  </p>
                )}

                {!isView && (
                  <button
                    type="button"
                    className="qcm__add-section-link"
                    disabled={isTotalReached}
                    title={
                      isTotalReached
                        ? "Total weight already reached 100%."
                        : undefined
                    }
                    style={
                      isTotalReached
                        ? { opacity: 0.5, cursor: "not-allowed" }
                        : undefined
                    }
                    onClick={() => appendSection(emptySection())}>
                    <AddIcon fontSize="small" /> Add Section
                  </button>
                )}
              </>
            )}
          </div>

          <div className="qcm__footer">
            {!isDetailLoading &&
              (isView ? (
                <EditButton onClick={() => setMode("edit")} />
              ) : (
                <>
                  {selectedChecklist && (
                    <BackModalButton onClick={() => setMode("view")} />
                  )}
                  <SaveButton
                    label={mode === "edit" ? "Save Changes" : "Add Checklist"}
                    onClick={handleSubmit(onValidSubmit)}
                  />
                </>
              ))}
          </div>
        </form>
      </DialogContent>

      <ConfirmDialog
        open={confirmOpen}
        onClose={handleCancelConfirm}
        onConfirm={handleConfirmSubmit}
        title={mode === "edit" ? "Update Checklist" : "Add Checklist"}
        message={
          mode === "edit"
            ? `Are you sure you want to update "${pendingFormData?.name}"?`
            : `Are you sure you want to add "${pendingFormData?.name}"?`
        }
        confirmLabel={mode === "edit" ? "Update Checklist" : "Add Checklist"}
        confirmVariant="success"
      />
    </Dialog>
  );
};

export default QAChecklistModal;
