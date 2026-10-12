import { configureStore, createSlice, type PayloadAction } from '@reduxjs/toolkit'

// Sidebar state interface
interface SidebarState {
  sidebarShow: boolean
  sidebarUnfoldable: boolean
}

// Initial state
const initialState: SidebarState = {
  sidebarShow: true,
  sidebarUnfoldable: false,
}

// Sidebar slice
const sidebarSlice = createSlice({
  name: 'sidebar',
  initialState,
  reducers: {
    set: (state, action: PayloadAction<Partial<SidebarState>>) => {
      return { ...state, ...action.payload }
    },
  },
})

// Export actions
export const { set } = sidebarSlice.actions

// Configure store
export const store = configureStore({
  reducer: sidebarSlice.reducer,
})

// Export types
export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
