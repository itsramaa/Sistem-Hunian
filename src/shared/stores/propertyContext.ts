import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface PropertyContextState {
  selectedPropertyId: string | null;
  setSelectedProperty: (id: string | null) => void;
}

export const usePropertyContext = create<PropertyContextState>()(
  persist(
    (set) => ({
      selectedPropertyId: null,
      setSelectedProperty: (id) => set({ selectedPropertyId: id }),
    }),
    {
      name: 'sihuni-property-context',
    }
  )
);
