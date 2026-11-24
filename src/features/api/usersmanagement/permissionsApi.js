import { apiSlice } from "../../../app/apiSlice";

// NOTE: createPermission (POST /permissions), getPermissions (GET /permissions)
// and updatePermission (PATCH /permissions/:id) are confirmed per the Apidog docs.
// getPermission is commented out: the Permission folder has no Single View endpoint
// (Single View only exists under Roles). Uncomment once the backend adds it.
const extendedApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getPermissions: builder.query({
      query: ({ search, sorts, page, per_page, pagination } = {}) => ({
        url: "permissions",
        method: "GET",
        params: { search, sorts, page, per_page, pagination },
      }),
      providesTags: (result) =>
        result?.data?.data
          ? [
              ...result.data.data.map(({ id }) => ({
                type: "Permissions",
                id,
              })),
              { type: "Permissions", id: "LIST" },
            ]
          : [{ type: "Permissions", id: "LIST" }],
    }),

    // getPermission: builder.query({
    //   query: (id) => ({
    //     url: `permissions/${id}`,
    //     method: "GET",
    //   }),
    //   providesTags: (result, error, id) => [{ type: "Permissions", id }],
    // }),

    createPermission: builder.mutation({
      query: (body) => ({
        url: "permissions",
        method: "POST",
        body,
      }),
      invalidatesTags: [{ type: "Permissions", id: "LIST" }],
    }),

    updatePermission: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `permissions/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "Permissions", id },
        { type: "Permissions", id: "LIST" },
      ],
    }),
  }),
});

export const {
  useCreatePermissionMutation,
  useGetPermissionsQuery,
  // useGetPermissionQuery,
  useUpdatePermissionMutation,
} = extendedApi;
