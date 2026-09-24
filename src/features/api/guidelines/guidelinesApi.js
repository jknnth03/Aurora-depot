import { apiSlice } from "../../../app/apiSlice";

const extendedApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    createGuideline: builder.mutation({
      query: (body) => ({
        url: "guidelines",
        method: "POST",
        body,
      }),
      invalidatesTags: [{ type: "Guideline", id: "LIST" }],
    }),

    updateGuideline: builder.mutation({
      query: ({ id, body }) => ({
        url: `guidelines/${id}`,
        method: "POST",
        body,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "Guideline", id: "LIST" },
        { type: "Guideline", id },
      ],
    }),

    archiveGuideline: builder.mutation({
      query: (id) => ({
        url: `guidelines/${id}/toggle-archive`,
        method: "PATCH",
      }),
      invalidatesTags: (result, error, id) => [
        { type: "Guideline", id: "LIST" },
        { type: "Guideline", id },
      ],
    }),

    getGuidelines: builder.query({
      query: ({ status, sorts, search, page, per_page } = {}) => ({
        url: "guidelines",
        method: "GET",
        params: { status, sorts, search, page, per_page },
      }),
      providesTags: (result) =>
        result?.data?.data
          ? [
              ...result.data.data.map((guideline) => ({
                type: "Guideline",
                id: guideline.id,
              })),
              { type: "Guideline", id: "LIST" },
            ]
          : [{ type: "Guideline", id: "LIST" }],
    }),

    getGuideline: builder.query({
      query: (id) => ({
        url: `guidelines/${id}`,
        method: "GET",
      }),
      providesTags: (result, error, id) => [{ type: "Guideline", id }],
    }),
  }),
});

export const {
  useCreateGuidelineMutation,
  useUpdateGuidelineMutation,
  useArchiveGuidelineMutation,
  useGetGuidelinesQuery,
  useGetGuidelineQuery,
} = extendedApi;
