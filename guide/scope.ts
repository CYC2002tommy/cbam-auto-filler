import { createContext, useContext } from 'react';
import type { GuideSection } from './keys';

/** Which form page a field sits on; set once around each page in App.tsx so fields find their guidance on their own. */
export interface GuideScopeValue {
    section?: GuideSection;
    /** Official template sheet name, given to the AI as context. */
    sheet?: string;
    /** Page title in the current language. */
    page?: string;
}

export const GuideScope = createContext<GuideScopeValue>({});
export const useGuideScope = () => useContext(GuideScope);
