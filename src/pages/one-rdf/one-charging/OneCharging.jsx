import { useState } from "react";
import { useRememberQueryParams } from "../../../hooks/useRememberQueryParams";
import useDebounce from "../../../hooks/useDebounce";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import SyncIcon from "@mui/icons-material/Sync";
import Chip from "@mui/material/Chip";
import PageContainer from "../../../reusable-components/page-container/PageContainer";
import UniversalTable from "../../../reusable-components/universal-table/UniversalTable";
import TablePagination from "../../../reusable-components/table-pagination/TablePagination";
import UniversalButton from "../../../reusable-components/universal-buttons/UniversalButtons";
import {
  TableSearchField,
  ArchivedButton,
} from "../../../reusable-components/table-search/TableSearch";
import {
  useGetOneChargingsQuery,
  useSyncOneChargingMutation,
} from "../../../features/api/one-rdf/oneChargingApi";
import ConfirmDialog from "../../../reusable-components/confirm-dialog/ConfirmDialog";
import OneChargingModal from "./OneChargingModal";
import {
  getChipBg,
  getChipTextColor,
  getChipName,
  useChipColors,
  CHIP_SX,
} from "../../../components/accountmenu/ChipColorPickerUtils";
import "./OneCharging.scss";

const OneCharging = () => {
  useChipColors();

  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [sortBy, setSortBy] = useState("created_at");
  const [sortOrder, setSortOrder] = useState("asc");
  const [queryParams, setQueryParams] = useRememberQueryParams();
  const showInactive = queryParams.status === "inactive";
  const search = queryParams.search ?? "";
  const debouncedSearch = useDebounce(search, 500);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedRow, setSelectedRow] = useState(null);
  const [syncConfirmOpen, setSyncConfirmOpen] = useState(false);

  const currentStatus = showInactive ? "inactive" : "active";

  const { data, isFetching, error } = useGetOneChargingsQuery({
    status: currentStatus,
    search: debouncedSearch,
    sorts: sortBy,
    page,
    per_page: rowsPerPage,
  });
  const [syncOneCharging, { isLoading: isSyncing }] =
    useSyncOneChargingMutation();

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

  const handleRowClick = (row) => {
    setSelectedRow(row);
    setModalOpen(true);
  };
  const handleClose = () => {
    setModalOpen(false);
    setSelectedRow(null);
  };

  const handleSyncClick = () => {
    setSyncConfirmOpen(true);
  };
  const handleConfirmSync = async () => {
    try {
      await syncOneCharging().unwrap();
      window.__snackbar__?.enqueueSnackbar(
        "One Charging synced successfully.",
        {
          variant: "success",
        },
      );
      setSyncConfirmOpen(false);
    } catch (err) {
      console.error("Sync failed:", err);
      window.__snackbar__?.enqueueSnackbar(
        "Something went wrong while syncing. Please try again.",
        { variant: "error" },
      );
    }
  };

  const renderStatusChip = (status) => {
    const isInactive = status === "inactive";
    const chipId = isInactive ? "chip-inactive" : "chip-active";
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
    { key: "code", label: "Code", sortable: true },
    { key: "name", label: "Name", sortable: true },
    {
      key: "amount",
      label: "Amount",
      sortable: true,
      render: (val) =>
        val != null
          ? `₱${Number(val).toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}`
          : "-",
    },
    {
      key: "status",
      label: "Status",
      sortable: false,
      render: (val) => renderStatusChip(val),
    },
  ];

  return (
    <>
      <PageContainer
        title="One Charging"
        titleIcon={<ReceiptLongIcon />}
        isEmpty={!isFetching && (tableData.length === 0 || is404)}
        titleAction={
          <UniversalButton
            label={isSyncing ? "Syncing..." : "Sync"}
            tooltip="Click this button to sync one charging records"
            icon={<SyncIcon />}
            onClick={handleSyncClick}
            disabled={isSyncing}
          />
        }
        actions={
          <>
            <ArchivedButton
              active={showInactive}
              onClick={() => {
                setQueryParams(
                  { status: showInactive ? "active" : "inactive" },
                  { retain: true },
                );
                setPage(1);
              }}
            />
            <TableSearchField
              value={search}
              onChange={handleSearch}
              placeholder="Search one charging..."
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
        />
      </PageContainer>

      <OneChargingModal
        open={modalOpen}
        onClose={handleClose}
        selectedRow={selectedRow}
      />

      <ConfirmDialog
        open={syncConfirmOpen}
        onClose={() => setSyncConfirmOpen(false)}
        onConfirm={handleConfirmSync}
        isLoading={isSyncing}
        title="Sync One Charging"
        message="Are you sure you want to sync one charging records? This will pull the latest data."
        confirmLabel="Sync"
        confirmVariant="success"
      />
    </>
  );
};

export default OneCharging;
