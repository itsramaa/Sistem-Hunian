export interface AdminProperty {
  id: string;
  name: string;
  merchantName: string;
  type: 'kost' | 'apartment' | 'house' | 'kontrakan' | 'ruko';
  address: string;
  city: string;
  totalUnits: number;
  occupiedUnits: number;
  status: 'active' | 'inactive' | 'maintenance';
  rating: number;
  joinedDate: string;
}
