import { baseApi } from '../../api/baseApi';

export const authApi = baseApi.injectEndpoints({
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
    })
  })
});

export const { useLoginMutation, useGetMeQuery } = authApi;
