export interface PositionMainAttributes {
    id: string;
    name: string;
    isArchived: boolean;
    creationTimestamp: Date;
}

export interface TaskMainAttributes {
  id: string;
  name: string;
  showOnWatch: boolean;
  showOnClock: boolean;
  isArchived: boolean;
  creationTimestamp: Date;
}

export interface RegistrationMainAttributes {
  id: string;
  type: string;
  deviceType: boolean;
  startTimestamp: string;
  endTimestamp: string;
}
