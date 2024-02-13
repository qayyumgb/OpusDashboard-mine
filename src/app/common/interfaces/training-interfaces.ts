export interface TrainingMainAttributes {
  id?: string;
  clientId: string;
  creationTimestamp: Date;
  activityType: 'regular' | 'training';
}

export interface TrainingRemainingAttributes {
  deviceId: string;
  workerId: string;
  modelId: string;
  dataSet: string;
  activityTable: string;
  activityState: 'waiting' | 'closed';
  activityRecordTimestamp: Date;
  trainingTable: string;
  trainingState: 'na' | 'waiting' | 'closed';
  trainingRecordTimestamp: Date;
  labeledTable: string;
  labeledTableState: 'na' | 'waiting' | 'closed';
  outputTable: 'output';
  outputTableState: 'na' | 'waiting' | 'closed';
  notes: string;
  youtubeLink?: string;
}
