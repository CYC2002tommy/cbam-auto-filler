import { createContext, useContext } from 'react';

export interface AiApi {
    /** Is a key available (desktop build with a key configured)? */
    available: boolean;
    /** Read these files and open the review sheet. */
    run: (files: File[]) => void;
    /** Open the file picker, then read what was chosen. */
    pick: () => void;
    /** Ask a free-text question; the page keeps its own transcript. */
    ask: (question: string, history: { role: 'user' | 'ai'; text: string }[], context: string) => Promise<string>;
}

export const AiContext = createContext<AiApi>({
    available: false,
    run: () => {},
    pick: () => {},
    ask: async () => '',
});

export const useAi = () => useContext(AiContext);
