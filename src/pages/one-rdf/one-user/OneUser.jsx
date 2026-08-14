import { useState } from "react";
import { useRememberQueryParams } from "../../../hooks/useRememberQueryParams";
import useDebounce from "../../../hooks/useDebounce";
import PeopleAltIcon from "@mui/icons-material/PeopleAlt";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import PageContainer from "../../../reusable-components/page-container/PageContainer";
import UniversalTable from "../../../reusable-components/universal-table/UniversalTable";
import TablePagination from "../../../reusable-components/table-pagination/TablePagination";
import UniversalButton from "../../../reusable-components/universal-buttons/UniversalButtons";
import { TableSearchField } from "../../../reusable-components/table-search/TableSearch";
import { useGetOneUsersQuery } from "../../../features/api/one-rdf/oneUserApi";
import OneUserModal from "./OneUserModal";
import UsersModal from "../../usermanagement/users/UsersModal";
import "./OneUser.scss";

const OneUser = () => {
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [sortBy, setSortBy] = useState("created_at");
  const [sortOrder, setSortOrder] = useState("asc");
  const [queryParams, setQueryParams] = useRememberQueryParams();
  const search = queryParams.search ?? "";
  const debouncedSearch = useDebounce(search, 500);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedRow, setSelectedRow] = useState(null);

  const [userModalOpen, setUserModalOpen] = useState(false);
  const [prefillData, setPrefillData] = useState(null);

  const { data, isFetching, error, refetch } = useGetOneUsersQuery({
    status: "active",
    search: debouncedSearch,
    sorts: sortBy,
    page,
    per_page: rowsPerPage,
  });

  const is404 = error?.status === 404;
  const tableData = is404
    ? []
    : (data?.data?.data ?? []).filter((row) => !row.synced_at);
  const total = is404 ? 0 : tableData.length;

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
    setSelectedRow(null);
    setModalOpen(true);
  };
  const handleRowClick = (row) => {
    setSelectedRow(row);
    setModalOpen(true);
  };
  const handleClose = () => {
    setModalOpen(false);
    setSelectedRow(null);
  };

  const handleEditFromOneUser = (row) => {
    setPrefillData(row);
    setUserModalOpen(true);
  };

  const handleCloseUserModal = () => {
    setUserModalOpen(false);
    setPrefillData(null);
  };

  const columns = [
    {
      key: "id_prefix",
      label: "Employee ID",
      sortable: true,
      render: (val, row) => `${row?.id_prefix ?? ""}${row?.id_no ?? ""}`,
    },
    {
      key: "first_name",
      label: "Name",
      sortable: true,
      render: (val, row) =>
        [row?.first_name, row?.middle_name, row?.last_name, row?.suffix]
          .filter(Boolean)
          .join(" "),
    },
    { key: "username", label: "Username", sortable: true },
  ];

  return (
    <>
      <PageContainer
        title="One User"
        titleIcon={<PeopleAltIcon />}
        isEmpty={!isFetching && (tableData.length === 0 || is404)}
        titleAction={
          <UniversalButton
            label="Add One User"
            tooltip="Click this button to add a new one user record"
            icon={<PersonAddIcon />}
            onClick={handleAdd}
          />
        }
        actions={
          <TableSearchField
            value={search}
            onChange={handleSearch}
            placeholder="Search one user..."
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

      <OneUserModal
        open={modalOpen}
        onClose={handleClose}
        selectedRow={selectedRow}
        onEdit={handleEditFromOneUser}
      />

      <UsersModal
        open={userModalOpen}
        onClose={handleCloseUserModal}
        prefillData={prefillData}
        onCreated={refetch}
      />
    </>
  );
};

export default OneUser;
