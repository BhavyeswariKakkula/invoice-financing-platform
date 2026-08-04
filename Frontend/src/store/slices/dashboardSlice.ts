import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { dashboardAPI } from '../../api';

interface DashboardState {
  data: any;
  loading: boolean;
  error: string | null;
}

const initialState: DashboardState = {
  data: null,
  loading: false,
  error: null,
};

export const getBusinessDashboard = createAsyncThunk(
  'dashboard/getBusiness',
  async (_, { rejectWithValue }) => {
    try {
      const response = await dashboardAPI.getBusiness();
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to load dashboard');
    }
  }
);

export const getAdminDashboard = createAsyncThunk(
  'dashboard/getAdmin',
  async (_, { rejectWithValue }) => {
    try {
      const response = await dashboardAPI.getAdmin();
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to load dashboard');
    }
  }
);

const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState,
  reducers: {
    clearDashboard: (state) => {
      state.data = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getBusinessDashboard.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getBusinessDashboard.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload.data;
      })
      .addCase(getBusinessDashboard.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(getAdminDashboard.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getAdminDashboard.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload.data;
      })
      .addCase(getAdminDashboard.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearDashboard } = dashboardSlice.actions;
export default dashboardSlice.reducer;
