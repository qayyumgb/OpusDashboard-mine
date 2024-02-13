export interface DeviceMainAttributes {
	name: string;
	workerName: string;
	activityName: string;
	clientName: string;
	state: "waiting" | "active" | "idle";
}

export interface RowMainAttributes {
	id: string,
	rowReference: number,
	rowNumber: string,
  rowLength: number,
	activityId: string,
	varietyId: string,
  labelIds: string[]
}

export interface DeviceRemainingAttributes {
	id: string;
	workerId: string;
	activityId: string;
	clientId: string;
	trainingKey: string;
	creationTimestamp: Date;
	notes: string;
}
