import { createContext, useContext } from 'react';

/**
 * Call before a destructive change (deleting a row). The app snapshots the whole form
 * and offers "復原" in a toast; any later edit retires the offer, so undo never
 * silently discards newer work.
 */
export const UndoContext = createContext<(message: string) => void>(() => {});
export const useUndo = () => useContext(UndoContext);
