import { apiSlice } from "../../../app/apiSlice";

const extendedApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    createRole: builder.mutation({
      query: (body) => ({
        url: "roles",
        method: "POST",
        body,
      }),
      invalidatesTags: [{ type: "Role", id: "LIST" }],
    }),

    updateRole: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `roles/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "Role", id: "LIST" },
        { type: "Role", id },
      ],
    }),

    toggleArchiveRole: builder.mutation({
      query: (id) => ({
        url: `roles/${id}/toggle-archive`,
        method: "PUT",
      }),
      invalidatesTags: (result, error, id) => [
        { type: "Role", id: "LIST" },
        { type: "Role", id },
      ],
    }),

    getRoles: builder.query({
      query: ({ status, sorts, search, page, per_page } = {}) => ({
        url: "roles",
        method: "GET",
        params: { status, sorts, search, page, per_page },
      }),
      providesTags: (result) =>
        result?.data?.data
          ? [
              ...result.data.data.map((role) => ({
                type: "Role",
                id: role.id,
              })),
              { type: "Role", id: "LIST" },
            ]
          : [{ type: "Role", id: "LIST" }],
    }),

    getRole: builder.query({
      query: (id) => ({
        url: `roles/${id}`,
        method: "GET",
      }),
      providesTags: (result, error, id) => [{ type: "Role", id }],
    }),
  }),
});

export const {
  useCreateRoleMutation,
  useUpdateRoleMutation,
  useToggleArchiveRoleMutation,
  useGetRolesQuery,
  useGetRoleQuery,
} = extendedApi;
