import { useState } from "react";
import { useRememberQueryParams } from "../../../hooks/useRememberQueryParams";
import useDebounce from "../../../hooks/useDebounce";
import VpnKeyIcon from "@mui/icons-material/VpnKey";
import AddIcon from "@mui/icons-material/Add";
import PageContainer from "../../../reusable-components/page-container/PageContainer";
import UniversalTable from "../../../reusable-components/universal-table/UniversalTable";
import TablePagination from "../../../reusable-components/table-pagination/TablePagination";
import UniversalButton from "../../../reusable-components/universal-buttons/UniversalButtons";
import { TableSearchField } from "../../../reusable-components/table-search/TableSearch";
import { useGetPermissionsQuery } from "../../../features/api/usersmanagement/permissionsApi";
import PermissionsModal from "./PermissionsModal";
import "./Permissions.scss";

const COLUMNS = [
  { key: "id", label: "ID", sortable: true },
  { key: "name", label: "Name", sortable: true },
  {
    key: "group",
    label: "Group",
    sortable: true,
    render: (val) =>
      val ? <span className="permissions__group-chip">{val}</span> : "—",
  },
  { key: "description", label: "Description", sortable: false },
];

const Permissions = () => {
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [sortBy, setSortBy] = useState(null);
  const [sortOrder, setSortOrder] = useState("asc");
  const [queryParams, setQueryParams] = useRememberQueryParams();
  const search = queryParams.search ?? "";
  const debouncedSearch = useDebounce(search, 500);
  const [modalOpen, setModalOpen] = useState(false);

  const { data, isFetching, error } = useGetPermissionsQuery({
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
    setModalOpen(true);
  };
  const handleClose = () => {
    setModalOpen(false);
  };

  return (
    <>
      <PageContainer
        title="Permissions"
        titleIcon={<VpnKeyIcon />}
        isEmpty={!isFetching && (tableData.length === 0 || is404)}
        titleAction={
          <UniversalButton
            label="Add Permission"
            tooltip="Click this button to add a new permission"
            icon={<AddIcon />}
            onClick={handleAdd}
          />
        }
        actions={
          <TableSearchField
            value={search}
            onChange={handleSearch}
            placeholder="Search permissions..."
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
        />
      </PageContainer>

      <PermissionsModal open={modalOpen} onClose={handleClose} />
    </>
  );
};

export default Permissions;
