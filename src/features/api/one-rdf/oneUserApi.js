import { apiSlice } from "../../../app/apiSlice";

const extendedApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    createOneUser: builder.mutation({
      query: (body) => ({
        url: "one-rdf/user-sync",
        method: "POST",
        body,
      }),
      invalidatesTags: [{ type: "OneUser", id: "LIST" }],
    }),

    getOneUsers: builder.query({
      query: ({ status, sorts, search, page, per_page } = {}) => ({
        url: "one-rdf/users",
        method: "GET",
        params: { status, sorts, search, page, per_page },
      }),
      providesTags: (result) =>
        result?.data?.data
          ? [
              ...result.data.data.map((oneUser) => ({
                type: "OneUser",
                id: oneUser.id,
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
  useCreateOneUserMutation,
  useGetOneUsersQuery,
  useGetOneUserQuery,
  useResetOneUserPasswordMutation,
  useChangeOneUserPasswordMutation,
} = extendedApi;
