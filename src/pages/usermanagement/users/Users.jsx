import { useState } from "react";
import { useRememberQueryParams } from "../../../hooks/useRememberQueryParams";
import useDebounce from "../../../hooks/useDebounce";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import PageContainer from "../../../reusable-components/page-container/PageContainer";
import UniversalTable from "../../../reusable-components/universal-table/UniversalTable";
import TablePagination from "../../../reusable-components/table-pagination/TablePagination";
import { TableSearchField } from "../../../reusable-components/table-search/TableSearch";
import {
  useGetUsersQuery,
  useResetPasswordMutation,
} from "../../../features/api/usersmanagement/usersApi";
import ConfirmDialog from "../../../reusable-components/confirm-dialog/ConfirmDialog";
import RowMenu from "../../../reusable-components/row-menu/RowMenu";
import UsersModal from "./UsersModal";
import "./Users.scss";

const COLUMNS = [
  { key: "id_no", label: "Employee ID", sortable: true },
  {
    key: "full_name",
    label: "Full Name",
    sortable: true,
  },
  { key: "username", label: "Username", sortable: true },
  {
    key: "role",
    label: "Role",
    sortable: false,
    render: (val) => val?.name ?? "—",
  },
];

const getUserId = (row) => row?.id ?? row?.user_id ?? row?.userId ?? null;

const Users = () => {
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [sortBy, setSortBy] = useState(null);
  const [sortOrder, setSortOrder] = useState("asc");
  const [queryParams, setQueryParams] = useRememberQueryParams();
  const search = queryParams.search ?? "";
  const debouncedSearch = useDebounce(search, 500);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [resetPasswordConfirmOpen, setResetPasswordConfirmOpen] =
    useState(false);
  const [toResetPassword, setToResetPassword] = useState(null);

  const currentStatus = "active";

  const { data, isFetching, error, refetch } = useGetUsersQuery({
    status: currentStatus,
    search: debouncedSearch,
    page,
    per_page: rowsPerPage,
    sort_by: sortBy,
    sort_order: sortOrder,
  });

  const [resetPassword, { isLoading: isResettingPassword }] =
    useResetPasswordMutation();

  const is404 = error?.status === 404;
  const tableData = data?.data?.data ?? [];
  const total = data?.data?.total ?? 0;

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
    const id = getUserId(row);
    if (!id) {
      console.warn(
        "Users row has no recognizable id field (checked id, user_id, userId). Row was:",
        row,
      );
    }
    setSelectedId(id);
    setModalOpen(true);
  };
  const handleClose = () => {
    setModalOpen(false);
    setSelectedId(null);
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
        {
          variant: "error",
        },
      );
    }
  };

  return (
    <>
      <PageContainer
        title="Users"
        titleIcon={<PersonAddIcon />}
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
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSort={handleSort}
          onRowClick={handleRowClick}
          actions={(row) => (
            <RowMenu
              hideArchive
              onResetPassword={() => handleResetPasswordClick(row)}
            />
          )}
        />
      </PageContainer>

      <UsersModal
        open={modalOpen}
        onClose={handleClose}
        selectedId={selectedId}
        onPasswordChanged={refetch}
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
        message={`Are you sure you want to reset the password of "${toResetPassword?.first_name} ${toResetPassword?.last_name}"?`}
        confirmLabel="Reset Password"
      />
    </>
  );
};

export default Users;
