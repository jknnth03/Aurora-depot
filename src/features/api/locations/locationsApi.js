import { apiSlice } from "../../../app/apiSlice";

const extendedApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    createLocation: builder.mutation({
      query: (body) => ({
        url: "locations",
        method: "POST",
        body,
      }),
      invalidatesTags: [{ type: "Location", id: "LIST" }],
    }),

    updateLocation: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `locations/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "Location", id: "LIST" },
        { type: "Location", id },
      ],
    }),

    toggleArchiveLocation: builder.mutation({
      query: (id) => ({
        url: `locations/${id}/toggle-archive`,
        method: "PATCH",
      }),
      invalidatesTags: (result, error, id) => [
        { type: "Location", id: "LIST" },
        { type: "Location", id },
      ],
    }),

    getLocations: builder.query({
      query: ({ status, sorts, search, page, per_page } = {}) => ({
        url: "locations",
        method: "GET",
        params: { status, sorts, search, page, per_page },
      }),
      providesTags: (result) =>
        result?.data?.data
          ? [
              ...result.data.data.map((location) => ({
                type: "Location",
                id: location.id,
              })),
              { type: "Location", id: "LIST" },
            ]
          : [{ type: "Location", id: "LIST" }],
    }),

    getLocation: builder.query({
      query: (id) => ({
        url: `locations/${id}`,
        method: "GET",
      }),
      providesTags: (result, error, id) => [{ type: "Location", id }],
    }),
  }),
});

export const {
  useCreateLocationMutation,
  useUpdateLocationMutation,
  useToggleArchiveLocationMutation,
  useGetLocationsQuery,
  useGetLocationQuery,
} = extendedApi;
