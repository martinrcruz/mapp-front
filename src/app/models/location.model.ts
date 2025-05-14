
export interface Coordinates {
  type: 'Point';
  coordinates: [number, number]; // [longitude, latitude]
}

export interface Address {
  street: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
}

export interface Contact {
  phone: string;
  email: string;
  website?: string;
}

export interface User {
  _id: string;
  email: string;
  name: string;
}

export interface Location {
  _id: string;
  name: string;
  description: string;
  type: string;
  coordinates: Coordinates;
  address: Address;
  contact: Contact;
  createdBy?: User;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface LocationResponse {
  success: boolean;
  count: number;
  data: Location[];
}

export interface CreateLocationRequest {
  name: string;
  description: string;
  type: string;
  coordinates: Coordinates;
  address: Address;
  contact: Contact;
}

export interface UpdateLocationRequest extends Partial<CreateLocationRequest> {
  isActive?: boolean;
}
