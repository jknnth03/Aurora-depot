import { apiSlice } from "../../../app/apiSlice";

const extendedApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    createArea: builder.mutation({
      query: (body) => ({
        url: "areas",
        method: "POST",
        body,
      }),
      invalidatesTags: [{ type: "Area", id: "LIST" }],
    }),

    updateArea: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `areas/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "Area", id: "LIST" },
        { type: "Area", id },
      ],
    }),

    toggleArchiveArea: builder.mutation({
      query: (id) => ({
        url: `areas/${id}/toggle-archive`,
        method: "PATCH",
      }),
      invalidatesTags: (result, error, id) => [
        { type: "Area", id: "LIST" },
        { type: "Area", id },
      ],
    }),

    getAreas: builder.query({
      query: ({ status, sorts, search, page, per_page } = {}) => ({
        url: "areas",
        method: "GET",
        params: { status, sorts, search, page, per_page },
      }),
      providesTags: (result) =>
        result?.data?.data
          ? [
              ...result.data.data.map((area) => ({
                type: "Area",
                id: area.id,
              })),
              { type: "Area", id: "LIST" },
            ]
          : [{ type: "Area", id: "LIST" }],
    }),

    getArea: builder.query({
      query: (id) => ({
        url: `areas/${id}`,
        method: "GET",
      }),
      providesTags: (result, error, id) => [{ type: "Area", id }],
    }),

    getAreasForMyDepartment: builder.query({
      query: ({ status, sorts, search, page, per_page } = {}) => ({
        url: "areas/for-my-department",
        method: "GET",
        params: { status, sorts, search, page, per_page },
      }),
      providesTags: (result) =>
        result?.data?.data
          ? [
              ...result.data.data.map((area) => ({
                type: "Area",
                id: area.id,
              })),
              { type: "Area", id: "FOR-MY-DEPARTMENT-LIST" },
            ]
          : [{ type: "Area", id: "FOR-MY-DEPARTMENT-LIST" }],
    }),
  }),
});

export const {
  useCreateAreaMutation,
  useUpdateAreaMutation,
  useToggleArchiveAreaMutation,
  useGetAreasQuery,
  useGetAreaQuery,
  useGetAreasForMyDepartmentQuery,
} = extendedApi;
