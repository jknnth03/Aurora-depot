import { apiSlice } from "../../../app/apiSlice";

const extendedApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    createScoreGrading: builder.mutation({
      query: (body) => ({
        url: "score-gradings",
        method: "POST",
        body,
      }),
      invalidatesTags: [{ type: "ScoreGrading", id: "LIST" }],
    }),

    updateScoreGrading: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `score-gradings/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "ScoreGrading", id: "LIST" },
        { type: "ScoreGrading", id },
      ],
    }),

    getScoreGradings: builder.query({
      query: ({ status, sorts, search, page, per_page } = {}) => ({
        url: "score-gradings",
        method: "GET",
        params: { status, sorts, search, page, per_page },
      }),
      providesTags: (result) =>
        result?.data?.data
          ? [
              ...result.data.data.map((scoreGrading) => ({
                type: "ScoreGrading",
                id: scoreGrading.id,
              })),
              { type: "ScoreGrading", id: "LIST" },
            ]
          : [{ type: "ScoreGrading", id: "LIST" }],
    }),

    getScoreGrading: builder.query({
      query: (id) => ({
        url: `score-gradings/${id}`,
        method: "GET",
      }),
      providesTags: (result, error, id) => [{ type: "ScoreGrading", id }],
    }),
  }),
});

export const {
  useCreateScoreGradingMutation,
  useUpdateScoreGradingMutation,
  useGetScoreGradingsQuery,
  useGetScoreGradingQuery,
} = extendedApi;
