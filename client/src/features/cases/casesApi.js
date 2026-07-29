import { baseApi } from '../../api/baseApi';

export const casesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getDashboard: builder.query({
      query: () => '/cases/dashboard',
      providesTags: ['Dashboard', 'Case']
    }),
    getCases: builder.query({
      query: (params) => ({ url: '/cases', params }),
      providesTags: ['Case']
    }),
    getCase: builder.query({
      query: (id) => `/cases/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'Case', id }]
    }),
    createCase: builder.mutation({
      query: (body) => ({
        url: '/cases',
        method: 'POST',
        body
      }),
      invalidatesTags: ['Case', 'Dashboard']
    }),
    assignCase: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/cases/${id}/assign`,
        method: 'PATCH',
        body
      }),
      invalidatesTags: (_result, _error, { id }) => [{ type: 'Case', id }, 'Case', 'Dashboard']
    }),
    updateCaseStatus: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/cases/${id}/status`,
        method: 'PATCH',
        body
      }),
      invalidatesTags: (_result, _error, { id }) => [{ type: 'Case', id }, 'Case', 'Dashboard']
    }),
    addComment: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/cases/${id}/comments`,
        method: 'POST',
        body
      }),
      invalidatesTags: (_result, _error, { id }) => [{ type: 'Case', id }]
    }),
    uploadDocument: builder.mutation({
      query: ({ id, formData }) => ({
        url: `/cases/${id}/documents`,
        method: 'POST',
        body: formData
      }),
      invalidatesTags: (_result, _error, { id }) => [{ type: 'Case', id }, 'Case', 'Dashboard']
    })
  })
});

export const {
  useGetDashboardQuery,
  useGetCasesQuery,
  useGetCaseQuery,
  useCreateCaseMutation,
  useAssignCaseMutation,
  useUpdateCaseStatusMutation,
  useAddCommentMutation,
  useUploadDocumentMutation
} = casesApi;
