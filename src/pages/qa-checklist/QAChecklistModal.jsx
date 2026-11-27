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

const REQUIRE_ALL_CATEGORIES = true;

const CHECKLIST_TYPE_PARAMS = { status: "active", per_page: 100 };

const CATEGORIES = [
  {
    key: "is_sanitation",
    label: "Sanitation",
    payloadKey: "sanitation_percentage",
  },
  {
    key: "is_structural",
    label: "Structural",
    payloadKey: "structural_percentage",
  },
  {
    key: "is_equipment",
    label: "Equipment",
    payloadKey: "equipment_percentage",
  },
];

const toCents = (value) => Math.round((Number(value) || 0) * 100);

const formatCents = (cents) => String(Number((cents / 100).toFixed(2)));

// A category is only "active" in a section when at least one question is checked for it
const sectionHasCategory = (section, key) =>
  (section?.questions ?? []).some((q) => q?.[key]);

// Category percentage (in cents) entered in a section. Ignored if no question is checked for that category.
const computeSectionCategoryCents = (section) => {
  const result = {};

  CATEGORIES.forEach(({ key, payloadKey }) => {
    result[key] = sectionHasCategory(section, key)
      ? toCents(section?.[payloadKey])
      : 0;
  });

  return result;
};

const computeCategoryCents = (sections = []) => {
  const totals = {};
  CATEGORIES.forEach(({ key }) => {
    totals[key] = 0;
  });

  (sections ?? []).forEach((section) => {
    const sectionCents = computeSectionCategoryCents(section);
    CATEGORIES.forEach(({ key }) => {
      totals[key] += sectionCents[key];
    });
  });

  return totals;
};

const computeOverallCents = (categoryTotals = {}) => {
  const sumCents = CATEGORIES.reduce(
    (total, { key }) => total + (categoryTotals?.[key] ?? 0),
    0,
  );
  return Math.round(sumCents / CATEGORIES.length);
};

const isCategoryTotalsValid = (totals = {}) => {
  const categoriesToCheck = REQUIRE_ALL_CATEGORIES
    ? CATEGORIES
    : CATEGORIES.filter(({ key }) => (totals[key] ?? 0) > 0);

  if (!categoriesToCheck.length) return false;
  return categoriesToCheck.every(({ key }) => totals[key] === TOTAL_CENTS);
};

const buildPayload = (form) => ({
  name: form.name,
  description: (form.description ?? "").trim(),
  checklist_type_id: form.checklist_type_id,
  sections: (form.sections ?? []).map((section) => {
    const questions = section?.questions ?? [];
    const sectionCents = computeSectionCategoryCents(section);

    const percentages = {};
    CATEGORIES.forEach(({ key, payloadKey }) => {
      percentages[payloadKey] = sectionHasCategory(section, key)
        ? sectionCents[key] / 100
        : null;
    });

    return {
      name: section.name,
      ...percentages,
      questions: questions.map((q) => ({
        name: q.name,
        is_sanitation: !!q.is_sanitation,
        is_structural: !!q.is_structural,
        is_equipment: !!q.is_equipment,
      })),
    };
  }),
});

const mapDetailSectionToForm = (section) => {
  const questions = section?.questions?.length
    ? section.questions.map((q) => ({
        name: q?.name ?? "",
        is_sanitation: !!q?.is_sanitation,
        is_structural: !!q?.is_structural,
        is_equipment: !!q?.is_equipment,
      }))
    : [emptyQuestion()];

  const percentages = {};
  CATEGORIES.forEach(({ payloadKey }) => {
    const raw = section?.[payloadKey];
    percentages[payloadKey] =
      raw === undefined || raw === null || raw === ""
        ? ""
        : String(Number(Number(raw).toFixed(2)));
  });

  return {
    name: section?.name ?? "",
    ...percentages,
    questions,
  };
};

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

// Percentage is required only when at least one question in the section is checked for that category
const categoryPercentageSchema = (key, label) =>
  yup
    .string()
    .nullable()
    .test("category-percentage", function (value) {
      const questions = this.parent?.questions ?? [];
      const hasChecked = questions.some((q) => q?.[key]);
      if (!hasChecked) return true;

      const raw = String(value ?? "").trim();
      if (raw === "" || raw === ".") {
        return this.createError({
          message: `${label} percentage is required.`,
        });
      }

      const num = Number(raw);
      if (Number.isNaN(num)) {
        return this.createError({
          message: `${label} percentage is invalid.`,
        });
      }
      if (num <= 0) {
        return this.createError({
          message: `${label} percentage must be greater than 0.`,
        });
      }
      if (num > 100) {
        return this.createError({
          message: `${label} percentage cannot exceed 100.`,
        });
      }
      return true;
    });

const sectionSchema = yup.object({
  name: yup.string().required("Section name is required."),
  sanitation_percentage: categoryPercentageSchema(
    "is_sanitation",
    "Sanitation",
  ),
  structural_percentage: categoryPercentageSchema(
    "is_structural",
    "Structural",
  ),
  equipment_percentage: categoryPercentageSchema("is_equipment", "Equipment"),
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
    .test("categories-sum-100", function (value) {
      if (!value?.length) return true;
      const totals = computeCategoryCents(value);

      const categoriesToCheck = REQUIRE_ALL_CATEGORIES
        ? CATEGORIES
        : CATEGORIES.filter(({ key }) => totals[key] > 0);

      if (!categoriesToCheck.length) {
        return this.createError({
          message:
            "Select at least one category (Sanitation, Structural or Equipment).",
        });
      }

      const messages = [];
      categoriesToCheck.forEach(({ key, label }) => {
        const total = totals[key];
        if (total > TOTAL_CENTS) {
          messages.push(
            `${label} exceeds 100%. Current total: ${formatCents(total)}%.`,
          );
        } else if (total < TOTAL_CENTS) {
          messages.push(
            `${label} must add up to 100%. Current total: ${formatCents(total)}%.`,
          );
        }
      });

      if (!messages.length) return true;
      return this.createError({ message: messages.join(" ") });
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
  sanitation_percentage: "",
  structural_percentage: "",
  equipment_percentage: "",
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

const getTotalStatus = (total) =>
  total === TOTAL_CENTS ? "complete" : total > TOTAL_CENTS ? "over" : "pending";

const CategoryTotals = ({ categoryTotals, overallCents }) => (
  <div className="qcm__category-totals">
    {CATEGORIES.map(({ key, label }) => {
      const total = categoryTotals?.[key] ?? 0;
      const status = getTotalStatus(total);

      return (
        <div
          key={key}
          className={`qcm__category-total qcm__category-total--${status}`}>
          <span className="qcm__category-total-label">{label}</span>
          <span className="qcm__category-total-value">
            {formatCents(total)}% / 100%
          </span>
        </div>
      );
    })}

    <div
      title="Sanitation + Structural + Equipment ÷ 3"
      className={`qcm__category-total qcm__category-total--${getTotalStatus(overallCents)}`}>
      <span className="qcm__category-total-label">Total</span>
      <span className="qcm__category-total-value">
        {formatCents(overallCents)}% / 100%
      </span>
    </div>
  </div>
);

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
        {CATEGORIES.map(({ key, label }) => (
          <Controller
            key={key}
            control={control}
            name={`${basePath}.${key}`}
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
                label={label}
              />
            )}
          />
        ))}
      </div>
    </div>
  );
};

const SectionCard = ({
  control,
  register,
  setValue,
  errors,
  sectionIndex,
  onRemoveSection,
  isView,
  categoryTotals,
  overallCents,
}) => {
  const {
    fields: questionFields,
    append: appendQuestion,
    remove: removeQuestion,
  } = useFieldArray({
    control,
    name: `sections.${sectionIndex}.questions`,
  });

  const watchedSection = useWatch({
    control,
    name: `sections.${sectionIndex}`,
  });

  // Clear the percentage of a category once no question is checked for it anymore
  useEffect(() => {
    CATEGORIES.forEach(({ key, payloadKey }) => {
      if (
        !sectionHasCategory(watchedSection, key) &&
        watchedSection?.[payloadKey]
      ) {
        setValue(`sections.${sectionIndex}.${payloadKey}`, "");
      }
    });
  }, [watchedSection, sectionIndex, setValue]);

  const sectionErrors = errors?.sections?.[sectionIndex];

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

      <div className="qcm__field-row qcm__field-row--percentages">
        {CATEGORIES.map(({ key, label, payloadKey }) => {
          const isActive = sectionHasCategory(watchedSection, key);
          const fieldError = sectionErrors?.[payloadKey];
          const percentageField = register(
            `sections.${sectionIndex}.${payloadKey}`,
          );

          return (
            <div key={key} className="qcm__field qcm__field--percentage">
              <div
                title={
                  !isActive && !isView
                    ? `Check at least one question under ${label} to enter its percentage.`
                    : undefined
                }
                className={`qcm__input-wrap${fieldError ? " qcm__input-wrap--error" : ""}`}>
                <label className="qcm__label">
                  {label} (%)
                  {isActive && <span className="qcm__required">*</span>}
                </label>
                <input
                  type="text"
                  inputMode="decimal"
                  placeholder="0"
                  autoComplete="off"
                  disabled={isView || !isActive}
                  {...percentageField}
                  onChange={(e) => {
                    e.target.value = sanitizePercentage(e.target.value);
                    percentageField.onChange(e);
                  }}
                />
              </div>
              {fieldError && (
                <p className="qcm__error">
                  <ReportProblemIcon />
                  {fieldError.message}
                </p>
              )}
            </div>
          );
        })}
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

      <CategoryTotals
        categoryTotals={categoryTotals}
        overallCents={overallCents}
      />
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
    <div className="qcm__field">
      <Skeleton
        className="qcm__skeleton"
        variant="text"
        width={60}
        height={16}
      />
      <Skeleton className="qcm__skeleton" variant="rounded" height={40} />
    </div>
    <div className="qcm__field-row qcm__field-row--percentages">
      {[0, 1, 2].map((item) => (
        <div key={item} className="qcm__field qcm__field--percentage">
          <Skeleton
            className="qcm__skeleton"
            variant="text"
            width={80}
            height={16}
          />
          <Skeleton className="qcm__skeleton" variant="rounded" height={40} />
        </div>
      ))}
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

const QAChecklistModal = ({ open, onClose, selectedChecklist = null }) => {
  const [mode, setMode] = useState("add");

  const {
    control,
    register,
    handleSubmit,
    reset,
    setValue,
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
  const categoryTotals = computeCategoryCents(watchedSections ?? []);
  const overallCents = computeOverallCents(categoryTotals);
  const isAllCategoriesReached = CATEGORIES.every(
    ({ key }) => categoryTotals[key] >= TOTAL_CENTS,
  );

  const canSubmit = isCategoryTotalsValid(categoryTotals);

  const [
    triggerGetChecklistTypes,
    { data: checklistTypesData, isFetching: checklistTypesLoading },
  ] = useLazyGetChecklistTypesQuery();

  const { data: checklistDetailData, isFetching: checklistDetailLoading } =
    useGetChecklistQuery(selectedChecklist?.id, {
      skip: !open || !selectedChecklist?.id,
    });
  const checklistDetail = checklistDetailData?.data;

  const checklistTypeOptions = useMemo(() => {
    const list = checklistTypesData?.data?.data ?? [];
    const detailType = checklistDetail?.checklist_type;
    if (detailType?.id && !list.some((o) => o.id === detailType.id)) {
      return [detailType, ...list];
    }
    return list;
  }, [checklistTypesData, checklistDetail]);

  const handleOpenChecklistTypes = () => {
    triggerGetChecklistTypes(CHECKLIST_TYPE_PARAMS, true);
  };

  useEffect(() => {
    if (open && selectedChecklist?.id) {
      triggerGetChecklistTypes(CHECKLIST_TYPE_PARAMS, true);
    }
  }, [open, selectedChecklist?.id, triggerGetChecklistTypes]);

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
      checklist_type_id:
        checklistDetail.checklist_type_id ??
        checklistDetail.checklist_type?.id ??
        "",
      sections: checklistDetail.sections?.length
        ? checklistDetail.sections.map(mapDetailSectionToForm)
        : [emptySection()],
    });
  }, [open, selectedChecklist, checklistDetail, reset]);

  const onValidSubmit = (form) => {
    if (!isCategoryTotalsValid(computeCategoryCents(form.sections))) return;
    setPendingFormData(buildPayload(form));
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
      slotProps={{ paper: { className: "qcm__paper" } }}>
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

          <div className="qcm__group qcm__group--last">
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
                    setValue={setValue}
                    errors={errors}
                    sectionIndex={sIndex}
                    isView={isView}
                    categoryTotals={categoryTotals}
                    overallCents={overallCents}
                    onRemoveSection={() => removeSection(sIndex)}
                  />
                ))}

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
                    disabled={isAllCategoriesReached}
                    title={
                      isAllCategoriesReached
                        ? "Sanitation, Structural and Equipment already reached 100%."
                        : undefined
                    }
                    style={
                      isAllCategoriesReached
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
        </form>
      </DialogContent>

      {!isDetailLoading && (
        <div className="qcm__footer">
          {isView ? (
            <EditButton onClick={() => setMode("edit")} />
          ) : (
            <>
              {selectedChecklist && (
                <BackModalButton onClick={() => setMode("view")} />
              )}
              <SaveButton
                label={mode === "edit" ? "Save Changes" : "Add Checklist"}
                disabled={!canSubmit}
                onClick={handleSubmit(onValidSubmit)}
              />
            </>
          )}
        </div>
      )}

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
