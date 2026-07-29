import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { logout } from '../features/auth/authSlice';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

export const UPLOAD_BASE_URL = import.meta.env.VITE_UPLOAD_BASE_URL || 'http://localhost:5001';

const rawBaseQuery = fetchBaseQuery({
  baseUrl: API_URL,
  prepareHeaders: (headers, { getState }) => {
    const token = getState().auth.token || localStorage.getItem('caseTrackerToken');
    if (token) headers.set('authorization', `Bearer ${token}`);
    return headers;
  }
});

const baseQuery = async (args, api, extraOptions) => {
  const result = await rawBaseQuery(args, api, extraOptions);
  if (result.error?.status === 401) {
    api.dispatch(logout());
  }
  return result;
};

export const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery,
  tagTypes: ['Case', 'Dashboard', 'Agents', 'Me'],
  endpoints: (builder) => ({
    login: builder.mutation({
      query: (credentials) => ({
        url: '/auth/login',
        method: 'POST',
        body: credentials
      })
    }),
    getMe: builder.query({
      query: () => '/auth/me',
      providesTags: ['Me']
    }),
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
    }),
    getAgents: builder.query({
      query: () => '/users/agents',
      providesTags: ['Agents']
    })
  })
});

export const {
  useLoginMutation,
  useGetMeQuery,
  useGetDashboardQuery,
  useGetCasesQuery,
  useGetCaseQuery,
  useCreateCaseMutation,
  useAssignCaseMutation,
  useUpdateCaseStatusMutation,
  useAddCommentMutation,
  useUploadDocumentMutation,
  useGetAgentsQuery
} = apiSlice;

export const getErrorMessage = (error) => error?.data?.message || error?.error || error?.message || 'Something went wrong';

export const getFieldErrors = (error) => {
  if (error?.data?.fieldErrors) return error.data.fieldErrors;
  if (Array.isArray(error?.data?.errors)) {
    return error.data.errors.reduce((acc, item) => {
      if (item.field && item.message && !acc[item.field]) acc[item.field] = item.message;
      return acc;
    }, {});
  }
  return {};
};
