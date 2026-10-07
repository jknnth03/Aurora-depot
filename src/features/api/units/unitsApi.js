import { apiSlice } from "../../../app/apiSlice";

const extendedApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    createUnit: builder.mutation({
      query: (body) => ({
        url: "units",
        method: "POST",
        body,
      }),
      invalidatesTags: [{ type: "Unit", id: "LIST" }],
    }),

    updateUnit: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `units/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "Unit", id: "LIST" },
        { type: "Unit", id },
      ],
    }),

    toggleArchiveUnit: builder.mutation({
      query: (id) => ({
        url: `units/${id}/archive`,
        method: "PATCH",
      }),
      invalidatesTags: (result, error, id) => [
        { type: "Unit", id: "LIST" },
        { type: "Unit", id },
      ],
    }),

    deleteUnit: builder.mutation({
      query: (id) => ({
        url: `units/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, id) => [
        { type: "Unit", id: "LIST" },
        { type: "Unit", id },
      ],
    }),

    getUnits: builder.query({
      query: ({ status, sorts, search, page, per_page } = {}) => ({
        url: "units",
        method: "GET",
        params: { status, sorts, search, page, per_page },
      }),
      providesTags: (result) =>
        result?.data?.data
          ? [
              ...result.data.data.map((unit) => ({
                type: "Unit",
                id: unit.id,
              })),
              { type: "Unit", id: "LIST" },
            ]
          : [{ type: "Unit", id: "LIST" }],
    }),

    getUnit: builder.query({
      query: (id) => ({
        url: `units/${id}`,
        method: "GET",
      }),
      providesTags: (result, error, id) => [{ type: "Unit", id }],
    }),
  }),
});

export const {
  useCreateUnitMutation,
  useUpdateUnitMutation,
  useToggleArchiveUnitMutation,
  useDeleteUnitMutation,
  useGetUnitsQuery,
  useGetUnitQuery,
} = extendedApi;
