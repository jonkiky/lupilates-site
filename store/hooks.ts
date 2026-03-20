import { useDispatch, useSelector, useStore } from 'react-redux';

import type { AppDispatch, AppStore } from '@/store';
import type { RootState } from '@/store/rootReducer';

export const useAppDispatch = useDispatch.withTypes<AppDispatch>();
export const useAppSelector = useSelector.withTypes<RootState>();
export const useAppStore = useStore.withTypes<AppStore>();
