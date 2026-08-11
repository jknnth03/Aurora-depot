import { useState } from "react";
import { useRememberQueryParams } from "../../hooks/useRememberQueryParams";
import useDebounce from "../../hooks/useDebounce";
import GradeIcon from "@mui/icons-material/Grade";
import AddIcon from "@mui/icons-material/Add";
import PageContainer from "../../reusable-components/page-container/PageContainer";
import UniversalTable from "../../reusable-components/universal-table/UniversalTable";
import TablePagination from "../../reusable-components/table-pagination/TablePagination";
import UniversalButton from "../../reusable-components/universal-buttons/UniversalButtons";
import { TableSearchField } from "../../reusable-components/table-search/TableSearch";
import { useGetScoreGradingsQuery } from "../../features/api/score-grading/scoreGradingApi";
import ScoreGradingModal from "./ScoreGradingModal";
import "./ScoreGrading.scss";

const ScoreGrading = () => {
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [sortBy, setSortBy] = useState("created_at");
  const [sortOrder, setSortOrder] = useState("asc");
  const [queryParams, setQueryParams] = useRememberQueryParams();
  const search = queryParams.search ?? "";
  const debouncedSearch = useDebounce(search, 500);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedId, setSelectedId] = useState(null);

  const { data, isFetching, error } = useGetScoreGradingsQuery({
    search: debouncedSearch,
    sorts: sortBy,
    page,
    per_page: rowsPerPage,
  });

  const is404 = error?.status === 404;
  const tableData = is404 ? [] : (data?.data?.data ?? []);
  const total = is404 ? 0 : (data?.data?.total ?? 0);

  const handleSort = (key, order) => {
    setSortBy(key);
    setSortOrder(order);
    setPage(1);
  };
  const handleRowsPerPage = (val) => {
    setRowsPerPage(val);
    setPage(1);
  };
  const handleSearch = (val) => {
    setQueryParams({ search: val || null }, { retain: true });
    setPage(1);
  };

  const handleAdd = () => {
    setSelectedId(null);
    setModalOpen(true);
  };
  const handleRowClick = (row) => {
    setSelectedId(row.id);
    setModalOpen(true);
  };
  const handleClose = () => {
    setModalOpen(false);
    setSelectedId(null);
  };

  const columns = [
    {
      key: "percentage",
      label: "Percentage",
      sortable: true,
      render: (val) => `${val}%`,
    },
    { key: "layer", label: "Layer", sortable: true },
    {
      key: "description",
      label: "Description",
      sortable: false,
      render: (val) => (
        <span className="score-grading__description-cell">{val ?? "-"}</span>
      ),
    },
  ];

  return (
    <>
      <PageContainer
        title="Score Grading"
        titleIcon={<GradeIcon />}
        isEmpty={!isFetching && (tableData.length === 0 || is404)}
        titleAction={
          <UniversalButton
            label="Add Score Grading"
            tooltip="Adding is not available at the moment. Please contact your system administrator for assistance."
            icon={<AddIcon />}
            onClick={handleAdd}
            disabled
          />
        }
        actions={
          <TableSearchField
            value={search}
            onChange={handleSearch}
            placeholder="Search score grading..."
          />
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
          data={tableData}
          isLoading={isFetching}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSort={handleSort}
          onRowClick={handleRowClick}
        />
      </PageContainer>

      <ScoreGradingModal
        open={modalOpen}
        onClose={handleClose}
        selectedId={selectedId}
      />
    </>
  );
};

export default ScoreGrading;
