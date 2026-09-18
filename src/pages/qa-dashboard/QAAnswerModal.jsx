import { useRef, useState, useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import IconButton from "@mui/material/IconButton";
import Button from "@mui/material/Button";
import Skeleton from "@mui/material/Skeleton";
import CloseIcon from "@mui/icons-material/Close";
import ChecklistIcon from "@mui/icons-material/Checklist";
import VisibilityIcon from "@mui/icons-material/Visibility";
import ReportProblemIcon from "@mui/icons-material/ReportProblem";
import PhotoCameraIcon from "@mui/icons-material/PhotoCamera";
import DoneAllIcon from "@mui/icons-material/DoneAll";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import ConfirmDialog from "../../reusable-components/confirm-dialog/ConfirmDialog";
import {
  useAnswerChecklistMutation,
  useGetMyChecklistWeeklyRecordQuery,
} from "../../features/api/qa-dashboard/qaDashboardApi";
import { useGetScoreGradingsQuery } from "../../features/api/score-grading/scoreGradingApi";
import "./QAAnswerModal.scss";

const buildValidationSchema = (scoreGradingOptions) => {
  const maxPercentage = scoreGradingOptions.length
    ? Math.max(
        ...scoreGradingOptions.map((option) => Number(option.percentage) || 0),
      )
    : null;

  const isMaxScore = (scoreGradingId) => {
    if (maxPercentage === null) return false;
    const option = scoreGradingOptions.find(
      (opt) => String(opt.id) === String(scoreGradingId),
    );
    return !!option && Number(option.percentage) === maxPercentage;
  };

  const answerSchema = yup.object({
    checklist_question_id: yup.number().required(),
    score_grading_id: yup
      .number()
      .typeError("Score is required.")
      .required("Score is required."),
    remarks: yup.string().when("score_grading_id", {
      is: (value) => !isMaxScore(value),
      then: (fieldSchema) =>
        fieldSchema
          .required("Remarks is required.")
          .test(
            "not-empty",
            "Remarks is required.",
            (value) => !!value && value.trim().length > 0,
          ),
      otherwise: (fieldSchema) => fieldSchema.nullable(),
    }),
  });

  const othersSchema = yup.object({
    good_points: yup.string().nullable(),
    notes: yup.string().nullable(),
  });

  return yup
    .object({
      answers: yup.array().of(answerSchema),
      others: othersSchema,
    })
    .test(
      "good-points-required",
      "Good points is required.",
      function (values) {
        const hasMaxScoreAnswer = (values?.answers ?? []).some((answer) =>
          isMaxScore(answer?.score_grading_id),
        );
        if (!hasMaxScoreAnswer) return true;
        const goodPoints = values?.others?.good_points;
        if (goodPoints && String(goodPoints).trim().length > 0) return true;
        return this.createError({
          path: "others.good_points",
          message: "Good points is required.",
        });
      },
    );
};

const flattenSections = (sections = []) => {
  const flat = [];
  sections.forEach((section) => {
    (section.questions ?? []).forEach((question) => {
      flat.push({ section, question });
    });
  });
  return flat;
};

const buildSectionIndexMap = (flattened) => {
  const map = {};
  flattened.forEach(({ section }, index) => {
    if (!map[section.id]) map[section.id] = [];
    map[section.id].push(index);
  });
  return map;
};

// The API returns each question's saved answer nested inside an
// `answers` object keyed by category (sanitation / structural / equipment).
// Only the category that was actually answered will be non-null, so we
// just grab whichever one is present. This also stays backward-compatible
// with a flat `question.answer` shape if that ever comes back instead.
const extractQuestionAnswer = (question) => {
  if (question?.answer) return question.answer;

  const answers = question?.answers;
  if (!answers) return null;

  // Already a single answer object (has its own score_grading_id)
  if (answers.score_grading_id !== undefined) return answers;

  return answers.sanitation ?? answers.structural ?? answers.equipment ?? null;
};

const buildAnswerMapFromRecord = (weeklyRecordData) => {
  const record = weeklyRecordData?.data ?? weeklyRecordData;
  const answerMap = {};
  (record?.sections ?? []).forEach((section) => {
    (section.questions ?? []).forEach((question) => {
      const answer = extractQuestionAnswer(question);
      if (answer) {
        answerMap[question.id] = answer;
      }
    });
  });
  return { record, answerMap };
};

const buildDefaultValues = (flattenedQuestions, viewOnly, weeklyRecordData) => {
  if (!viewOnly) {
    return {
      answers: flattenedQuestions.map(({ question }) => ({
        checklist_question_id: question.id,
        score_grading_id: "",
        remarks: "",
      })),
      others: { good_points: "", notes: "" },
      applyDefaultAll: "",
    };
  }

  const { record, answerMap } = buildAnswerMapFromRecord(weeklyRecordData);

  return {
    answers: flattenedQuestions.map(({ question }) => {
      const answer = answerMap[question.id];
      return {
        checklist_question_id: question.id,
        score_grading_id: answer?.score_grading_id
          ? String(answer.score_grading_id)
          : "",
        remarks: answer?.remarks ?? "",
      };
    }),
    others: {
      good_points: record?.good_points ?? "",
      notes: record?.note ?? record?.notes ?? "",
    },
    applyDefaultAll: "",
  };
};

const buildAttachmentUrlMap = (
  flattenedQuestions,
  viewOnly,
  weeklyRecordData,
) => {
  if (!viewOnly) return {};
  const { answerMap } = buildAnswerMapFromRecord(weeklyRecordData);
  const urlMap = {};
  flattenedQuestions.forEach(({ question }, index) => {
    const answer = answerMap[question.id];
    if (answer?.attachment_url) {
      urlMap[index] = answer.attachment_url;
    }
  });
  return urlMap;
};

const PhotoCell = ({ viewOnly, attachmentUrl, attachmentName, onChange }) => {
  if (viewOnly) {
    if (!attachmentUrl) {
      return <span className="qdm__dash">-</span>;
    }
    return (
      <a
        href={attachmentUrl}
        target="_blank"
        rel="noreferrer"
        className="qam__photo-btn">
        <PhotoCameraIcon fontSize="small" />
        <span>View photo</span>
      </a>
    );
  }

  return (
    <label className="qam__photo-btn">
      <PhotoCameraIcon fontSize="small" />
      <span>{attachmentName ?? "Add photo"}</span>
      <input
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => onChange(e.target.files?.[0] ?? null)}
      />
    </label>
  );
};

const ChecklistSkeleton = () => (
  <div className="qam__skeleton">
    <div className="qam__skeleton-nav">
      <Skeleton variant="circular" width={26} height={26} />
      <Skeleton variant="text" width={160} height={22} />
      <Skeleton variant="rounded" width={70} height={26} />
    </div>

    <div className="qam__skeleton-section">
      <Skeleton
        variant="rectangular"
        height={34}
        className="qam__skeleton-section-header"
      />
      <div className="qam__skeleton-table">
        {Array.from({ length: 4 }).map((_, rowIdx) => (
          <div className="qam__skeleton-row" key={rowIdx}>
            <Skeleton variant="text" width="70%" height={18} />
            <div className="qam__skeleton-dots">
              {Array.from({ length: 4 }).map((__, dotIdx) => (
                <Skeleton
                  key={dotIdx}
                  variant="circular"
                  width={13}
                  height={13}
                />
              ))}
            </div>
            <Skeleton variant="rounded" width="100%" height={36} />
            <Skeleton variant="rounded" width={60} height={36} />
          </div>
        ))}
      </div>
    </div>

    <div className="qam__skeleton-others">
      <Skeleton
        variant="rectangular"
        height={34}
        className="qam__skeleton-section-header"
      />
      <div className="qam__skeleton-others-body">
        <Skeleton variant="rounded" height={54} />
        <Skeleton variant="rounded" height={54} />
      </div>
    </div>
  </div>
);

const LoadingFooter = ({ viewOnly, onClose }) => (
  <DialogActions className="qam__footer">
    <div className="qam__footer-left" />
    <div className="qam__footer-right">
      <Button variant="text" onClick={onClose} className="qam__btn-close">
        CLOSE
      </Button>
      {!viewOnly && (
        <Button variant="outlined" disabled className="qam__btn-draft">
          SAVE AS DRAFT
        </Button>
      )}
      {!viewOnly && (
        <Button variant="contained" disabled className="qam__btn-submit">
          SUBMIT
        </Button>
      )}
    </div>
  </DialogActions>
);

const QAAnswerForm = ({
  checklistId,
  checklistDetail,
  week,
  viewOnly,
  weeklyRecordData,
  scoreGradingOptions,
  onClose,
}) => {
  const sections = checklistDetail?.checklist?.sections ?? [];
  const flattenedQuestions = flattenSections(sections);
  const sectionIndexMap = buildSectionIndexMap(flattenedQuestions);

  const lowestScoreOption = scoreGradingOptions[0] ?? null;

  const maxScorePercentage = scoreGradingOptions.length
    ? Math.max(
        ...scoreGradingOptions.map((option) => Number(option.percentage) || 0),
      )
    : null;

  const isMaxScoreSelected = (scoreGradingId) => {
    if (maxScorePercentage === null) return false;
    const option = scoreGradingOptions.find(
      (opt) => String(opt.id) === String(scoreGradingId),
    );
    return !!option && Number(option.percentage) === maxScorePercentage;
  };

  const getScoreLabel = (option) => {
    const num = Number(option.percentage);
    return Number.isFinite(num) ? String(Math.round(num)) : option.id;
  };

  const getScoreColor = (option) => {
    const label = getScoreLabel(option);
    if (String(label).toUpperCase() === "N/A") return "#e53935";
    const num = Number(option.percentage);
    if (!Number.isFinite(num)) return "#9e9e9e";
    if (num <= 50) return "#fbc02d";
    if (num <= 75) return "#fb8c00";
    return "#43a047";
  };

  const [answerChecklist] = useAnswerChecklistMutation();

  const validationSchema = useMemo(
    () => buildValidationSchema(scoreGradingOptions),
    [scoreGradingOptions],
  );

  const {
    register,
    handleSubmit,
    setValue,
    getValues,
    watch,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(validationSchema),
    defaultValues: buildDefaultValues(
      flattenedQuestions,
      viewOnly,
      weeklyRecordData,
    ),
  });

  const watchedAnswers = watch("answers");
  const watchedApplyAll = watch("applyDefaultAll");

  const [attachments, setAttachments] = useState({});
  const [attachmentUrls, setAttachmentUrls] = useState(() =>
    buildAttachmentUrlMap(flattenedQuestions, viewOnly, weeklyRecordData),
  );
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingFormData, setPendingFormData] = useState(null);
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [activeAction, setActiveAction] = useState(null);
  const [activeSectionIndex, setActiveSectionIndex] = useState(0);
  const [autoFilledIndices, setAutoFilledIndices] = useState([]);

  const firstErrorRef = useRef(null);

  useEffect(() => {
    if (submitAttempted && firstErrorRef.current) {
      firstErrorRef.current.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, [errors, submitAttempted, activeSectionIndex]);

  const handleAttachmentChange = (index, file) => {
    setAttachments((prev) => ({ ...prev, [index]: file }));
  };

  const handleSetAllInSection = (section, optionId) => {
    const indices = sectionIndexMap[section.id] ?? [];
    indices.forEach((index) => {
      setValue(`answers.${index}.score_grading_id`, String(optionId), {
        shouldValidate: submitAttempted,
        shouldDirty: true,
      });
    });
  };

  const isAllSetTo = (section, optionId) => {
    const indices = sectionIndexMap[section.id] ?? [];
    if (indices.length === 0) return false;
    return indices.every(
      (index) =>
        String(watchedAnswers?.[index]?.score_grading_id ?? "") ===
        String(optionId),
    );
  };

  const getQuestionWeight = (question) => {
    const weight =
      question?.sanitation_percentage ??
      question?.structural_percentage ??
      question?.equipment_percentage ??
      0;
    return Number(weight) || 0;
  };

  const getSectionProgress = (section) => {
    const indices = sectionIndexMap[section.id] ?? [];
    const answered = indices.filter(
      (index) => !!watchedAnswers?.[index]?.score_grading_id,
    ).length;

    let earned = 0;
    let available = 0;

    indices.forEach((index) => {
      const question = flattenedQuestions[index]?.question;
      const weight = getQuestionWeight(question);
      available += weight;

      const optionId = watchedAnswers?.[index]?.score_grading_id;
      const option = scoreGradingOptions.find(
        (opt) => String(opt.id) === String(optionId),
      );
      if (option) {
        earned += weight * (Number(option.percentage ?? 0) / 100);
      }
    });

    const score = available > 0 ? (earned / available) * 100 : null;

    return { answered, total: indices.length, earned, available, score };
  };

  const handleApplyDefaultToAll = (value) => {
    if (!lowestScoreOption) return;

    if (value === "yes") {
      const filledIndices = [];
      flattenedQuestions.forEach((_, index) => {
        const current = getValues(`answers.${index}.score_grading_id`);
        if (!current) {
          setValue(
            `answers.${index}.score_grading_id`,
            String(lowestScoreOption.id),
            { shouldValidate: submitAttempted, shouldDirty: true },
          );
          filledIndices.push(index);
        }
      });
      setAutoFilledIndices(filledIndices);
      return;
    }

    if (value === "no") {
      autoFilledIndices.forEach((index) => {
        setValue(`answers.${index}.score_grading_id`, "", {
          shouldValidate: submitAttempted,
          shouldDirty: true,
        });
      });
      setAutoFilledIndices([]);
    }
  };

  const buildAnswersFormData = (answers, others, status) => {
    const formData = new FormData();
    answers.forEach((answer, index) => {
      formData.append(
        `answers[${index}][checklist_question_id]`,
        answer.checklist_question_id,
      );
      formData.append(
        `answers[${index}][score_grading_id]`,
        answer.score_grading_id ?? "",
      );
      formData.append(`answers[${index}][remarks]`, answer.remarks ?? "");
      if (attachments[index]) {
        formData.append(`answers[${index}][attachment]`, attachments[index]);
      }
    });
    formData.append("good_points", others?.good_points ?? "");
    formData.append("note", others?.notes ?? "");
    formData.append("status", status);
    formData.append("week", week);
    return formData;
  };

  const onValidSubmit = (form) => {
    setPendingFormData(form);
    setConfirmOpen(true);
  };

  const onInvalidSubmit = () => {
    setSubmitAttempted(true);
    const firstErrorIndex = (errors?.answers ?? []).findIndex((entry) => entry);
    if (firstErrorIndex > -1) {
      const sectionId = flattenedQuestions[firstErrorIndex]?.section?.id;
      const sectionIdx = sections.findIndex(
        (section) => section.id === sectionId,
      );
      if (sectionIdx > -1) setActiveSectionIndex(sectionIdx);
    }
  };

  const handleConfirmSubmit = async () => {
    if (!pendingFormData) return;
    setActiveAction("submit");
    try {
      const body = buildAnswersFormData(
        pendingFormData.answers,
        pendingFormData.others,
        "completed",
      );
      await answerChecklist({ id: checklistId, body }).unwrap();
      window.__snackbar__?.enqueueSnackbar(
        "Checklist submitted successfully.",
        { variant: "success" },
      );
      setConfirmOpen(false);
      setPendingFormData(null);
      onClose();
    } catch (err) {
      window.__snackbar__?.enqueueSnackbar(
        err?.data?.message || "Failed to submit checklist.",
        { variant: "error" },
      );
      setConfirmOpen(false);
    } finally {
      setActiveAction(null);
    }
  };

  const handleCancelConfirm = () => {
    setConfirmOpen(false);
    setPendingFormData(null);
  };

  const handleSaveDraft = async () => {
    setActiveAction("draft");
    try {
      const formValues = getValues();
      const body = buildAnswersFormData(
        formValues.answers,
        formValues.others,
        "draft",
      );
      await answerChecklist({ id: checklistId, body }).unwrap();
      window.__snackbar__?.enqueueSnackbar("Draft saved.", {
        variant: "success",
      });
      onClose();
    } catch (err) {
      window.__snackbar__?.enqueueSnackbar(
        err?.data?.message || "Failed to save draft.",
        { variant: "error" },
      );
    } finally {
      setActiveAction(null);
    }
  };

  const errorCount = errors?.answers
    ? errors.answers.filter(Boolean).length
    : 0;

  let firstErrorSet = false;
  const getFirstErrorRef = (hasError) => {
    if (hasError && !firstErrorSet) {
      firstErrorSet = true;
      return firstErrorRef;
    }
    return null;
  };

  const isBusy = activeAction !== null;
  const allAnswered =
    flattenedQuestions.length > 0 &&
    flattenedQuestions.every(
      (_, index) => !!watchedAnswers?.[index]?.score_grading_id,
    );
  const goodPointsRequired = (watchedAnswers ?? []).some((answer) =>
    isMaxScoreSelected(answer?.score_grading_id),
  );
  const activeSection = sections[activeSectionIndex] ?? null;
  const activeProgress = activeSection
    ? getSectionProgress(activeSection)
    : { answered: 0, total: 0, earned: 0, available: 0, score: null };

  return (
    <>
      <DialogContent className="qam__content">
        <form
          onSubmit={handleSubmit(onValidSubmit, onInvalidSubmit)}
          className={`qam__form${viewOnly ? " qam__form--view" : ""}`}
          noValidate>
          {sections.length > 0 && (
            <div className="qam__section-nav">
              <IconButton
                type="button"
                size="small"
                className="qam__section-nav-back"
                onClick={() => setActiveSectionIndex((i) => Math.max(i - 1, 0))}
                disabled={activeSectionIndex === 0}>
                <ChevronLeftIcon fontSize="small" />
              </IconButton>
              <span className="qam__section-nav-label">
                {activeSection?.name}
              </span>
              <Button
                type="button"
                size="small"
                className="qam__section-nav-next"
                endIcon={<ChevronRightIcon fontSize="small" />}
                onClick={() =>
                  setActiveSectionIndex((i) =>
                    Math.min(i + 1, sections.length - 1),
                  )
                }
                disabled={activeSectionIndex === sections.length - 1}>
                Next
              </Button>
            </div>
          )}

          {activeSection && (
            <div className="qam__section" key={activeSection.id}>
              <div className="qam__section-header">{activeSection.name}</div>
              <div className="qam__table-scroll">
                <table className="qam__grid-table">
                  <thead>
                    <tr className="qam__thead-row">
                      <th className="qam__th qam__th--item">Item</th>
                      <th className="qam__th qam__th--compliance">
                        Score
                        {!viewOnly && <span className="qam__required">*</span>}
                      </th>
                      <th className="qam__th qam__th--remarks">Remarks</th>
                      <th className="qam__th qam__th--photo">Photo</th>
                    </tr>

                    {!viewOnly && (
                      <tr className="qam__thead-row qam__thead-row--setall">
                        <th className="qam__th qam__th--setall-label">
                          <span className="qam__setall-label">
                            <DoneAllIcon sx={{ fontSize: 14 }} />
                            APPLY{" "}
                            {lowestScoreOption
                              ? getScoreLabel(lowestScoreOption)
                              : ""}
                            % TO REMAINING
                          </span>
                        </th>
                        <th className="qam__th qam__th--compliance">
                          <div className="qam__radio-group">
                            <label
                              className="qam__radio-option qam__radio-option--compact"
                              style={{ "--dot-color": "#43a047" }}>
                              <input
                                type="radio"
                                value="yes"
                                {...register("applyDefaultAll", {
                                  onChange: (e) =>
                                    handleApplyDefaultToAll(e.target.value),
                                })}
                              />
                              <span
                                className={`qam__radio-dot qam__radio-dot--compact${
                                  watchedApplyAll === "yes"
                                    ? " qam__radio-dot--checked"
                                    : ""
                                }`}
                              />
                              <span>Yes</span>
                            </label>
                            <label
                              className="qam__radio-option qam__radio-option--compact"
                              style={{ "--dot-color": "#e53935" }}>
                              <input
                                type="radio"
                                value="no"
                                {...register("applyDefaultAll", {
                                  onChange: (e) =>
                                    handleApplyDefaultToAll(e.target.value),
                                })}
                              />
                              <span
                                className={`qam__radio-dot qam__radio-dot--compact${
                                  watchedApplyAll === "no"
                                    ? " qam__radio-dot--checked"
                                    : ""
                                }`}
                              />
                              <span>No</span>
                            </label>
                          </div>
                        </th>
                        <th
                          className="qam__th qam__th--setall-note"
                          colSpan={2}>
                          Applies to unscored items in all categories
                        </th>
                      </tr>
                    )}

                    {!viewOnly && (
                      <tr className="qam__thead-row qam__thead-row--setall">
                        <th className="qam__th qam__th--setall-label">
                          <span className="qam__setall-label">
                            <DoneAllIcon sx={{ fontSize: 14 }} />
                            SET ALL TO
                          </span>
                        </th>
                        <th className="qam__th qam__th--compliance">
                          <div className="qam__radio-group">
                            {scoreGradingOptions.map((option) => {
                              const color = getScoreColor(option);
                              const active = isAllSetTo(
                                activeSection,
                                option.id,
                              );
                              return (
                                <button
                                  key={option.id}
                                  type="button"
                                  className={`qam__radio-option qam__radio-option--setall${
                                    active ? " qam__radio-option--active" : ""
                                  }`}
                                  style={{
                                    "--dot-color": color,
                                    color: active ? color : undefined,
                                  }}
                                  onClick={() =>
                                    handleSetAllInSection(
                                      activeSection,
                                      option.id,
                                    )
                                  }>
                                  <span
                                    className={`qam__radio-dot${
                                      active ? " qam__radio-dot--checked" : ""
                                    }`}
                                  />
                                  <span>{getScoreLabel(option)}</span>
                                </button>
                              );
                            })}
                          </div>
                        </th>
                        <th
                          className="qam__th qam__th--setall-note"
                          colSpan={2}>
                          Applies to all items in this section
                        </th>
                      </tr>
                    )}
                  </thead>
                  <tbody>
                    {(activeSection.questions ?? []).map((question, qIdx) => {
                      const index = sectionIndexMap[activeSection.id][qIdx];
                      const questionErrors = errors?.answers?.[index];
                      const scoreError =
                        !viewOnly && !!questionErrors?.score_grading_id;
                      const remarksError =
                        !viewOnly && !!questionErrors?.remarks;
                      const hasRowError = scoreError || remarksError;
                      const selectedId =
                        watchedAnswers?.[index]?.score_grading_id;
                      const remarksRequired = !isMaxScoreSelected(selectedId);

                      return (
                        <tr key={question.id} className="qam__tr">
                          <td className="qam__td qam__td--item">
                            <p className="qam__question-text">
                              <span className="qam__item-number">
                                {qIdx + 1}.
                              </span>{" "}
                              {question.name}
                            </p>
                          </td>

                          <td
                            ref={getFirstErrorRef(hasRowError)}
                            className={`qam__td qam__td--compliance${
                              scoreError ? " qam__td--error" : ""
                            }`}>
                            <div className="qam__radio-group">
                              {scoreGradingOptions.map((option) => {
                                const color = getScoreColor(option);
                                const checked =
                                  String(selectedId ?? "") ===
                                  String(option.id);
                                return (
                                  <label
                                    key={option.id}
                                    className="qam__radio-option"
                                    style={{
                                      "--dot-color": color,
                                      color: checked ? color : undefined,
                                    }}>
                                    <input
                                      type="radio"
                                      value={option.id}
                                      disabled={viewOnly}
                                      {...register(
                                        `answers.${index}.score_grading_id`,
                                      )}
                                    />
                                    <span
                                      className={`qam__radio-dot${
                                        checked
                                          ? " qam__radio-dot--checked"
                                          : ""
                                      }`}
                                    />
                                    <span>{getScoreLabel(option)}</span>
                                  </label>
                                );
                              })}
                            </div>
                            {scoreError && (
                              <span className="qam__inline-error">
                                <ReportProblemIcon sx={{ fontSize: 10 }} />
                                {questionErrors.score_grading_id.message}
                              </span>
                            )}
                          </td>

                          <td
                            className={`qam__td qam__td--remarks${
                              remarksError ? " qam__td--error" : ""
                            }`}>
                            {!viewOnly && remarksRequired && (
                              <span className="qam__remarks-label">
                                Remarks
                                <span className="qam__required">*</span>
                              </span>
                            )}
                            <textarea
                              className="qam__textarea"
                              rows={2}
                              placeholder="Enter remarks"
                              readOnly={viewOnly}
                              {...register(`answers.${index}.remarks`)}
                            />
                            {remarksError && (
                              <span className="qam__inline-error">
                                <ReportProblemIcon sx={{ fontSize: 10 }} />
                                {questionErrors.remarks.message}
                              </span>
                            )}
                          </td>

                          <td className="qam__td qam__td--photo">
                            <PhotoCell
                              viewOnly={viewOnly}
                              attachmentUrl={attachmentUrls[index]}
                              attachmentName={attachments[index]?.name}
                              onChange={(file) =>
                                handleAttachmentChange(index, file)
                              }
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="qam__tfoot-row">
                      <td className="qam__td qam__td--total" colSpan={2}>
                        Total Item - {activeProgress.answered}/
                        {activeProgress.total}
                      </td>
                      <td className="qam__td qam__td--total-score" colSpan={2}>
                        {activeProgress.score !== null
                          ? `${activeProgress.score.toFixed(2)}%`
                          : "-"}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}

          <div className="qam__others">
            <div className="qam__others-header">Others</div>
            <div className="qam__others-body">
              <div className="qam__others-box qam__others-box--stacked">
                <span className="qam__others-label">
                  Good Points for Sanitation, Structural and Equipment
                  {!viewOnly && goodPointsRequired && (
                    <span className="qam__required">*</span>
                  )}
                </span>
                <input
                  type="text"
                  className="qam__others-input"
                  placeholder="Type here"
                  readOnly={viewOnly}
                  {...register("others.good_points")}
                />
                {!viewOnly && errors?.others?.good_points && (
                  <span className="qam__inline-error">
                    <ReportProblemIcon sx={{ fontSize: 10 }} />
                    {errors.others.good_points.message}
                  </span>
                )}
              </div>

              <div className="qam__others-box qam__others-box--stacked">
                <span className="qam__others-label">
                  Notes for Sanitation, Structural and Equipment
                </span>
                <input
                  type="text"
                  className="qam__others-input"
                  placeholder="Type here"
                  readOnly={viewOnly}
                  {...register("others.notes")}
                />
              </div>
            </div>
          </div>
        </form>
      </DialogContent>

      <DialogActions className="qam__footer">
        <div className="qam__footer-left">
          {!viewOnly && errorCount > 0 && (
            <span className="qam__error-summary">
              <ReportProblemIcon sx={{ fontSize: 13 }} />
              {errorCount} question{errorCount > 1 ? "s" : ""} need
              {errorCount === 1 ? "s" : ""} required info
            </span>
          )}
        </div>
        <div className="qam__footer-right">
          <Button
            variant="text"
            onClick={onClose}
            disabled={isBusy}
            className="qam__btn-close">
            CLOSE
          </Button>
          {!viewOnly && (
            <Button
              variant="outlined"
              onClick={handleSaveDraft}
              disabled={isBusy}
              className="qam__btn-draft">
              {activeAction === "draft" ? "Saving..." : "SAVE AS DRAFT"}
            </Button>
          )}
          {!viewOnly && (
            <Button
              variant="contained"
              onClick={handleSubmit(onValidSubmit, onInvalidSubmit)}
              disabled={isBusy || !allAnswered}
              className="qam__btn-submit">
              {activeAction === "submit" ? "Submitting..." : "SUBMIT"}
            </Button>
          )}
        </div>
      </DialogActions>

      <ConfirmDialog
        open={confirmOpen}
        onClose={handleCancelConfirm}
        onConfirm={handleConfirmSubmit}
        title="Submit Checklist"
        message={`Are you sure you want to submit your answers for "${checklistDetail?.checklist?.name}"?`}
        confirmLabel="Submit"
        confirmVariant="success"
      />
    </>
  );
};

const QAAnswerModal = ({
  open,
  onClose,
  checklistId,
  checklistDetail,
  week,
  viewOnly = false,
  weeklyRecordId,
}) => {
  const { data: scoreGradingData, isFetching: isScoreGradingFetching } =
    useGetScoreGradingsQuery(undefined, {
      skip: !open,
    });

  const { data: weeklyRecordData, isFetching: isWeeklyRecordFetching } =
    useGetMyChecklistWeeklyRecordQuery(
      { id: checklistId, recordId: weeklyRecordId },
      { skip: !open || !viewOnly || !checklistId || !weeklyRecordId },
    );

  const rawScoreGradingOptions = Array.isArray(scoreGradingData?.data?.data)
    ? scoreGradingData.data.data
    : Array.isArray(scoreGradingData?.data)
      ? scoreGradingData.data
      : [];

  const scoreGradingOptions = [...rawScoreGradingOptions].sort(
    (a, b) => (a.layer ?? 0) - (b.layer ?? 0),
  );

  const showLoading = viewOnly
    ? isWeeklyRecordFetching || isScoreGradingFetching
    : isScoreGradingFetching;

  const formKey = `${checklistId ?? "none"}-${weeklyRecordId ?? "none"}-${
    viewOnly ? "view" : "answer"
  }-${weeklyRecordData ? "loaded" : "pending"}`;

  return (
    <Dialog
      open={open}
      onClose={(e, reason) => {
        if (reason === "backdropClick") return;
        onClose();
      }}
      disableEscapeKeyDown
      maxWidth="lg"
      fullWidth
      PaperProps={{ className: "qam__paper" }}>
      <div className="qam__header">
        <div className="qam__header-top">
          <div className="qam__header-title">
            {viewOnly ? (
              <VisibilityIcon className="qam__header-icon" />
            ) : (
              <ChecklistIcon className="qam__header-icon" />
            )}
            <span>{viewOnly ? "View Checklist" : "Answer Checklist"}</span>
          </div>
          <IconButton className="qam__close" onClick={onClose} size="small">
            <CloseIcon fontSize="small" />
          </IconButton>
        </div>
        <div className="qam__header-sub">
          <span className="qam__name-value">
            {checklistDetail?.checklist?.name}
          </span>
          <Button
            variant="outlined"
            size="small"
            startIcon={<MenuBookIcon fontSize="small" />}
            className="qam__btn-guideline">
            VIEW GUIDELINE
          </Button>
        </div>
      </div>

      {showLoading ? (
        <>
          <DialogContent className="qam__content">
            <ChecklistSkeleton />
          </DialogContent>
          <LoadingFooter viewOnly={viewOnly} onClose={onClose} />
        </>
      ) : (
        <QAAnswerForm
          key={formKey}
          checklistId={checklistId}
          checklistDetail={checklistDetail}
          week={week}
          viewOnly={viewOnly}
          weeklyRecordData={weeklyRecordData}
          scoreGradingOptions={scoreGradingOptions}
          onClose={onClose}
        />
      )}
    </Dialog>
  );
};

export default QAAnswerModal;
