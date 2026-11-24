import { apiSlice } from "../../../app/apiSlice";

const extendedApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    syncOneUsers: builder.mutation({
      query: (body) => ({
        url: "one-rdf/user-sync",
        method: "POST",
        body,
      }),
      invalidatesTags: [{ type: "OneUser", id: "LIST" }],
    }),

    getOneUsers: builder.query({
      query: ({ status, syncing, search, page, per_page } = {}) => ({
        url: "one-rdf/users",
        method: "GET",
        params: { status, syncing, search, page, per_page },
      }),
      providesTags: (result) =>
        result?.data?.data
          ? [
              ...result.data.data.map(({ id }) => ({
                type: "OneUser",
                id,
              })),
              { type: "OneUser", id: "LIST" },
            ]
          : [{ type: "OneUser", id: "LIST" }],
    }),

    getOneUser: builder.query({
      query: (id) => ({
        url: `one-rdf/${id}/users`,
        method: "GET",
      }),
      providesTags: (result, error, id) => [{ type: "OneUser", id }],
    }),

    resetOneUserPassword: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `one-rdf/users/${id}/reset-password`,
        method: "PUT",
        body,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: "OneUser", id }],
    }),

    changeOneUserPassword: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `one-rdf/users/${id}/change-password`,
        method: "PUT",
        body,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: "OneUser", id }],
    }),
  }),
});

export const {
  useSyncOneUsersMutation,
  useGetOneUsersQuery,
  useGetOneUserQuery,
  useResetOneUserPasswordMutation,
  useChangeOneUserPasswordMutation,
} = extendedApi;
