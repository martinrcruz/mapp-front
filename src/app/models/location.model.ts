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
  companyName: string;
  comercialName: string;
  description: string;
  activity?: string;
  coordinates: Coordinates;
  address: Address;
  municipality?: string;
  cif?: string;
  cnae?: string;
  contact: Contact;
  createdBy?: User;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface LocationResponse {
  success: boolean;
  data: Location[];
  count?: number;
  error?: string;
}

export interface CreateLocationRequest {
  companyName: string;
  comercialName: string;
  description: string;
  activity?: string;
  coordinates: Coordinates;
  address: Address;
  municipality?: string;
  cif?: string;
  cnae?: string;
  contact: Contact;
}

export interface UpdateLocationRequest extends Partial<CreateLocationRequest> {
  isActive?: boolean;
}
