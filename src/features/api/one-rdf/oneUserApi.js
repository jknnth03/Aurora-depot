import { apiSlice } from "../../../app/apiSlice";

const ONE_RDF_API_KEY = import.meta.env.VITE_ONE_RDF_API_KEY;

const extendedApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    createOneUser: builder.mutation({
      query: (body) => ({
        url: "one-rdf/user-sync",
        method: "POST",
        headers: { api_key: ONE_RDF_API_KEY },
        body,
      }),
      invalidatesTags: [{ type: "OneUser", id: "LIST" }],
    }),

    getOneUsers: builder.query({
      query: ({ status, sorts, search, page, per_page } = {}) => ({
        url: "one-rdf/users",
        method: "GET",
        headers: { api_key: ONE_RDF_API_KEY },
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
        headers: { api_key: ONE_RDF_API_KEY },
      }),
      providesTags: (result, error, id) => [{ type: "OneUser", id }],
    }),

    resetOneUserPassword: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `one-rdf/users/${id}/reset-password`,
        method: "PUT",
        headers: { api_key: ONE_RDF_API_KEY },
        body,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: "OneUser", id }],
    }),

    changeOneUserPassword: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `one-rdf/users/${id}/change-password`,
        method: "PUT",
        headers: { api_key: ONE_RDF_API_KEY },
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
