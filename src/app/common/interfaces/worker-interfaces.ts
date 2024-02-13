export interface WorkerMainAttributes {
    id: string;
    workerCode: string;
    name: string;
    clientId: string;
    notes: string;
    creationTimestamp: Date;
}


export interface WorkerGroupMainAttributes {
  id: string;
  name: string;
  isArchived: boolean;
  creationTimestamp: Date;
}
