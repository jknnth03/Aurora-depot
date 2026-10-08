import { useState } from "react";
import { useRememberQueryParams } from "../../hooks/useRememberQueryParams";
import useDebounce from "../../hooks/useDebounce";
import AccountTreeIcon from "@mui/icons-material/AccountTree";
import AddIcon from "@mui/icons-material/Add";
import RemoveRedEyeIcon from "@mui/icons-material/RemoveRedEye";
import Chip from "@mui/material/Chip";
import IconButton from "@mui/material/IconButton";
import PageContainer from "../../reusable-components/page-container/PageContainer";
import UniversalTable from "../../reusable-components/universal-table/UniversalTable";
import TablePagination from "../../reusable-components/table-pagination/TablePagination";
import UniversalButton from "../../reusable-components/universal-buttons/UniversalButtons";
import {
  TableSearchField,
  ArchivedButton,
} from "../../reusable-components/table-search/TableSearch";
import {
  useGetUnitsQuery,
  useToggleArchiveUnitMutation,
} from "../../features/api/units/unitsApi";
import ConfirmDialog from "../../reusable-components/confirm-dialog/ConfirmDialog";
import RowMenu from "../../reusable-components/row-menu/RowMenu";
import UnitsModal from "./UnitsModal";
import UnitAreasDialog from "./UnitAreasDialog";
import {
  getChipBg,
  getChipTextColor,
  getChipName,
  useChipColors,
  CHIP_SX,
} from "../../components/accountmenu/ChipColorPickerUtils";
import "./Units.scss";

const Units = () => {
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
  const [areasDialogOpen, setAreasDialogOpen] = useState(false);
  const [selectedAreas, setSelectedAreas] = useState([]);
  const [selectedUnitName, setSelectedUnitName] = useState("");

  const currentStatus = showArchived ? "inactive" : "active";

  const { data, isFetching, error } = useGetUnitsQuery({
    status: currentStatus,
    search: debouncedSearch,
    sorts: sortBy,
    page,
    per_page: rowsPerPage,
  });
  const [toggleArchiveUnit, { isLoading: isArchiving }] =
    useToggleArchiveUnitMutation();

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
      await toggleArchiveUnit(toRestore.id).unwrap();
      window.__snackbar__?.enqueueSnackbar("Unit restored successfully.", {
        variant: "success",
      });
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
      await toggleArchiveUnit(toArchive.id).unwrap();
      window.__snackbar__?.enqueueSnackbar("Unit archived successfully.", {
        variant: "success",
      });
      setConfirmOpen(false);
      setToArchive(null);
      resetAfterArchive();
    } catch (err) {
      console.error("Archive failed:", err);
    }
  };

  const handleViewAreas = (e, row) => {
    e.stopPropagation();
    setSelectedAreas(row?.areas ?? []);
    setSelectedUnitName(row?.name ?? "");
    setAreasDialogOpen(true);
  };
  const handleCloseAreas = () => {
    setAreasDialogOpen(false);
    setSelectedAreas([]);
    setSelectedUnitName("");
  };

  const getUnitHeadName = (unitHead) => {
    if (!unitHead) return "-";
    const parts = [
      unitHead.first_name,
      unitHead.middle_name,
      unitHead.last_name,
      unitHead.suffix,
    ].filter(Boolean);
    return parts.length ? parts.join(" ") : "-";
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
      key: "unit_head",
      label: "Unit Head",
      sortable: false,
      render: (val) => getUnitHeadName(val),
    },
    {
      key: "areas",
      label: "Areas",
      sortable: false,
      render: (val, row) =>
        val?.length ? (
          <IconButton
            size="small"
            className="uad__trigger"
            onClick={(e) => handleViewAreas(e, row)}>
            <RemoveRedEyeIcon fontSize="small" />
          </IconButton>
        ) : (
          "-"
        ),
    },
    {
      key: "is_archived",
      label: "Status",
      sortable: false,
      render: (val) => renderStatusChip(val),
    },
  ];

  return (
    <>
      <PageContainer
        title="Units"
        titleIcon={<AccountTreeIcon />}
        isEmpty={!isFetching && (tableData.length === 0 || is404)}
        titleAction={
          <UniversalButton
            label="Add Unit"
            tooltip="Click this button to add a new unit"
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
              placeholder="Search units..."
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

      <UnitsModal
        open={modalOpen}
        onClose={handleClose}
        selectedId={selectedId}
      />

      <UnitAreasDialog
        open={areasDialogOpen}
        onClose={handleCloseAreas}
        areas={selectedAreas}
        unitName={selectedUnitName}
      />

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => {
          setConfirmOpen(false);
          setToArchive(null);
        }}
        onConfirm={handleConfirmArchive}
        isLoading={isArchiving}
        title="Archive Unit"
        message={`Are you sure you want to archive "${toArchive?.name}"? This action will set the unit as inactive.`}
      />

      <ConfirmDialog
        open={restoreConfirmOpen}
        onClose={() => {
          setRestoreConfirmOpen(false);
          setToRestore(null);
        }}
        onConfirm={handleConfirmRestore}
        isLoading={isArchiving}
        title="Restore Unit"
        message={`Are you sure you want to restore "${toRestore?.name}"? This will set it back to active.`}
      />
    </>
  );
};

export default Units;
