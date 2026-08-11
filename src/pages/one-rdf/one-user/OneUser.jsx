import { useState } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useRememberQueryParams } from "../../../hooks/useRememberQueryParams";
import useDebounce from "../../../hooks/useDebounce";
import PeopleAltIcon from "@mui/icons-material/PeopleAlt";
import SyncIcon from "@mui/icons-material/Sync";
import LockResetIcon from "@mui/icons-material/LockReset";
import VpnKeyIcon from "@mui/icons-material/VpnKey";
import ReportProblemIcon from "@mui/icons-material/ReportProblem";
import Chip from "@mui/material/Chip";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import PageContainer from "../../../reusable-components/page-container/PageContainer";
import UniversalTable from "../../../reusable-components/universal-table/UniversalTable";
import TablePagination from "../../../reusable-components/table-pagination/TablePagination";
import UniversalButton from "../../../reusable-components/universal-buttons/UniversalButtons";
import { SaveButton } from "../../../reusable-components/universal-buttons/UniversalButtons";
import {
  TableSearchField,
  ArchivedButton,
} from "../../../reusable-components/table-search/TableSearch";
import {
  useGetOneUsersQuery,
  useCreateOneUserMutation,
  useResetOneUserPasswordMutation,
  useChangeOneUserPasswordMutation,
} from "../../../features/api/one-rdf/oneUserApi";
import ConfirmDialog from "../../../reusable-components/confirm-dialog/ConfirmDialog";
import OneUserModal from "./OneUserModal";
import {
  getChipBg,
  getChipTextColor,
  getChipName,
  useChipColors,
  CHIP_SX,
} from "../../../components/accountmenu/ChipColorPickerUtils";
import "./OneUser.scss";

const changePasswordSchema = yup.object({
  password: yup
    .string()
    .min(8, "Password must be at least 8 characters.")
    .required("New password is required."),
  password_confirmation: yup
    .string()
    .oneOf([yup.ref("password")], "Passwords must match.")
    .required("Please confirm the new password."),
});

const OneUser = () => {
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
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);
  const [toReset, setToReset] = useState(null);
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const [toChangePassword, setToChangePassword] = useState(null);

  const currentStatus = showInactive ? "inactive" : "active";

  const { data, isFetching, error } = useGetOneUsersQuery({
    status: currentStatus,
    search: debouncedSearch,
    sorts: sortBy,
    page,
    per_page: rowsPerPage,
  });
  const [createOneUser, { isLoading: isSyncing }] = useCreateOneUserMutation();
  const [resetOneUserPassword, { isLoading: isResetting }] =
    useResetOneUserPasswordMutation();
  const [changeOneUserPassword, { isLoading: isChangingPassword }] =
    useChangeOneUserPasswordMutation();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(changePasswordSchema),
    defaultValues: { password: "", password_confirmation: "" },
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
      await createOneUser().unwrap();
      window.__snackbar__?.enqueueSnackbar("One User synced successfully.", {
        variant: "success",
      });
      setSyncConfirmOpen(false);
    } catch (err) {
      console.error("Sync failed:", err);
      window.__snackbar__?.enqueueSnackbar(
        "Something went wrong while syncing. Please try again.",
        { variant: "error" },
      );
    }
  };

  const handleResetClick = (row) => {
    setToReset(row);
    setResetConfirmOpen(true);
  };
  const handleConfirmReset = async () => {
    try {
      await resetOneUserPassword({ id: toReset.employee_id }).unwrap();
      window.__snackbar__?.enqueueSnackbar("Password reset successfully.", {
        variant: "success",
      });
      setResetConfirmOpen(false);
      setToReset(null);
    } catch (err) {
      console.error("Reset password failed:", err);
      window.__snackbar__?.enqueueSnackbar(
        "Something went wrong while resetting the password. Please try again.",
        { variant: "error" },
      );
    }
  };

  const handleChangePasswordClick = (row) => {
    setToChangePassword(row);
    reset({ password: "", password_confirmation: "" });
    setChangePasswordOpen(true);
  };
  const handleCloseChangePassword = () => {
    if (isChangingPassword) return;
    setChangePasswordOpen(false);
    setToChangePassword(null);
    reset({ password: "", password_confirmation: "" });
  };
  const onSubmitChangePassword = async (form) => {
    try {
      await changeOneUserPassword({
        id: toChangePassword.employee_id,
        ...form,
      }).unwrap();
      window.__snackbar__?.enqueueSnackbar("Password changed successfully.", {
        variant: "success",
      });
      handleCloseChangePassword();
    } catch (err) {
      console.error("Change password failed:", err);
      window.__snackbar__?.enqueueSnackbar(
        "Something went wrong while changing the password. Please try again.",
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
    { key: "employee_id", label: "Employee ID", sortable: true },
    { key: "name", label: "Name", sortable: true },
    { key: "email", label: "Email", sortable: true },
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
        title="One User"
        titleIcon={<PeopleAltIcon />}
        isEmpty={!isFetching && (tableData.length === 0 || is404)}
        titleAction={
          <UniversalButton
            label={isSyncing ? "Syncing..." : "Sync"}
            tooltip="Click this button to sync one user records"
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
              placeholder="Search one user..."
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
            <>
              <Tooltip title="Reset Password">
                <IconButton
                  className="one-user__action-icon"
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleResetClick(row);
                  }}>
                  <LockResetIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Change Password">
                <IconButton
                  className="one-user__action-icon"
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleChangePasswordClick(row);
                  }}>
                  <VpnKeyIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </>
          )}
        />
      </PageContainer>

      <OneUserModal
        open={modalOpen}
        onClose={handleClose}
        selectedRow={selectedRow}
      />

      <ConfirmDialog
        open={syncConfirmOpen}
        onClose={() => setSyncConfirmOpen(false)}
        onConfirm={handleConfirmSync}
        isLoading={isSyncing}
        title="Sync One User"
        message="Are you sure you want to sync one user records? This will pull the latest data."
        confirmLabel="Sync"
        confirmVariant="success"
      />

      <ConfirmDialog
        open={resetConfirmOpen}
        onClose={() => {
          setResetConfirmOpen(false);
          setToReset(null);
        }}
        onConfirm={handleConfirmReset}
        isLoading={isResetting}
        title="Reset Password"
        message={`Are you sure you want to reset the password of "${toReset?.name}"? This will set the password back to default.`}
        confirmLabel="Reset Password"
        confirmVariant="danger"
      />

      <Dialog
        open={changePasswordOpen}
        onClose={(e, reason) => {
          if (reason === "backdropClick") return;
          handleCloseChangePassword();
        }}
        disableEscapeKeyDown
        maxWidth="xs"
        fullWidth
        PaperProps={{ className: "one-user__cp-paper" }}>
        <DialogContent className="one-user__cp-content">
          <p className="one-user__cp-title">
            Change Password
            <span className="one-user__cp-subtitle">
              {toChangePassword?.name}
            </span>
          </p>

          <form onSubmit={handleSubmit(onSubmitChangePassword)} noValidate>
            <div className="one-user__cp-field">
              <div
                className={`one-user__cp-input-wrap${
                  errors.password ? " one-user__cp-input-wrap--error" : ""
                }`}>
                <label className="one-user__cp-label">
                  New Password
                  <span className="one-user__cp-required">*</span>
                </label>
                <input
                  type="password"
                  {...register("password")}
                  autoComplete="new-password"
                />
              </div>
              {errors.password && (
                <p className="one-user__cp-error">
                  <ReportProblemIcon />
                  {errors.password?.message}
                </p>
              )}
            </div>

            <div className="one-user__cp-field" style={{ marginTop: 12 }}>
              <div
                className={`one-user__cp-input-wrap${
                  errors.password_confirmation
                    ? " one-user__cp-input-wrap--error"
                    : ""
                }`}>
                <label className="one-user__cp-label">
                  Confirm Password
                  <span className="one-user__cp-required">*</span>
                </label>
                <input
                  type="password"
                  {...register("password_confirmation")}
                  autoComplete="new-password"
                />
              </div>
              {errors.password_confirmation && (
                <p className="one-user__cp-error">
                  <ReportProblemIcon />
                  {errors.password_confirmation?.message}
                </p>
              )}
            </div>

            <div className="one-user__cp-footer">
              <SaveButton
                label={isChangingPassword ? "Saving..." : "Change Password"}
                onClick={handleSubmit(onSubmitChangePassword)}
                disabled={isChangingPassword}
              />
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default OneUser;
