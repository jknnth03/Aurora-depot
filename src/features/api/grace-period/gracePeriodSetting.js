import { apiSlice } from "../../../app/apiSlice";

const extendedApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    createLateGraceDaySetting: builder.mutation({
      query: (body) => ({
        url: "late-grace-day-settings",
        method: "POST",
        body,
      }),
      invalidatesTags: [{ type: "LateGraceDaySetting", id: "LIST" }],
    }),

    activateLateGraceDaySetting: builder.mutation({
      query: (id) => ({
        url: `late-grace-day-settings/${id}/activate`,
        method: "PATCH",
      }),
      invalidatesTags: (result, error, id) => [
        { type: "LateGraceDaySetting", id: "LIST" },
        { type: "LateGraceDaySetting", id },
      ],
    }),

    getLateGraceDaySettings: builder.query({
      query: () => ({
        url: "late-grace-day-settings",
        method: "GET",
      }),
      providesTags: (result) =>
        result?.data
          ? [
              ...result.data.map((setting) => ({
                type: "LateGraceDaySetting",
                id: setting.id,
              })),
              { type: "LateGraceDaySetting", id: "LIST" },
            ]
          : [{ type: "LateGraceDaySetting", id: "LIST" }],
    }),
  }),
});

export const {
  useCreateLateGraceDaySettingMutation,
  useActivateLateGraceDaySettingMutation,
  useGetLateGraceDaySettingsQuery,
} = extendedApi;
