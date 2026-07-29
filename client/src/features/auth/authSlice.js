import { createSlice } from '@reduxjs/toolkit';

const token = localStorage.getItem('caseTrackerToken');
const storedUser = localStorage.getItem('caseTrackerUser');

const initialState = {
  token,
  user: storedUser ? JSON.parse(storedUser) : null
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (state, action) => {
      state.token = action.payload.token;
      state.user = action.payload.user;
      localStorage.setItem('caseTrackerToken', action.payload.token);
      localStorage.setItem('caseTrackerUser', JSON.stringify(action.payload.user));
    },
    setUser: (state, action) => {
      state.user = action.payload;
      localStorage.setItem('caseTrackerUser', JSON.stringify(action.payload));
    },
    logout: (state) => {
      state.token = null;
      state.user = null;
      localStorage.removeItem('caseTrackerToken');
      localStorage.removeItem('caseTrackerUser');
    }
  }
});

export const { setCredentials, setUser, logout } = authSlice.actions;
export default authSlice.reducer;
