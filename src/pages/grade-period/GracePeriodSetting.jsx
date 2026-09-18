import { useMemo, useState } from "react";
import useDebounce from "../../hooks/useDebounce";
import EventBusyIcon from "@mui/icons-material/EventBusy";
import AddIcon from "@mui/icons-material/Add";
import Chip from "@mui/material/Chip";
import PageContainer from "../../reusable-components/page-container/PageContainer";
import UniversalTable from "../../reusable-components/universal-table/UniversalTable";
import TablePagination from "../../reusable-components/table-pagination/TablePagination";
import UniversalButton from "../../reusable-components/universal-buttons/UniversalButtons";
import { TableSearchField } from "../../reusable-components/table-search/TableSearch";
import RowMenu from "../../reusable-components/row-menu/RowMenu";
import {
  useGetLateGraceDaySettingsQuery,
  useActivateLateGraceDaySettingMutation,
} from "../../features/api/grace-period/gracePeriodSetting";
import ConfirmDialog from "../../reusable-components/confirm-dialog/ConfirmDialog";
import GracePeriodSettingModal from "./GracePeriodSettingModal";
import {
  getChipBg,
  getChipTextColor,
  getChipName,
  useChipColors,
  CHIP_SX,
} from "../../components/accountmenu/ChipColorPickerUtils";
import "./GracePeriodSetting.scss";

const formatDate = (value) => {
  if (!value) return "-";
  return new Date(value).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
};

const getCreatedByName = (createdBy) => createdBy?.full_name ?? "-";

const GracePeriodSetting = () => {
  useChipColors();

  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [sortBy, setSortBy] = useState("created_at");
  const [sortOrder, setSortOrder] = useState("desc");
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 500);
  const [modalOpen, setModalOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [toActivate, setToActivate] = useState(null);

  const { data, isFetching, error } = useGetLateGraceDaySettingsQuery();
  const [activateLateGraceDaySetting, { isLoading: isActivating }] =
    useActivateLateGraceDaySettingMutation();

  const is404 = error?.status === 404;
  const allSettings = is404 ? [] : (data?.data ?? []);

  const filteredSettings = useMemo(() => {
    const query = debouncedSearch.trim().toLowerCase();
    const filtered = query
      ? allSettings.filter((setting) =>
          String(setting.days).toLowerCase().includes(query),
        )
      : allSettings;

    return [...filtered].sort((a, b) => {
      const aVal = a[sortBy];
      const bVal = b[sortBy];
      if (aVal === bVal) return 0;
      const direction = sortOrder === "asc" ? 1 : -1;
      return aVal > bVal ? direction : -direction;
    });
  }, [allSettings, debouncedSearch, sortBy, sortOrder]);

  const total = filteredSettings.length;
  const tableData = filteredSettings.slice(
    (page - 1) * rowsPerPage,
    page * rowsPerPage,
  );

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
    setSearch(val);
    setPage(1);
  };

  const handleAdd = () => {
    setModalOpen(true);
  };
  const handleClose = () => {
    setModalOpen(false);
  };

  const handleActivateClick = (row) => {
    setToActivate(row);
    setConfirmOpen(true);
  };
  const handleConfirmActivate = async () => {
    if (!toActivate) return;
    try {
      await activateLateGraceDaySetting(toActivate.id).unwrap();
      window.__snackbar__?.enqueueSnackbar(
        "Grace period setting activated successfully.",
        { variant: "success" },
      );
      setConfirmOpen(false);
      setToActivate(null);
    } catch (err) {
      console.error("Activate failed:", err);
      window.__snackbar__?.enqueueSnackbar(
        "Something went wrong. Please try again.",
        { variant: "error" },
      );
    }
  };

  const renderStatusChip = (isActive) => {
    const chipId = isActive ? "chip-active" : "chip-inactive";
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
      key: "days",
      label: "Grace Days",
      sortable: true,
      render: (val) => (
        <span className="gps__days-cell">
          {val} day{val === 1 ? "" : "s"}
        </span>
      ),
    },
    {
      key: "is_active",
      label: "Status",
      sortable: false,
      render: (val) => renderStatusChip(val),
    },
    {
      key: "created_by",
      label: "Created By",
      sortable: false,
      render: (val) => (
        <span className="gps__created-by-cell">{getCreatedByName(val)}</span>
      ),
    },
    {
      key: "created_at",
      label: "Date Created",
      sortable: true,
      render: (val) => (
        <span className="gps__date-cell">{formatDate(val)}</span>
      ),
    },
  ];

  return (
    <>
      <PageContainer
        title="Late Grace Day Settings"
        titleIcon={<EventBusyIcon />}
        isEmpty={!isFetching && (tableData.length === 0 || is404)}
        titleAction={
          <UniversalButton
            label="Add Grace Period"
            tooltip="Click this button to add a new grace period setting"
            icon={<AddIcon />}
            onClick={handleAdd}
          />
        }
        actions={
          <TableSearchField
            value={search}
            onChange={handleSearch}
            placeholder="Search by grace days..."
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
          actions={(row) => (
            <span className="gps__row-menu-wrap">
              <RowMenu
                hideArchive
                isActive={row.is_active}
                onActivate={() => handleActivateClick(row)}
              />
            </span>
          )}
        />
      </PageContainer>

      <GracePeriodSettingModal open={modalOpen} onClose={handleClose} />

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => {
          setConfirmOpen(false);
          setToActivate(null);
        }}
        onConfirm={handleConfirmActivate}
        isLoading={isActivating}
        title="Activate Grace Period Setting"
        message={`Are you sure you want to activate the ${
          toActivate?.days ?? ""
        }-day grace period setting? This will deactivate any currently active setting.`}
        confirmLabel="Activate"
        confirmVariant="success"
      />
    </>
  );
};

export default GracePeriodSetting;
