
export enum UserRole {
  ADMIN = 'Admin',
  OPERATIONS = 'Operations',
  FINANCE = 'Finance',
  MANAGER = 'Manager',
  DRIVER = 'Driver',
  CUSTOMER = 'Customer'
}

export enum TripStatus {
  UNASSIGNED = 'Unassigned',
  ASSIGNED = 'Assigned',
  STARTED = 'Started',
  COMPLETED = 'Completed',
  CANCELLED = 'Cancelled'
}

export interface User {
  id: string;
  username: string;
  password?: string;
  role: UserRole;
  name: string;
  mobile?: string;
  isAvailable?: boolean;
}

export interface TripLog {
  id: string;
  action: string;
  userId: string;
  userName: string;
  timestamp: string;
  details: string;
}

export interface Trip {
  id: string;
  customerId: string;
  customerName: string;
  driverId?: string;
  driverName?: string;
  pickupLocation: string;
  dropLocation: string;
  status: TripStatus;
  scheduledTime: string;
  startTime?: string;
  endTime?: string;
  startSelfie?: string;
  endSelfie?: string;
  basePrice?: number;
  gst?: number;
  totalAmount?: number;
  paymentMode?: 'Cash' | 'Online';
  logs: TripLog[];
  cancelReason?: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
}

export interface DriverLocation {
  lat: number;
  lng: number;
  lastUpdated: string;
}
