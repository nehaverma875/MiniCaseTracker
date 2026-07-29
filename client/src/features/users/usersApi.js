import { baseApi } from '../../api/baseApi';

export const usersApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAgents: builder.query({
      query: () => '/users/agents',
      providesTags: ['Agents']
    })
  })
});

export const { useGetAgentsQuery } = usersApi;
