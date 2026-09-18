import { useEffect, useState } from "react";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import IconButton from "@mui/material/IconButton";
import PageContainer from "../../reusable-components/page-container/PageContainer";
import UniversalTable from "../../reusable-components/universal-table/UniversalTable";
import TablePagination from "../../reusable-components/table-pagination/TablePagination";
import {
  getChipBg,
  getChipTextColor,
  useChipColors,
} from "../../components/accountmenu/ChipColorPickerUtils";
import {
  getCompletedWeeksCount,
  getDerivedChecklistStatus,
} from "./qaWeekUtils";
import QADashboardModal from "./QADashboardModal";
import { useGetMyChecklistsQuery } from "../../features/api/qa-dashboard/qaDashboardApi";
import "./QADashboard.scss";

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const STATUS_CHIP_MAP = {
  completed: "chip-completed",
  pending: "chip-pending",
  "on going": "chip-processing",
};

const StatusChip = ({ value }) => {
  useChipColors();
  const chipId = STATUS_CHIP_MAP[value?.toLowerCase()] ?? null;
  if (!chipId) return <span className="qa-dashboard__dash">{value}</span>;
  return (
    <span
      className="qa-dashboard__chip"
      style={{
        background: getChipBg(chipId),
        color: getChipTextColor(chipId),
      }}>
      {value}
    </span>
  );
};

const pad2 = (n) => String(n).padStart(2, "0");

const QADashboard = () => {
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [sortBy, setSortBy] = useState(null);
  const [sortOrder, setSortOrder] = useState("asc");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedChecklistId, setSelectedChecklistId] = useState(null);

  const month = currentDate.getMonth() + 1;
  const year = currentDate.getFullYear();

  const { data, isFetching, refetch } = useGetMyChecklistsQuery({
    month: pad2(month),
    year: String(year),
  });

  const tableData = data?.data ?? [];
  const total = tableData.length;
  const paginatedData = tableData.slice(
    (page - 1) * rowsPerPage,
    page * rowsPerPage,
  );

  const selectedChecklist =
    tableData.find((row) => row.id === selectedChecklistId) ?? null;

  useEffect(() => {
    if (selectedChecklistId && !selectedChecklist) {
      setSelectedChecklistId(null);
    }
  }, [selectedChecklistId, selectedChecklist]);

  const handleSort = (key, order) => {
    setSortBy(key);
    setSortOrder(order);
    setPage(1);
  };
  const handleRowsPerPage = (val) => {
    setRowsPerPage(val);
    setPage(1);
  };
  const handlePrevMonth = () =>
    setCurrentDate((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1));
  const handleNextMonth = () =>
    setCurrentDate((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1));

  const handleRowClick = (row) => {
    setSelectedChecklistId(row.id);
  };

  const columns = [
    {
      key: "store",
      label: "Store",
      sortable: false,
      render: (val, row) => row.store?.name ?? "—",
    },
    {
      key: "checklist",
      label: "Checklist Name",
      sortable: false,
      render: (val, row) => row.checklist?.name ?? "—",
    },
    {
      key: "completed",
      label: "Completed",
      sortable: false,
      render: (val, row) =>
        `${getCompletedWeeksCount(row.current_month_weeks)}/${row.current_month_weeks?.length ?? 0}`,
    },
    {
      key: "status",
      label: "Status",
      sortable: false,
      render: (val, row) => (
        <StatusChip
          value={getDerivedChecklistStatus(row.current_month_weeks)}
        />
      ),
    },
  ];

  return (
    <>
      <PageContainer
        isEmpty={!isFetching && tableData.length === 0}
        actions={
          <div className="qa-dashboard__actions">
            <div className="qa-dashboard__filters">
              <div className="qa-dashboard__filters-left" />
              <div className="qa-dashboard__month-nav">
                <IconButton
                  className="qa-dashboard__month-arrow"
                  size="small"
                  onClick={handlePrevMonth}>
                  <ChevronLeftIcon />
                </IconButton>
                <span className="qa-dashboard__month-label">
                  QA Dashboard: {MONTH_NAMES[currentDate.getMonth()]}{" "}
                  {currentDate.getFullYear()}
                </span>
                <IconButton
                  className="qa-dashboard__month-arrow"
                  size="small"
                  onClick={handleNextMonth}>
                  <ChevronRightIcon />
                </IconButton>
              </div>
              <div className="qa-dashboard__filters-right" />
            </div>
          </div>
        }
        pagination={
          <TablePagination
            total={total}
            page={page}
            rowsPerPage={rowsPerPage}
            onPageChange={setPage}
            onRowsPerPageChange={handleRowsPerPage}
          />
        }>
        <UniversalTable
          columns={columns}
          data={paginatedData}
          isLoading={isFetching}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSort={handleSort}
          onRowClick={handleRowClick}
        />
      </PageContainer>

      <QADashboardModal
        open={Boolean(selectedChecklist)}
        checklistData={selectedChecklist}
        month={month}
        year={year}
        onRefetch={refetch}
        onClose={() => setSelectedChecklistId(null)}
      />
    </>
  );
};

export default QADashboard;
