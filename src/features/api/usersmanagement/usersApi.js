import { apiSlice } from "../../../app/apiSlice";

const extendedApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    createUser: builder.mutation({
      query: (body) => ({
        url: "users",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Users"],
    }),

    changePassword: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `users/${id}/change-password`,
        method: "PUT",
        body,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: "Users", id }],
    }),

    resetPassword: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `users/${id}/reset-password`,
        method: "PUT",
        body,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: "Users", id }],
    }),

    getUsers: builder.query({
      query: ({ status, search, page, per_page } = {}) => ({
        url: "users",
        method: "GET",
        params: { status, search, page, per_page },
      }),
      providesTags: (result) =>
        result?.data?.data
          ? [
              ...result.data.data.map(({ id }) => ({ type: "Users", id })),
              { type: "Users", id: "LIST" },
            ]
          : [{ type: "Users", id: "LIST" }],
    }),

    getUser: builder.query({
      query: (id) => ({
        url: `users/${id}`,
        method: "GET",
      }),
      providesTags: (result, error, id) => [{ type: "Users", id }],
    }),

    syncOneCharging: builder.mutation({
      query: (body) => ({
        url: "one-charging/sync",
        method: "POST",
        body,
      }),
      invalidatesTags: ["OneCharging"],
    }),

    getOneChargings: builder.query({
      query: ({ status, search, page, per_page } = {}) => ({
        url: "one-charging",
        method: "GET",
        params: { status, search, page, per_page },
      }),
      providesTags: (result) =>
        result?.data?.data
          ? [
              ...result.data.data.map(({ id }) => ({
                type: "OneCharging",
                id,
              })),
              { type: "OneCharging", id: "LIST" },
            ]
          : [{ type: "OneCharging", id: "LIST" }],
    }),
  }),
});

export const {
  useCreateUserMutation,
  useChangePasswordMutation,
  useResetPasswordMutation,
  useGetUsersQuery,
  useGetUserQuery,
  useSyncOneChargingMutation,
  useGetOneChargingsQuery,
} = extendedApi;
