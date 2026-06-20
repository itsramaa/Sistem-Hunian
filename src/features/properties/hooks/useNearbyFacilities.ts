import { useState, useCallback } from 'react';
import { nearbyFacilitiesService, NearbyFacilityResult } from '../api/nearbyFacilitiesService';
import { useToast } from '@/shared/hooks/use-toast';

export function useNearbyFacilities() {
  const [facilities, setFacilities] = useState<NearbyFacilityResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const fetchFacilities = useCallback(async (lat: number, lng: number) => {
    setIsLoading(true);
    try {
      const results = await nearbyFacilitiesService.fetchNearbyFacilities(lat, lng);
      setFacilities(results);
      return results;
    } catch (error) {
      console.error('Error fetching nearby facilities:', error);
      toast({
        variant: 'destructive',
        title: 'Gagal memuat fasilitas',
        description: 'Tidak dapat memuat data fasilitas terdekat.',
      });
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const saveFacilities = useCallback(async (propertyId: string, facilityList: NearbyFacilityResult[]) => {
    try {
      await nearbyFacilitiesService.saveNearbyFacilities(propertyId, facilityList);
    } catch (error) {
      console.error('Error saving facilities:', error);
    }
  }, []);

  return { facilities, isLoading, fetchFacilities, saveFacilities, setFacilities };
}
