import { apiSlice } from "../../../app/apiSlice";

// NOTE: createPermission (POST /permissions) and getPermissions (GET /permissions)
// are confirmed working per backend. The rest are commented out for later —
// uncomment and verify the routes/params once the backend team provides them.
const extendedApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getPermissions: builder.query({
      query: ({ search, sorts, page, per_page } = {}) => ({
        url: "permissions",
        method: "GET",
        params: { search, sorts, page, per_page },
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

    // updatePermission: builder.mutation({
    //   query: ({ id, ...body }) => ({
    //     url: `permissions/${id}`,
    //     method: "PUT",
    //     body,
    //   }),
    //   invalidatesTags: (result, error, { id }) => [
    //     { type: "Permissions", id },
    //     { type: "Permissions", id: "LIST" },
    //   ],
    // }),
  }),
});

export const {
  useCreatePermissionMutation,
  useGetPermissionsQuery,
  // useGetPermissionQuery,
  // useUpdatePermissionMutation,
} = extendedApi;
