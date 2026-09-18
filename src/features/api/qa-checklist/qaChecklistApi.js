import { apiSlice } from "../../../app/apiSlice";

const extendedApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    createChecklist: builder.mutation({
      query: (body) => ({
        url: "checklists",
        method: "POST",
        body,
      }),
      invalidatesTags: [{ type: "Checklist", id: "LIST" }],
    }),

    updateChecklist: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `checklists/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "Checklist", id: "LIST" },
        { type: "Checklist", id },
      ],
    }),

    toggleArchiveChecklist: builder.mutation({
      query: (id) => ({
        url: `checklists/${id}/toggle-archive`,
        method: "PATCH",
      }),
      invalidatesTags: (result, error, id) => [
        { type: "Checklist", id: "LIST" },
        { type: "Checklist", id },
      ],
    }),

    getChecklists: builder.query({
      query: ({ status, sorts, search, page, per_page } = {}) => ({
        url: "checklists",
        method: "GET",
        params: { status, sorts, search, page, per_page },
      }),
      providesTags: (result) =>
        result?.data?.data
          ? [
              ...result.data.data.map((checklist) => ({
                type: "Checklist",
                id: checklist.id,
              })),
              { type: "Checklist", id: "LIST" },
            ]
          : [{ type: "Checklist", id: "LIST" }],
    }),

    getChecklist: builder.query({
      query: (id) => ({
        url: `checklists/${id}`,
        method: "GET",
      }),
      providesTags: (result, error, id) => [{ type: "Checklist", id }],
    }),

    getChecklistVersions: builder.query({
      query: (id) => ({
        url: `checklists/${id}/versions`,
        method: "GET",
      }),
      providesTags: (result, error, id) => [
        { type: "Checklist", id: `${id}-VERSIONS` },
      ],
    }),
  }),
});

export const {
  useCreateChecklistMutation,
  useUpdateChecklistMutation,
  useToggleArchiveChecklistMutation,
  useGetChecklistsQuery,
  useGetChecklistQuery,
  useGetChecklistVersionsQuery,
} = extendedApi;
