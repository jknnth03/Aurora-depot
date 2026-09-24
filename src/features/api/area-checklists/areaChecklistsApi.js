import { apiSlice } from "../../../app/apiSlice";

const extendedApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    createAreaChecklist: builder.mutation({
      query: (body) => ({
        url: "area-checklists",
        method: "POST",
        body,
      }),
      invalidatesTags: [{ type: "AreaChecklist", id: "LIST" }],
    }),

    toggleArchiveAreaChecklist: builder.mutation({
      query: (id) => ({
        url: `area-checklists/${id}/toggle-archive`,
        method: "PATCH",
      }),
      invalidatesTags: (result, error, id) => [
        { type: "AreaChecklist", id: "LIST" },
        { type: "AreaChecklist", id },
      ],
    }),

    getAreaChecklists: builder.query({
      query: ({ status, sorts, search, page, per_page } = {}) => ({
        url: "area-checklists",
        method: "GET",
        params: { status, sorts, search, page, per_page },
      }),
      providesTags: (result) =>
        result?.data?.data
          ? [
              ...result.data.data.map((areaChecklist) => ({
                type: "AreaChecklist",
                id: areaChecklist.id,
              })),
              { type: "AreaChecklist", id: "LIST" },
            ]
          : [{ type: "AreaChecklist", id: "LIST" }],
    }),

    getAreaChecklist: builder.query({
      query: (id) => ({
        url: `area-checklists/${id}`,
        method: "GET",
      }),
      providesTags: (result, error, id) => [{ type: "AreaChecklist", id }],
    }),

    getAreaChecklistScore: builder.query({
      query: ({ id, week, month, year }) => ({
        url: `area-checklists/${id}/score`,
        method: "GET",
        params: { week, month, year },
      }),
      providesTags: (result, error, { id }) => [
        { type: "AreaChecklistScore", id },
      ],
    }),

    getAreaChecklistWeeklyRecords: builder.query({
      query: ({ id, sorts, search, page, per_page } = {}) => ({
        url: `area-checklists/${id}/weekly-records`,
        method: "GET",
        params: { sorts, search, page, per_page },
      }),
      providesTags: (result, error, { id }) =>
        result?.data?.data
          ? [
              ...result.data.data.map((record) => ({
                type: "AreaChecklistWeeklyRecord",
                id: record.id,
              })),
              { type: "AreaChecklistWeeklyRecord", id: `LIST-${id}` },
            ]
          : [{ type: "AreaChecklistWeeklyRecord", id: `LIST-${id}` }],
    }),

    getAreaChecklistWeeklyRecord: builder.query({
      query: ({ id, recordId }) => ({
        url: `area-checklists/${id}/weekly-records/${recordId}`,
        method: "GET",
      }),
      providesTags: (result, error, { recordId }) => [
        { type: "AreaChecklistWeeklyRecord", id: recordId },
      ],
    }),
  }),
});

export const {
  useCreateAreaChecklistMutation,
  useToggleArchiveAreaChecklistMutation,
  useGetAreaChecklistsQuery,
  useGetAreaChecklistQuery,
  useGetAreaChecklistScoreQuery,
  useGetAreaChecklistWeeklyRecordsQuery,
  useGetAreaChecklistWeeklyRecordQuery,
} = extendedApi;
