import { apiSlice } from "../../../app/apiSlice";

const extendedApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getMyChecklists: builder.query({
      query: ({ month, year, search } = {}) => ({
        url: "my-checklists",
        method: "GET",
        params: { month, year, search },
      }),
      providesTags: (result) =>
        result?.data
          ? [
              ...result.data.map((item) => ({
                type: "MyChecklist",
                id: item.id,
              })),
              { type: "MyChecklist", id: "LIST" },
            ]
          : [{ type: "MyChecklist", id: "LIST" }],
    }),

    getMyChecklist: builder.query({
      query: (id) => ({
        url: `my-checklists/${id}`,
        method: "GET",
      }),
      providesTags: (result, error, id) => [{ type: "MyChecklist", id }],
    }),

    getMyChecklistScore: builder.query({
      query: (id) => ({
        url: `my-checklists/${id}/score`,
        method: "GET",
      }),
      providesTags: (result, error, id) => [{ type: "MyChecklistScore", id }],
    }),

    getMyChecklistWeeklyRecord: builder.query({
      query: ({ id, recordId }) => ({
        url: `my-checklists/${id}/weekly-records/${recordId}`,
        method: "GET",
      }),
      providesTags: (result, error, { id, recordId }) => [
        { type: "MyChecklistWeeklyRecord", id: recordId },
      ],
    }),

    answerChecklist: builder.mutation({
      query: ({ id, body }) => ({
        url: `area-checklists/${id}/answers`,
        method: "POST",
        body,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "MyChecklist", id: "LIST" },
        { type: "MyChecklist", id },
        { type: "MyChecklistScore", id },
      ],
    }),

    skipChecklist: builder.mutation({
      query: ({ id, week, reason }) => ({
        url: `my-checklists/${id}/skip`,
        method: "POST",
        body: { week, reason },
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "MyChecklist", id: "LIST" },
        { type: "MyChecklist", id },
      ],
    }),

    undoSkipChecklist: builder.mutation({
      query: (id) => ({
        url: `my-checklists/${id}/undo-skip`,
        method: "POST",
      }),
      invalidatesTags: (result, error, id) => [
        { type: "MyChecklist", id: "LIST" },
        { type: "MyChecklist", id },
      ],
    }),

    signWeeklyRecord: builder.mutation({
      query: ({ id, recordId, body }) => ({
        url: `my-checklists/${id}/weekly-records/${recordId}/signature`,
        method: "POST",
        body,
      }),
      invalidatesTags: (result, error, { id, recordId }) => [
        { type: "MyChecklist", id },
        { type: "MyChecklistWeeklyRecord", id: recordId },
      ],
    }),
  }),
});

export const {
  useGetMyChecklistsQuery,
  useGetMyChecklistQuery,
  useGetMyChecklistScoreQuery,
  useGetMyChecklistWeeklyRecordQuery,
  useAnswerChecklistMutation,
  useSkipChecklistMutation,
  useUndoSkipChecklistMutation,
  useSignWeeklyRecordMutation,
  useLazyGetMyChecklistsQuery,
  useLazyGetMyChecklistScoreQuery,
} = extendedApi;
