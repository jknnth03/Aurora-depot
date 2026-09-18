import { apiSlice } from "../../../app/apiSlice";

const extendedApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    createChecklistType: builder.mutation({
      query: (body) => ({
        url: "checklist-types",
        method: "POST",
        body,
      }),
      invalidatesTags: [{ type: "ChecklistType", id: "LIST" }],
    }),

    updateChecklistType: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `checklist-types/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "ChecklistType", id: "LIST" },
        { type: "ChecklistType", id },
      ],
    }),

    toggleArchiveChecklistType: builder.mutation({
      query: (id) => ({
        url: `checklist-types/${id}/toggle-archive`,
        method: "PATCH",
      }),
      invalidatesTags: (result, error, id) => [
        { type: "ChecklistType", id: "LIST" },
        { type: "ChecklistType", id },
      ],
    }),

    getChecklistTypes: builder.query({
      query: ({ status, sorts, search, page, per_page } = {}) => ({
        url: "checklist-types",
        method: "GET",
        params: { status, sorts, search, page, per_page },
      }),
      providesTags: (result) =>
        result?.data?.data
          ? [
              ...result.data.data.map((checklistType) => ({
                type: "ChecklistType",
                id: checklistType.id,
              })),
              { type: "ChecklistType", id: "LIST" },
            ]
          : [{ type: "ChecklistType", id: "LIST" }],
    }),

    getChecklistType: builder.query({
      query: (id) => ({
        url: `checklist-types/${id}`,
        method: "GET",
      }),
      providesTags: (result, error, id) => [{ type: "ChecklistType", id }],
    }),
  }),
});

export const {
  useCreateChecklistTypeMutation,
  useUpdateChecklistTypeMutation,
  useToggleArchiveChecklistTypeMutation,
  useGetChecklistTypesQuery,
  useGetChecklistTypeQuery,
  useLazyGetChecklistTypesQuery,
} = extendedApi;
