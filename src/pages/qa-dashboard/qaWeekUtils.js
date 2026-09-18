export const getCompletedWeeksCount = (weeks = []) =>
  weeks.filter((w) => w.status === "completed" || w.status === "skipped")
    .length;

export const getDerivedChecklistStatus = (weeks = []) => {
  const completedCount = weeks.filter((w) => w.status === "completed").length;
  const skippedCount = weeks.filter((w) => w.status === "skipped").length;
  const notStartedCount = weeks.filter(
    (w) => w.status === "not_started",
  ).length;

  if (completedCount === 0 && skippedCount === 0) return "Pending";
  if (notStartedCount === 0) return "Completed";
  return "On Going";
};

export const isWeekActionable = (weeks = [], index) => {
  const week = weeks[index];
  if (!week || week.status !== "not_started") return false;
  if (index === 0) return true;
  const previous = weeks[index - 1];
  return previous?.status !== "not_started";
};
