import { apiSlice } from "../../../app/apiSlice";

const extendedApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    syncOneCharging: builder.mutation({
      query: (body) => ({
        url: "one-charging/sync",
        method: "POST",
        body,
      }),
      invalidatesTags: [{ type: "OneCharging", id: "LIST" }],
    }),

    getOneChargings: builder.query({
      query: ({ status, sorts, search, page, per_page } = {}) => ({
        url: "one-charging",
        method: "GET",
        params: { status, sorts, search, page, per_page },
      }),
      providesTags: (result) =>
        result?.data?.data
          ? [
              ...result.data.data.map((oneCharging) => ({
                type: "OneCharging",
                id: oneCharging.id,
              })),
              { type: "OneCharging", id: "LIST" },
            ]
          : [{ type: "OneCharging", id: "LIST" }],
    }),
  }),
});

export const { useSyncOneChargingMutation, useGetOneChargingsQuery } =
  extendedApi;
