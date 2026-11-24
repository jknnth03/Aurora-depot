import { useMemo, useState } from "react";
import { useRememberQueryParams } from "../../../hooks/useRememberQueryParams";
import useDebounce from "../../../hooks/useDebounce";
import PeopleAltIcon from "@mui/icons-material/PeopleAlt";
import PageContainer from "../../../reusable-components/page-container/PageContainer";
import UniversalTable from "../../../reusable-components/universal-table/UniversalTable";
import TablePagination from "../../../reusable-components/table-pagination/TablePagination";
import { TableSearchField } from "../../../reusable-components/table-search/TableSearch";
import {
  useGetOneUsersQuery,
  useResetOneUserPasswordMutation,
} from "../../../features/api/one-rdf/oneUserApi";
import ConfirmDialog from "../../../reusable-components/confirm-dialog/ConfirmDialog";
import RowMenu from "../../../reusable-components/row-menu/RowMenu";
import OneUserModal from "./OneUserModal";
import UsersModal from "../../usermanagement/users/UsersModal";
import "./OneUser.scss";

const SYNCING = {
  SYNCED: "synced",
  UNSYNCED: "unsynced",
};

const COLUMNS = [
  {
    key: "employee_id",
    label: "Employee ID",
    sortable: false,
    render: (val) =>
      val ? <span className="one-user__id-chip">{val}</span> : "—",
  },
  { key: "full_name", label: "Full Name", sortable: false },
  { key: "username", label: "Username", sortable: false },
];

const buildRow = (row) => ({
  ...row,
  employee_id:
    row?.id_prefix && row?.id_no
      ? `${row.id_prefix}-${row.id_no}`
      : (row?.id_no ?? ""),
  full_name:
    row?.full_name ??
    [row?.first_name, row?.middle_name, row?.last_name, row?.suffix]
      .filter(Boolean)
      .join(" "),
});

const buildPrefill = (row) => ({
  id_prefix: row?.id_prefix ?? "",
  id_no: row?.id_no ?? "",
  first_name: row?.first_name ?? "",
  middle_name: row?.middle_name ?? "",
  last_name: row?.last_name ?? "",
  suffix: row?.suffix ?? "",
  username: row?.username ?? "",
});

const OneUser = () => {
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [queryParams, setQueryParams] = useRememberQueryParams();
  const showUnsynced = queryParams.syncing === SYNCING.UNSYNCED;
  const currentSyncing = showUnsynced ? SYNCING.UNSYNCED : SYNCING.SYNCED;
  const search = queryParams.search ?? "";
  const debouncedSearch = useDebounce(search, 500);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [syncModalOpen, setSyncModalOpen] = useState(false);
  const [prefillData, setPrefillData] = useState(null);
  const [resetPasswordConfirmOpen, setResetPasswordConfirmOpen] =
    useState(false);
  const [toResetPassword, setToResetPassword] = useState(null);

  const { data, isFetching, error, refetch } = useGetOneUsersQuery({
    status: "active",
    syncing: currentSyncing,
    search: debouncedSearch,
    page,
    per_page: rowsPerPage,
  });

  const [resetPassword, { isLoading: isResettingPassword }] =
    useResetOneUserPasswordMutation();

  const is404 = error?.status === 404;
  const tableData = useMemo(
    () => (is404 ? [] : (data?.data?.data ?? []).map(buildRow)),
    [data, is404],
  );
  const total = is404 ? 0 : (data?.data?.total ?? 0);

  const handleRowsPerPage = (val) => {
    setRowsPerPage(val);
    setPage(1);
  };
  const handleSearch = (val) => {
    setQueryParams({ search: val || null }, { retain: true });
    setPage(1);
  };

  const handleRowClick = (row) => {
    if (showUnsynced) {
      setPrefillData(buildPrefill(row));
      setSyncModalOpen(true);
      return;
    }
    setSelectedId(row?.id ?? null);
    setModalOpen(true);
  };
  const handleClose = () => {
    setModalOpen(false);
    setSelectedId(null);
  };
  const handleSyncModalClose = () => {
    setSyncModalOpen(false);
    setPrefillData(null);
  };

  const handleResetPasswordClick = (row) => {
    setToResetPassword(row);
    setResetPasswordConfirmOpen(true);
  };
  const handleConfirmResetPassword = async () => {
    if (!toResetPassword) return;
    try {
      const compositeId = `${toResetPassword.id_prefix}-${toResetPassword.id_no}`;

      await resetPassword({ id: compositeId }).unwrap();

      window.__snackbar__?.enqueueSnackbar("Password reset successfully.", {
        variant: "success",
      });
      setResetPasswordConfirmOpen(false);
      setToResetPassword(null);
      refetch();
    } catch (err) {
      console.error("Reset password failed:", err);
      window.__snackbar__?.enqueueSnackbar(
        "Something went wrong. Please try again.",
        { variant: "error" },
      );
    }
  };

  return (
    <>
      <PageContainer
        title="One User"
        titleIcon={<PeopleAltIcon />}
        isEmpty={!isFetching && (tableData.length === 0 || is404)}
        actions={
          <TableSearchField
            value={search}
            onChange={handleSearch}
            placeholder="Search users..."
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
          columns={COLUMNS}
          data={tableData}
          isLoading={isFetching}
          onRowClick={handleRowClick}
          actions={
            showUnsynced
              ? undefined
              : (row) => (
                  <RowMenu
                    hideArchive
                    onResetPassword={() => handleResetPasswordClick(row)}
                  />
                )
          }
        />
      </PageContainer>

      <OneUserModal
        open={modalOpen}
        onClose={handleClose}
        selectedId={selectedId}
        onPasswordChanged={refetch}
      />

      <UsersModal
        open={syncModalOpen}
        onClose={handleSyncModalClose}
        selectedId={null}
        prefillData={prefillData}
        onCreated={refetch}
      />

      <ConfirmDialog
        open={resetPasswordConfirmOpen}
        onClose={() => {
          if (isResettingPassword) return;
          setResetPasswordConfirmOpen(false);
          setToResetPassword(null);
        }}
        onConfirm={handleConfirmResetPassword}
        isLoading={isResettingPassword}
        title="Reset Password"
        message={`Are you sure you want to reset the password of "${toResetPassword?.full_name}"?`}
        confirmLabel="Reset Password"
      />
    </>
  );
};

export default OneUser;
