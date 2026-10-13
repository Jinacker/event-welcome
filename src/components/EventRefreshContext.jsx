import { createContext, useContext } from 'react';
export const EventRefreshContext = createContext({ register: () => () => {} });
export const useEventRefresh = () => useContext(EventRefreshContext);
