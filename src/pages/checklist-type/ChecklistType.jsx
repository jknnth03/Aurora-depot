import { useState } from "react";
import { useRememberQueryParams } from "../../hooks/useRememberQueryParams";
import useDebounce from "../../hooks/useDebounce";
import ChecklistIcon from "@mui/icons-material/Checklist";
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
import {
  useGetChecklistTypesQuery,
  useToggleArchiveChecklistTypeMutation,
} from "../../features/api/checklist-type/checklistTypeApi";
import ConfirmDialog from "../../reusable-components/confirm-dialog/ConfirmDialog";
import RowMenu from "../../reusable-components/row-menu/RowMenu";
import ChecklistTypeModal from "./ChecklistTypeModal";
import {
  getChipBg,
  getChipTextColor,
  getChipName,
  useChipColors,
  CHIP_SX,
} from "../../components/accountmenu/ChipColorPickerUtils";
import "./ChecklistType.scss";

const ChecklistType = () => {
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
  const [selectedId, setSelectedId] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [toArchive, setToArchive] = useState(null);
  const [restoreConfirmOpen, setRestoreConfirmOpen] = useState(false);
  const [toRestore, setToRestore] = useState(null);

  const currentStatus = showArchived ? "inactive" : "active";

  const { data, isFetching, error } = useGetChecklistTypesQuery({
    status: currentStatus,
    search: debouncedSearch,
    sorts: sortBy,
    page,
    per_page: rowsPerPage,
  });
  const [toggleArchiveChecklistType, { isLoading: isArchiving }] =
    useToggleArchiveChecklistTypeMutation();

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

  const handleRestoreClick = (row) => {
    setToRestore(row);
    setRestoreConfirmOpen(true);
  };
  const handleConfirmRestore = async () => {
    try {
      await toggleArchiveChecklistType(toRestore.id).unwrap();
      window.__snackbar__?.enqueueSnackbar(
        "Checklist type restored successfully.",
        { variant: "success" },
      );
      setRestoreConfirmOpen(false);
      setToRestore(null);
      resetAfterRestore();
    } catch (err) {
      console.error("Restore failed:", err);
    }
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
  const handleArchiveClick = (row) => {
    setToArchive(row);
    setConfirmOpen(true);
  };
  const handleConfirmArchive = async () => {
    try {
      await toggleArchiveChecklistType(toArchive.id).unwrap();
      window.__snackbar__?.enqueueSnackbar(
        "Checklist type archived successfully.",
        { variant: "success" },
      );
      setConfirmOpen(false);
      setToArchive(null);
      resetAfterArchive();
    } catch (err) {
      console.error("Archive failed:", err);
    }
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
    { key: "name", label: "Name", sortable: true },
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
        title="Checklist Types"
        titleIcon={<ChecklistIcon />}
        isEmpty={!isFetching && (tableData.length === 0 || is404)}
        titleAction={
          <UniversalButton
            label="Add Checklist Type"
            tooltip="Click this button to add a new checklist type"
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
              placeholder="Search checklist types..."
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

      <ChecklistTypeModal
        open={modalOpen}
        onClose={handleClose}
        selectedId={selectedId}
      />

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => {
          setConfirmOpen(false);
          setToArchive(null);
        }}
        onConfirm={handleConfirmArchive}
        isLoading={isArchiving}
        title="Archive Checklist Type"
        message={`Are you sure you want to archive "${toArchive?.name}"? This action will set the checklist type as inactive.`}
      />

      <ConfirmDialog
        open={restoreConfirmOpen}
        onClose={() => {
          setRestoreConfirmOpen(false);
          setToRestore(null);
        }}
        onConfirm={handleConfirmRestore}
        isLoading={isArchiving}
        title="Restore Checklist Type"
        message={`Are you sure you want to restore "${toRestore?.name}"? This will set it back to active.`}
      />
    </>
  );
};

export default ChecklistType;
