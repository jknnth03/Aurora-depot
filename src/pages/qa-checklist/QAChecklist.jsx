import { useState } from "react";
import useDebounce from "../../hooks/useDebounce";
import { useRememberQueryParams } from "../../hooks/useRememberQueryParams";
import FactCheckIcon from "@mui/icons-material/FactCheck";
import AddIcon from "@mui/icons-material/Add";
import Chip from "@mui/material/Chip";
import PageContainer from "../../reusable-components/page-container/PageContainer";
import UniversalTable from "../../reusable-components/universal-table/UniversalTable";
import TablePagination from "../../reusable-components/table-pagination/TablePagination";
import UniversalButton from "../../reusable-components/universal-buttons/UniversalButtons";
import {
  TableSearchField,
  ArchivedButton,
} from "../../reusable-components/table-search/TableSearch";
import ConfirmDialog from "../../reusable-components/confirm-dialog/ConfirmDialog";
import RowMenu from "../../reusable-components/row-menu/RowMenu";
import QAChecklistModal from "./QAChecklistModal";
import {
  getChipBg,
  getChipTextColor,
  getChipName,
  useChipColors,
  CHIP_SX,
} from "../../components/accountmenu/ChipColorPickerUtils";
import {
  useGetChecklistsQuery,
  useToggleArchiveChecklistMutation,
} from "../../features/api/qa-checklist/qaChecklistApi";
import "./QAChecklist.scss";

const QAChecklist = () => {
  useChipColors();

  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [sortBy, setSortBy] = useState("created_at");
  const [sortOrder, setSortOrder] = useState("asc");
  const [queryParams, setQueryParams, , resetAfterArchive, resetAfterRestore] =
    useRememberQueryParams();
  const showArchived = queryParams.status === "inactive";
  const search = queryParams.search ?? "";
  const debouncedSearch = useDebounce(search, 500);

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedChecklist, setSelectedChecklist] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [toArchive, setToArchive] = useState(null);
  const [restoreConfirmOpen, setRestoreConfirmOpen] = useState(false);
  const [toRestore, setToRestore] = useState(null);

  const { data, isFetching } = useGetChecklistsQuery({
    status: showArchived ? "inactive" : "active",
    sorts: sortBy ? `${sortOrder === "desc" ? "-" : ""}${sortBy}` : undefined,
    search: debouncedSearch || undefined,
    page,
    per_page: rowsPerPage,
  });

  const [toggleArchiveChecklist] = useToggleArchiveChecklistMutation();

  const tableData = data?.data?.data ?? [];
  const total = data?.data?.total ?? tableData.length;

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

  const handleRestoreClick = (row) => {
    setToRestore(row);
    setRestoreConfirmOpen(true);
  };
  const handleConfirmRestore = async () => {
    try {
      await toggleArchiveChecklist(toRestore.id).unwrap();
      window.__snackbar__?.enqueueSnackbar("Checklist restored successfully.", {
        variant: "success",
      });
    } catch (err) {
      window.__snackbar__?.enqueueSnackbar(
        err?.data?.message || "Failed to restore checklist.",
        { variant: "error" },
      );
    }
    setRestoreConfirmOpen(false);
    setToRestore(null);
    resetAfterRestore();
  };

  const handleAdd = () => {
    setSelectedChecklist(null);
    setModalOpen(true);
  };
  const handleRowClick = (row) => {
    setSelectedChecklist(row);
    setModalOpen(true);
  };
  const handleClose = () => {
    setModalOpen(false);
    setSelectedChecklist(null);
  };
  const handleArchiveClick = (row) => {
    setToArchive(row);
    setConfirmOpen(true);
  };
  const handleConfirmArchive = async () => {
    try {
      await toggleArchiveChecklist(toArchive.id).unwrap();
      window.__snackbar__?.enqueueSnackbar("Checklist archived successfully.", {
        variant: "success",
      });
    } catch (err) {
      window.__snackbar__?.enqueueSnackbar(
        err?.data?.message || "Failed to archive checklist.",
        { variant: "error" },
      );
    }
    setConfirmOpen(false);
    setToArchive(null);
    resetAfterArchive();
  };

  const renderStatusChip = (isArchivedRow) => {
    const chipId = isArchivedRow ? "chip-inactive" : "chip-active";
    return (
      <Chip
        label={getChipName(chipId)}
        sx={{
          ...CHIP_SX,
          backgroundColor: getChipBg(chipId),
          color: getChipTextColor(chipId),
        }}
      />
    );
  };

  const columns = [
    {
      key: "name",
      label: "Checklist Name",
      sortable: true,
      render: (val) => <span className="qa-checklist__name-cell">{val}</span>,
    },
    {
      key: "checklist_type_id",
      label: "Type",
      sortable: false,
      render: (val, row) => row.checklist_type?.name ?? "—",
    },

    {
      key: "deleted_at",
      label: "Status",
      sortable: false,
      render: (val) => renderStatusChip(!!val),
    },
  ];

  return (
    <>
      <PageContainer
        title="QA Checklist"
        titleIcon={<FactCheckIcon />}
        isEmpty={!isFetching && tableData.length === 0}
        titleAction={
          <UniversalButton
            label="Add Checklist"
            tooltip="Click this button to add a new checklist"
            icon={<AddIcon />}
            onClick={handleAdd}
          />
        }
        actions={
          <>
            <ArchivedButton
              active={showArchived}
              onClick={() => {
                setQueryParams(
                  { status: showArchived ? "active" : "inactive" },
                  { retain: true },
                );
                setPage(1);
              }}
            />
            <TableSearchField
              value={search}
              onChange={handleSearch}
              placeholder="Search checklists..."
            />
          </>
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
          actions={(row) => (
            <RowMenu
              isArchived={showArchived}
              onArchive={() => handleArchiveClick(row)}
              onRestore={() => handleRestoreClick(row)}
            />
          )}
        />
      </PageContainer>

      <QAChecklistModal
        open={modalOpen}
        onClose={handleClose}
        selectedChecklist={selectedChecklist}
      />

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => {
          setConfirmOpen(false);
          setToArchive(null);
        }}
        onConfirm={handleConfirmArchive}
        title="Archive Checklist"
        message={`Are you sure you want to archive "${toArchive?.name}"? This action will set the checklist as inactive.`}
      />

      <ConfirmDialog
        open={restoreConfirmOpen}
        onClose={() => {
          setRestoreConfirmOpen(false);
          setToRestore(null);
        }}
        onConfirm={handleConfirmRestore}
        title="Restore Checklist"
        message={`Are you sure you want to restore "${toRestore?.name}"? This will set it back to active.`}
      />
    </>
  );
};

export default QAChecklist;
