import { apiSlice } from "../../../app/apiSlice";

const extendedApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    createDepartment: builder.mutation({
      query: (body) => ({
        url: "departments",
        method: "POST",
        body,
      }),
      invalidatesTags: [{ type: "Department", id: "LIST" }],
    }),

    updateDepartment: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `departments/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "Department", id: "LIST" },
        { type: "Department", id },
      ],
    }),

    toggleArchiveDepartment: builder.mutation({
      query: (id) => ({
        url: `departments/${id}/toggle-archive`,
        method: "PATCH",
      }),
      invalidatesTags: (result, error, id) => [
        { type: "Department", id: "LIST" },
        { type: "Department", id },
      ],
    }),

    getDepartments: builder.query({
      query: ({ status, sorts, search, page, per_page } = {}) => ({
        url: "departments",
        method: "GET",
        params: { status, sorts, search, page, per_page },
      }),
      providesTags: (result) =>
        result?.data?.data
          ? [
              ...result.data.data.map((department) => ({
                type: "Department",
                id: department.id,
              })),
              { type: "Department", id: "LIST" },
            ]
          : [{ type: "Department", id: "LIST" }],
    }),

    getDepartment: builder.query({
      query: (id) => ({
        url: `departments/${id}`,
        method: "GET",
      }),
      providesTags: (result, error, id) => [{ type: "Department", id }],
    }),
  }),
});

export const {
  useCreateDepartmentMutation,
  useUpdateDepartmentMutation,
  useToggleArchiveDepartmentMutation,
  useGetDepartmentsQuery,
  useGetDepartmentQuery,
} = extendedApi;
