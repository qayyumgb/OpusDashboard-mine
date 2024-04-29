import {Injectable} from '@angular/core';
import {AngularFirestore, DocumentData} from '@angular/fire/compat/firestore';
import {AngularFireFunctions} from '@angular/fire/compat/functions';
import {AuthService} from './auth.service';
import {Observable, of} from 'rxjs';
import {catchError, first, map} from 'rxjs/operators';
import {HttpClient} from '@angular/common/http';
import {environment} from '../../environments/environment';
import firebase from 'firebase/compat/app';
import {Timestamp} from 'firebase/firestore'
//import { Timestamp } from "@firebase/firestore"
import * as moment from "moment";
import {TIME_ZONE} from '../common/utils/time-utils';

@Injectable({
  providedIn: 'root',
})
export class FirestoreService {
  constructor(
    private afs: AngularFirestore,
    private angularFireFunctions: AngularFireFunctions,
    private authService: AuthService,
    public http: HttpClient
  ) {
  }

  // CLIENTS
  getAllClients(): Observable<any> {
    return this.afs.collection('clients').valueChanges({idField: 'id'});
  }

  getClientById(clientId: string): Observable<any> {
    return this.afs.collection('clients').doc(clientId).valueChanges({idField: 'id'});
  }

  getLocationByIdForClientId(locationId: string, clientId: string): Promise<any> {
    return this.afs.collection('clients').doc(clientId).collection('locations').doc(locationId).ref.get();
  }

  getLayoutByIdForLocIdClientId(layoutId: string, locationId: string, clientId: string): Promise<any> {
    return this.afs.collection('clients').doc(clientId).collection('locations').doc(locationId).collection('layout').doc(layoutId).ref.get();
  }

  // DEVICES
  getAllDevices(): Observable<any> {
    return this.afs.collection('devices').valueChanges({idField: 'id'});
  }

  getAllDevicesForClientId(clientId: string): Observable<any> {
    return this.afs
      .collection('devices', (ref) => ref.where('clientId', '==', clientId))
      .valueChanges({idField: 'id'});
  }

  getUnArchivedDevicesForClientId(clientId: string): Observable<any> {
    return this.afs
      .collection('devices', (ref) => ref
        .where('clientId', '==', clientId)
        .where('isArchived', '==', false))
      .valueChanges({idField: 'id'});
  }

  getArchivedDevicesForClientId(clientId: string): Observable<any> {
    return this.afs
      .collection('devices', (ref) => ref
        .where('clientId', '==', clientId)
        .where('isArchived', '==', true))
      .valueChanges({idField: 'id'});
  }

  updateDevice(device, isActivated): Promise<any> {

    const updateObject: any = {
      notes: device.notes,
      deviceNumber: device.deviceNumber ?? null
    };

    if (isActivated) {
      updateObject.deviceActivatedAt = new Date();
    } else {
      updateObject.locationId = device.locationId;
      updateObject.locationName = device.locationName;
      updateObject.enableGPS = device.enableGPS;
      updateObject.enableAutoTouchLock = device.enableAutoTouchLock;
      updateObject.enableOutOfRange = device.enableOutOfRange;
      updateObject.enableTrainingMode = device.enableTrainingMode;
      updateObject.enableVoiceAssistance = device.enableVoiceAssistance;
      updateObject.appModes = device.appModes;
      updateObject.appModeIds = device.appModeIds;
    }
    return this.afs.collection('devices').doc(device.id).update(updateObject);
  }

  updateDevices(deviceIds, deviceUpdate): Observable<any> {
    const callable = this.angularFireFunctions.httpsCallable('bulkUpdateDevices');
    return callable({
      secret: 'orangeswereneverapples',
      deviceIds,
      settings: deviceUpdate
    });

  }

  updateIssueForDevice(deviceId, hasIssue): Promise<any> {
    return this.afs.collection('devices').doc(deviceId).update({hasIssue});
  }

  archiveDeviceById(deviceId): Promise<any> {
    return this.afs.collection('devices').doc(deviceId).update({
      isArchived: true,
      archivedAt: Timestamp.now()
    });
  }

  unArchiveDeviceById(deviceId): Promise<any> {
    return this.afs.collection('devices').doc(deviceId).update({
      isArchived: false,
      restoredAt: Timestamp.now()
    });
  }

  archiveRegistrationByIdForClientId(registrationId: string, clientId: string): Promise<any> {
    return this.afs.collection('clients').doc(clientId).collection('registrations').doc(registrationId).update({
      isArchived: true,
      archivedAt: Timestamp.now()
    });
  }

  archiveRegnBelowPresenceByIdForClientId(registrationId: string, clientId: string, presenceId: string): Promise<any> {
    return this.afs.collection('clients').doc(clientId)
      .collection('presences').doc(presenceId)
      .collection('registrations').doc(registrationId)
      .update({
        isArchived: true,
        archivedAt: Timestamp.now()
      });
  }

  unArchiveRegistrationByIdForClientId(registrationId: string, clientId: string): Promise<any> {
    return this.afs.collection('clients').doc(clientId).collection('registrations').doc(registrationId).update({
      isArchived: false,
      restoredAt: Timestamp.now()
    });
  }

  unArchiveRegnBelowPresenceByIdForClientId(registrationId: string, clientId: string, presenceId: string): Promise<any> {
    return this.afs.collection('clients').doc(clientId)
      .collection('presences').doc(presenceId)
      .collection('registrations').doc(registrationId)
      .update({
        isArchived: false,
        restoredAt: Timestamp.now()
      });
  }

  updateWorkerForDevice(device): Promise<any> {
    const updateObject: any = {
      workerId: device.workerId,
      workerName: device.workerName,
    };
    return this.afs.collection('devices').doc(device.id).update(updateObject);
  }

  updateLytByIdForLocationIdClientId(clientId, locationId, layoutId, attribsToUpdate): Promise<any> {
    return this.afs
      .collection('clients')
      .doc(clientId)
      .collection('locations')
      .doc(locationId)
      .collection('layout')
      .doc(layoutId)
      .update(attribsToUpdate);
  }

  updateLocByIdForClientId(clientId, locationId, attribsToUpdate): Promise<any> {
    return this.afs
      .collection('clients')
      .doc(clientId)
      .collection('locations')
      .doc(locationId)
      .update(attribsToUpdate);
  }

  // WORKERS - note not refactoring below worker design to below client to check if the module dev-workers is used somewhere
  getAllWorkers(): Observable<any> {
    return this.afs.collection('workers', (ref) =>
      ref.where('isArchived', '==', false)
    ).valueChanges({idField: 'id'});
  }

  getAllWorkersForClientId(clientId: string): Observable<any> {
    return this.afs.collection('clients').doc(clientId)
      .collection('workers')
      .valueChanges({idField: 'id'});
  }

  getUnArchivedWorkersForClientId(clientId: string, locationId = null): Observable<any> {
    if (!locationId) {
      return this.afs.collection('clients').doc(clientId)
        .collection('workers', (ref) => ref
          .where('isArchived', '==', false)
        )
        .valueChanges({idField: 'id'});
    } else {
      return this.afs.collection('clients').doc(clientId)
        .collection('workers', (ref) => ref
          .where('locationIds', 'array-contains', locationId).where('isArchived', '==', false)
        )
        .valueChanges({idField: 'id'});
    }
  }

  getArchivedWorkersForClientId(clientId: string): Observable<any> {
    return this.afs.collection('clients').doc(clientId)
      .collection('workers', (ref) => ref
        .where('isArchived', '==', true)
      )
      .valueChanges({idField: 'id'});
  }

  createWorkerForClientId(worker: any, clientId: string): Promise<any> {
    worker.creationTimestamp = new Date();
    return this.afs.collection('clients').doc(clientId)
      .collection('workers').add(worker);
  }

  createLocationClientId(clientId: string, location: any): Promise<any> {
    location.creationTimestamp = new Date();
    return this.afs
      .collection('clients')
      .doc(clientId)
      .collection('locations')
      .add(location);
  }


  createLayoutForLocationIdClientId(clientId, locationId, layout): Promise<any> {
    layout.creationTimestamp = new Date();
    return this.afs
      .collection('clients')
      .doc(clientId)
      .collection('locations')
      .doc(locationId)
      .collection('layout')
      .add(layout);
  }

  updateLayoutForLocationIdClientId(clientId, locationId, layoutId, attribsToUpdate): Promise<any> {
    return this.afs
      .collection('clients')
      .doc(clientId)
      .collection('locations')
      .doc(locationId)
      .collection('layout')
      .doc(layoutId)
      .update(attribsToUpdate);
  }

  // TRAININGS
  getAllTrainings(clientIds?): Observable<any> {
    return this.afs
      .collection('trainings', (ref) =>
        ref.where('clientId', 'in', clientIds)
          .orderBy('creationTimestamp', 'desc')
      )
      .valueChanges({idField: 'id'});
  }

  getAllArchivedTrainings(clientIds?): Observable<any> {
    return this.afs
      .collection('trainings', (ref) =>
        ref.where('isArchived', '==', true)
          .where('clientId', 'in', clientIds)
          .orderBy('creationTimestamp', 'desc')
      )
      .valueChanges({idField: 'id'});
  }

  getUnArchivedTrainings(clientIds?): Observable<any> {
    return this.afs
      .collection('trainings', (ref) =>
        ref.where('isArchived', '==', false)
          .where('clientId', 'in', clientIds)
          .orderBy('creationTimestamp', 'desc')
      )
      .valueChanges({idField: 'id'});
  }

  getTrainingById(id): Observable<any> {
    return this.afs.collection('trainings').doc(id).valueChanges({idField: 'id'});
  }

  getAllTrainingsForClientId(clientId: string): Observable<any> {
    return this.afs
      .collection('trainings', (ref) =>
        ref
          .where('activityType', '==', 'training')
          .where('clientId', '==', clientId)
          .orderBy('creationTimestamp', 'desc')
      )
      .valueChanges({idField: 'id'});
  }

  updateTraining(training): Promise<any> {
    const updateObject: any = {
      notes: training.notes,
      youtubeLink: training.youtubeLink,
    };
    return this.afs
      .collection('trainings')
      .doc(training.id)
      .update(updateObject);
  }

  archiveUnarchiveTraining(trainingId: string, isArchived: boolean): Promise<any> {
    const updateObject: any = {
      isArchived
    };
    return this.afs
      .collection('trainings')
      .doc(trainingId)
      .update(updateObject);
  }

  partiallyUpdateTraining(updateObject): Promise<any> {
    return this.afs
      .collection('trainings')
      .doc(updateObject.id)
      .update(updateObject);
  }

  saveAnnotationForTraining(trainingId: string, annotationObject): Promise<any> {
    return this.afs
      .collection('trainings')
      .doc(trainingId)
      .collection('annotations')
      .add(annotationObject);
  }

  getAllAnnotationsForTrainingId(trainingId: string): Observable<any> {
    return this.afs.collection('trainings').doc(trainingId).collection('annotations', (ref) =>
      ref.orderBy('videoTime', 'desc')
    ).valueChanges({idField: 'id'});
  }

  async deleteAnnotationsForTrainingId(trainingId: string, annotationIds: string[]): Promise<any> {
    const batch = this.afs.firestore.batch();
    for (const annotationId of annotationIds) {
      batch.delete(this.afs.collection('trainings').doc(trainingId).collection('annotations').doc(annotationId).ref);
    }
    await batch.commit();
  }

  // MODELS
  getAllModels(): Observable<any> {
    return this.afs.collection('models').valueChanges({idField: 'id'});
  }

  updateWorkerForClientId(worker, clientId): Promise<any> {
    return this.afs.collection('clients').doc(clientId)
      .collection('workers').doc(worker.id).update({
        name: worker.name,
        workerCode: worker.workerCode ?? null,
        hourlyRate: worker.hourlyRate ?? null,
        notes: worker.notes,
        locationIds: worker.locationIds,
        isLeftHanded: worker.isLeftHanded,
        workerGroupId: worker.workerGroupId,
        workerGroupName: worker.workerGroupName
      });
  }

  async restoreSessionFromVersionBackup(sessionId: string, clientId: string, backupDocId: string, loggedInUser: any) {
    this.afs.collection('clients').doc(clientId).collection('sessions').doc(sessionId).collection('versions').doc(backupDocId).get()
      .subscribe(async (originalSessionVersionDS) => {
        const originalSessionDD = originalSessionVersionDS.data();
        await this.afs.collection('clients').doc(clientId).collection('sessions').doc(sessionId).update({
          ...originalSessionDD,
          isOriginal: true,
          revertedVersionAt: new Date(),
          backupDocId: null,
          backupVersionCreationTimestamp: null,
          revertedByUserId: loggedInUser?.id ?? null,
          revertedByUserName: loggedInUser?.name ?? null,
          updatedTimestamp: firebase.firestore.FieldValue.serverTimestamp()
        });
        await this.afs.collection('clients').doc(clientId).collection('sessions').doc(sessionId).collection('states').doc('ml').set({
          updatedTimestamp: firebase.firestore.FieldValue.serverTimestamp()
        }, {merge: true});
        await this.afs.collection('clients').doc(clientId).collection('sessions').doc(sessionId).collection('versions').doc(backupDocId).delete();
      });
  }

  createSessionForClientId(session: any, clientId: string): Promise<any> {
    return this.afs.collection('clients').doc(clientId)
      .collection('sessions').add(session);
  }

  async createOriginalVersionCopyOfSession(sessionId: string, clientId: string, originalSession: any): Promise<string | null> {
    try {
      const newVersionDocRef = await this.afs.collection('clients').doc(clientId).collection('sessions').doc(sessionId).collection('versions').add({
        ...originalSession,
        backupVersionCreationTimestamp: new Date()
      });
      return newVersionDocRef.id;
    } catch (error) {
      console.log(JSON.stringify(error));
    }
  }

  async updateSessionForClientId(session: any, clientId: string, toUpdateTimestamp: boolean): Promise<any> {
    session.updatedTimestamp = firebase.firestore.FieldValue.serverTimestamp();
    if (toUpdateTimestamp) {
      await this.afs.collection('clients').doc(clientId)
        .collection('sessions').doc(session.id).collection('states').doc('ml').set({
          updatedTimestamp: firebase.firestore.FieldValue.serverTimestamp()
        }, {merge: true});
    }
    return this.afs.collection('clients').doc(clientId)
      .collection('sessions').doc(session.id).update(session);
  }

  archiveWorkerByIdForClientId(workerId: string, clientId: string): Promise<any> {
    return this.afs.collection('clients').doc(clientId)
      .collection('workers').doc(workerId).update({
        isArchived: true,
        archivedAt: Timestamp.now()
      });
  }

  unArchiveWorkerByIdForClientId(workerId: string, clientId: string): Promise<any> {
    return this.afs.collection('clients').doc(clientId)
      .collection('workers').doc(workerId).update({
        isArchived: false,
        restoredAt: Timestamp.now()
      });
  }

  createWorkerGroupForClientId(workerGroup, clientId): Promise<any> {
    workerGroup.creationTimestamp = new Date();
    workerGroup.isArchived = false;
    return this.afs.collection('clients').doc(clientId).collection('workerGroups').add(workerGroup);
  }

  updateWorkerGroupByIdForClientId(workerGroupId: string, clientId: string, updateObject: any): Promise<any> {
    updateObject.updatedTimestamp = new Date();
    return this.afs.collection('clients').doc(clientId).collection('workerGroups').doc(workerGroupId).update(updateObject);
  }

  getAllUnarchivedWorkerGroupsForClientId(clientId: string): Observable<any> {
    return this.afs.collection('clients').doc(clientId)
      .collection('workerGroups', (ref) =>
        ref.where('isArchived', '==', false)
      ).valueChanges({idField: 'id'});
  }

  getAllArchivedWorkerGroupsForClientId(clientId: string): Observable<any> {
    return this.afs.collection('clients').doc(clientId)
      .collection('workerGroups', (ref) =>
        ref.where('isArchived', '==', true)
      ).valueChanges({idField: 'id'});
  }

  validateKey(activationKey, clientId, token): Observable<any> {
    const headers = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: 'Bearer ' + token,
      responseType: 'text'
    };
    // create user collection using the auth token
    return this.http.post<any>(`${environment.functionsBase}/training/web/validateKeyDevice`, {
      key: activationKey,
      clientId
    }, {
      headers,
      responseType: 'json'
    });
  }

  getAllActivities(): Observable<any> {
    return this.afs.collection('activities').valueChanges({idField: 'id'});
  }

  getAllAppModes(): Observable<any> {
    return this.afs.collection('appModes').valueChanges({idField: 'id'});
  }

  getAllLocationsForClientId(clientId): Observable<any> {
    return this.afs.collection('clients').doc(clientId).collection('locations').valueChanges({idField: 'id'});
  }

  getAllLayoutsForLocIdForClientId(locationId, clientId): Observable<any> {
    return this.afs
      .collection('clients')
      .doc(clientId)
      .collection('locations')
      .doc(locationId)
      .collection('layout')
      .valueChanges({idField: 'id'});
  }

  getAllRowsForLytLocClientId(layoutId, locationId, clientId): Observable<any> {
    return this.afs
      .collection('clients')
      .doc(clientId)
      .collection('locations')
      .doc(locationId)
      .collection('layout')
      .doc(layoutId)
      .collection('rows')
      .get();
  }

  getAllRowsForLytLocClientIdObs(layoutId, locationId, clientId): Observable<any> {
    return this.afs
      .collection('clients')
      .doc(clientId)
      .collection('locations')
      .doc(locationId)
      .collection('layout')
      .doc(layoutId)
      .collection('rows')
      .valueChanges({idField: 'id'});
  }

  getAllRowsForClientId(clientId): Observable<any> {
    return this.afs
      .collectionGroup('rows', (ref) =>
        ref.where('clientId', '==', clientId).orderBy('rowNumber', 'asc')
      ).valueChanges({idField: 'id'});
  }

  getAllRowsForLocIdForClientId(clientId: string, locationId: string): Observable<any> {
    return this.afs
      .collectionGroup('rows', (ref) =>
        ref
          .where('clientId', '==', clientId)
          .where('locationId', '==', locationId)
          .orderBy('rowNumber', 'asc')
      ).valueChanges({idField: 'id'});
  }

  createRowForLytLocClientId(layoutId, locationId, clientId, rowData): Promise<any> {
    const newRowId = this.afs.createId();
    rowData.id = newRowId;
    rowData.clientId = clientId;
    rowData.locationId = locationId;
    rowData.layoutId = layoutId;
    rowData.added = new Date();
    rowData.isArchived = false;
    return this.afs
      .collection('clients')
      .doc(clientId)
      .collection('locations')
      .doc(locationId)
      .collection('layout')
      .doc(layoutId)
      .collection('rows')
      .doc(newRowId)
      .set(rowData);
  }

  updateRowForLytLocClientId(layoutId, locationId, clientId, rowData): Promise<any> {
    const rowId = rowData.id;
    const rowToSave = {
      ...rowData
    }
    delete rowToSave.id; //id does not need to be saved
    return this.afs
      .collection('clients')
      .doc(clientId)
      .collection('locations')
      .doc(locationId)
      .collection('layout')
      .doc(layoutId)
      .collection('rows')
      .doc(rowId)
      .update(rowData);
  }

  deleteRowForLytLocClientId(layoutId, locationId, clientId, rowId): Promise<any> {
    return this.afs
      .collection('clients')
      .doc(clientId)
      .collection('locations')
      .doc(locationId)
      .collection('layout')
      .doc(layoutId)
      .collection('rows')
      .doc(rowId)
      .delete();
  }

  getObservationsData(clientId, todayStr): Observable<any> {
    return this.afs
      .collection('clients')
      .doc(clientId)
      .collection('observations', (ref) =>
        ref.where('dateStr', '==', todayStr)
      ).valueChanges({idField: 'id'});
  }

  //This method is no longer used - instead archived & unarchived sessions fetching methods are used. Retained for any future use purposes
  getSessionsData(clientId, dateToQuery): Observable<any> {
    const fromMoment = Timestamp.fromDate(moment(dateToQuery).startOf('day').toDate());
    const toMoment = Timestamp.fromDate(moment(dateToQuery).endOf('day').toDate());
    return this.afs
      .collection('clients')
      .doc(clientId)
      .collection('sessions', (ref) =>
        ref.where('startTimestamp', '>=', fromMoment).where('startTimestamp', '<=', toMoment)
      ).valueChanges({idField: 'id'});
  }

  getArchivedSessions(clientId, dateToQuery): Observable<any> {
    const fromMoment = Timestamp.fromDate(moment(dateToQuery).startOf('day').toDate());
    const toMoment = Timestamp.fromDate(moment(dateToQuery).endOf('day').toDate());
    return this.afs
      .collection('clients')
      .doc(clientId)
      .collection('sessions', (ref) =>
        ref.where('startTimestamp', '>=', fromMoment).where('startTimestamp', '<=', toMoment).where('isArchived', '==', true)
      ).valueChanges({idField: 'id'});
  }

  getUnarchivedSessions(clientId, dateToQuery, locationId = null): Observable<any> {
    const fromMoment = Timestamp.fromDate(moment(dateToQuery).startOf('day').toDate());
    const toMoment = Timestamp.fromDate(moment(dateToQuery).endOf('day').toDate());
    if (!locationId) {
      return this.afs
        .collection('clients')
        .doc(clientId)
        .collection('sessions', (ref) =>
          ref.where('startTimestamp', '>=', fromMoment).where('startTimestamp', '<=', toMoment)
            .where('isArchived', '==', false)
        ).valueChanges({idField: 'id'});
    } else {
      return this.afs
        .collection('clients')
        .doc(clientId)
        .collection('sessions', (ref) =>
          ref.where('startTimestamp', '>=', fromMoment).where('startTimestamp', '<=', toMoment)
            .where('locationId', '==', locationId).where('isArchived', '==', false)
        ).valueChanges({idField: 'id'});
    }
  }

  getSessionByIdForClientId(sessionId, clientId): Observable<DocumentData> {
    return this.afs.collection('clients').doc(clientId).collection('sessions').doc(sessionId).get();
  }

  archiveSessionByIdForClientId(sessionId: string, clientId: string): Promise<any> {
    return this.afs.collection('clients').doc(clientId).collection('sessions').doc(sessionId).update({
      isArchived: true,
      archivedAt: Timestamp.now()
    });
  }

  unArchiveSessionByIdForClientId(sessionId: string, clientId: string): Promise<any> {
    return this.afs.collection('clients').doc(clientId).collection('sessions').doc(sessionId).update({
      isArchived: false,
      restoredAt: Timestamp.now()
    });
  }


  createUserForClientId(user, client): Observable<any> {
    const callable = this.angularFireFunctions.httpsCallable('createUser');
    return callable({
      secret: 'orangeswereneverapples',
      user,
      client
    });
  }

  createCSVRequestForTrainingId(user, trainingId, requestType): Promise<any> {
    return this.afs
      .collection('trainingDataDownloadRequests')
      .add({
        user,
        trainingId,
        requestType,
        status: 'requested',
        requestedAt: Timestamp.now()
      });
  }

  copySessionToNewTraining(session): Promise<any> {
    console.log(JSON.stringify(session, undefined, 4));
    return this.afs
      .collection('trainings')
      .add({
        clientId: session.clientId ?? null,
        clientName: session.clientName ?? null,
        creationTimestamp: session.creationTimestamp ?? null,
        deviceId: session.deviceId ?? null,
        isArchived: false,
        isSessionCopy: true,
        sessionId: session.id ?? null,
        trainingKey: this.newKey(4),
        trainingStartTimestamp: session.startTimestamp,
        updateTimestamp: session.updatedTimestamp ?? null,
        workerId: session.workerId ?? null,
        workerName: session.workerName ?? null,
        createdFromSessionAt: new Date()
      });
  }

  newKey(length): string {
    const chars = "ACEFHJKLMNRSTUVWXY3479";
    const charsLength = chars.length;
    let result = "";
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * charsLength));
    }
    return result;
  };

  getAllTrainingDataRequests(): Observable<any> {
    return this.afs.collection('trainingDataDownloadRequests').valueChanges({idField: 'id'});
  }

  getAllTrainingDataRequestsForTrainingId(trainingId: string): Observable<any> {
    return this.afs
      .collection('trainingDataDownloadRequests', (ref) =>
        ref.where('trainingId', '==', trainingId)
      ).valueChanges({idField: 'id'});
  }

  getAllUnarchivedUsersForClientId(clientId: string): Observable<any> {
    return this.afs
      .collection('users', (ref) =>
        ref.where('clientIds', 'array-contains', clientId)
      ).valueChanges({idField: 'id'});
  }

  getAllArchivedUsersForClientId(clientId: string): Observable<any> {
    return this.afs
      .collection('users', (ref) =>
        ref.where('archivedClientIds', 'array-contains', clientId)
      ).valueChanges({idField: 'id'});
  }

  getAllUnarchivedLabelsForClientId(clientId: string): Observable<any> {
    return this.afs.collection('clients').doc(clientId)
      .collection('labels', (ref) =>
        ref.where('isArchived', '==', false)
      ).valueChanges({idField: 'id'});
  }

  getAllArchivedLabelsForClientId(clientId: string): Observable<any> {
    return this.afs.collection('clients').doc(clientId)
      .collection('labels', (ref) =>
        ref.where('isArchived', '==', true)
      ).valueChanges({idField: 'id'});
  }

  createLabelForClientId(label, clientId): Promise<any> {
    label.creationTimestamp = new Date();
    label.isArchived = false;
    return this.afs.collection('clients').doc(clientId).collection('labels').add(label);
  }

  updateLabelByIdForClientId(labelId: string, clientId: string, updateObject: any): Promise<any> {
    return this.afs.collection('clients').doc(clientId).collection('labels').doc(labelId).update(updateObject);
  }

  getAllUnarchivedPositionsForClientId(clientId: string): Observable<any> {
    return this.afs.collection('clients').doc(clientId)
      .collection('positions', (ref) =>
        ref.where('isArchived', '==', false)
      ).valueChanges({idField: 'id'});
  }

  getAllArchivedPositionsForClientId(clientId: string): Observable<any> {
    return this.afs.collection('clients').doc(clientId)
      .collection('positions', (ref) =>
        ref.where('isArchived', '==', true)
      ).valueChanges({idField: 'id'});
  }

  createPositionForClientId(position, clientId): Promise<any> {
    position.creationTimestamp = new Date();
    position.isArchived = false;
    return this.afs.collection('clients').doc(clientId).collection('positions').add(position);
  }

  updatePositionByIdForClientId(positionId: string, clientId: string, updateObject: any): Promise<any> {
    return this.afs.collection('clients').doc(clientId).collection('positions').doc(positionId).update(updateObject);
  }

  createTaskForClientId(task, clientId): Promise<any> {
    task.creationTimestamp = new Date();
    task.isArchived = false;
    return this.afs.collection('clients').doc(clientId).collection('tasks').add(task);
  }

  updateTaskByIdForClientId(taskId: string, clientId: string, updateObject: any): Promise<any> {
    updateObject.updatedTimestamp = new Date();
    return this.afs.collection('clients').doc(clientId).collection('tasks').doc(taskId).update(updateObject);
  }

  getAllUnarchivedTasksForClientId(clientId: string): Observable<any> {
    return this.afs.collection('clients').doc(clientId)
      .collection('tasks', (ref) =>
        ref.where('isArchived', '==', false)
      ).valueChanges({idField: 'id'});
  }

  getAllArchivedTasksForClientId(clientId: string): Observable<any> {
    return this.afs.collection('clients').doc(clientId)
      .collection('tasks', (ref) =>
        ref.where('isArchived', '==', true)
      ).valueChanges({idField: 'id'});
  }

  createTaskGroupForClientId(taskGroup, clientId): Promise<any> {
    taskGroup.creationTimestamp = new Date();
    taskGroup.isArchived = false;
    return this.afs.collection('clients').doc(clientId).collection('taskGroups').add(taskGroup);
  }

  updateTaskGroupByIdForClientId(taskGroupId: string, clientId: string, updateObject: any): Promise<any> {
    updateObject.updatedTimestamp = new Date();
    return this.afs.collection('clients').doc(clientId).collection('taskGroups').doc(taskGroupId).update(updateObject);
  }

  getAllUnarchivedTaskGroupsForClientId(clientId: string): Observable<any> {
    return this.afs.collection('clients').doc(clientId)
      .collection('taskGroups', (ref) =>
        ref.where('isArchived', '==', false)
      ).valueChanges({idField: 'id'});
  }

  getAllArchivedTaskGroupsForClientId(clientId: string): Observable<any> {
    return this.afs.collection('clients').doc(clientId)
      .collection('taskGroups', (ref) =>
        ref.where('isArchived', '==', true)
      ).valueChanges({idField: 'id'});
  }

  getAllUnarchivedVarietiesForClientId(clientId: string): Observable<any> {
    return this.afs.collection('clients').doc(clientId)
      .collection('varieties', (ref) =>
        ref.where('isArchived', '==', false)
      ).valueChanges({idField: 'id'});
  }

  getAllArchivedVarietiesForClientId(clientId: string): Observable<any> {
    return this.afs.collection('clients').doc(clientId)
      .collection('varieties', (ref) =>
        ref.where('isArchived', '==', true)
      ).valueChanges({idField: 'id'});
  }

  createVarietyForClientId(variety, clientId): Promise<any> {
    variety.creationTimestamp = new Date();
    variety.isArchived = false;
    return this.afs.collection('clients').doc(clientId).collection('varieties').add(variety);
  }

  updateVarietyByIdForClientId(varietyId: string, clientId: string, updateObject: any): Promise<any> {
    return this.afs.collection('clients').doc(clientId).collection('varieties').doc(varietyId).update(updateObject);
  }

  updateUserById(userId, updateObject): Promise<any> {
    return this.afs.collection('users').doc(userId).update({
      ...updateObject
    });
  }

  updateClientById(clientId, updateObject): Promise<any> {
    return this.afs.collection('clients').doc(clientId).update({
      ...updateObject
    });
  }

  updateUserByIdForClientId(userId, user, clientId): Observable<any> {
    const callable = this.angularFireFunctions.httpsCallable('updateUser');
    return callable({
      secret: 'orangeswereneverapples',
      clientId,
      uid: userId,
      user
    });

  }

  archiveUserByIdForClientId(userId, clientId): Observable<any> {
    const callable = this.angularFireFunctions.httpsCallable('archiveUser');
    return callable({
      secret: 'orangeswereneverapples',
      clientId,
      uid: userId,
    });
  }

  unarchiveUserByIdForClientId(userId, clientId): Observable<any> {
    const callable = this.angularFireFunctions.httpsCallable('unarchiveUser');
    return callable({
      secret: 'orangeswereneverapples',
      clientId,
      uid: userId,
    });
  }

  duplicateTraining(trainingId): Observable<any> {
    const callable = this.angularFireFunctions.httpsCallable('duplicateTraining');
    return callable({
      secret: 'orangeswereneverapples',
      trainingId,
    });
  }

  getAllRegistrationsForClientId(clientId: string, dateToQuery: Date): Observable<any> {
    const fromTimestamp = Timestamp.fromDate(moment(dateToQuery).startOf('day').toDate());
    const toTimestamp = Timestamp.fromDate(moment(dateToQuery).endOf('day').toDate());
    return this.afs.collection('clients').doc(clientId)
      .collection('registrations',
        (ref) => ref.where('startTimestamp', '>=', fromTimestamp).where('startTimestamp', '<=', toTimestamp))
      .valueChanges({idField: 'id'});
  }

  getPresencesForClientId(clientId: string, dateToQuery: Date, isArchived: boolean): Observable<any> {
    const fromTimestamp = Timestamp.fromDate(moment(dateToQuery)/*.tz(TIME_ZONE)*/.startOf('isoWeek').toDate()); //dateToQuery now comes in GMT from range picker
    const toTimestamp = Timestamp.fromDate(moment(dateToQuery)/*.tz(TIME_ZONE)*/.endOf('isoWeek').toDate());
    console.log('start of week:' + fromTimestamp.toDate());
    console.log('end of week:' + toTimestamp.toDate());
    return this.afs.collection('clients').doc(clientId).collection('presences',
      (ref) => ref.where('startTimestamp', '>=', fromTimestamp).where('startTimestamp', '<=', toTimestamp)
        .where('isArchived', '==', isArchived))
      .valueChanges({idField: 'id'});
  }

  getArchivedRegnsForClientId(clientId: string, dateToQuery: Date): Observable<any> {
    const fromTimestamp = Timestamp.fromDate(moment(dateToQuery).startOf('day').toDate());
    const toTimestamp = Timestamp.fromDate(moment(dateToQuery).endOf('day').toDate());
    return this.afs.collectionGroup('registrations',
      (ref) => ref.where('clientId', '==', clientId)
        .where('startTimestamp', '>=', fromTimestamp).where('startTimestamp', '<=', toTimestamp).where('isArchived', '==', true))
      .snapshotChanges().pipe(
        map(actions => {
          return actions.map(a => {
            const data = a.payload.doc.data() as any;
            const id = a.payload.doc.id;
            const grandParentCollection = a.payload.doc.ref.parent.parent.parent.id;
            let parentPresenceId = null;
            if (grandParentCollection === 'presences') {
              parentPresenceId = a.payload.doc.ref.parent.parent.id;
            }
            return {id, grandParentCollection, parentPresenceId, ...data};
          });
        })
      );
  }

  getUnarchivedRegnsForClientId(clientId: string, dateToQuery: Date): Observable<any> {
    const fromTimestamp = Timestamp.fromDate(moment(dateToQuery).startOf('day').toDate());
    const toTimestamp = Timestamp.fromDate(moment(dateToQuery).endOf('day').toDate());
    return this.afs.collectionGroup('registrations',
      (ref) => ref.where('clientId', '==', clientId)
        .where('startTimestamp', '>=', fromTimestamp).where('startTimestamp', '<=', toTimestamp).where('isArchived', '==', false))
      .snapshotChanges().pipe(
        map(actions => {
          return actions.map(a => {
            const data = a.payload.doc.data() as any;
            const id = a.payload.doc.id;
            const grandParentCollection = a.payload.doc.ref.parent.parent.parent.id;
            let parentPresenceId = null;
            if (grandParentCollection === 'presences') {
              parentPresenceId = a.payload.doc.ref.parent.parent.id;
            }
            return {id, grandParentCollection, parentPresenceId, ...data};
          });
        })
      );
  }

  updateRegnForClientId(regnData: any, clientId: string): Promise<any> {
    const regnId = regnData.id;
    regnData.updatedTimestamp = firebase.firestore.FieldValue.serverTimestamp();
    delete regnData.id; //id does not need to be saved
    return this.afs
      .collection('clients')
      .doc(clientId)
      .collection('registrations')
      .doc(regnId)
      .update(regnData);
  }

  updateRegnBelowPresenceForClientId(regnData: any, clientId: string, presenceId: string): Promise<any> {
    const regnId = regnData.id;
    regnData.updatedTimestamp = firebase.firestore.FieldValue.serverTimestamp();
    delete regnData.id; //id does not need to be saved
    return this.afs
      .collection('clients')
      .doc(clientId)
      .collection('presences')
      .doc(presenceId)
      .collection('registrations')
      .doc(regnId)
      .update(regnData);
  }

  async createOriginalVersionCopyOfRegnBelowPresence(regnId: string, clientId: string, presenceId: string, originalRegn: any): Promise<string | null> {
    try {
      const newVersionDocRef = await this.afs
        .collection('clients').doc(clientId)
        .collection('presences').doc(presenceId)
        .collection('registrations').doc(regnId)
        .collection('versions').add({
          ...originalRegn,
          backupVersionCreationTimestamp: new Date()
        });
      return newVersionDocRef.id;
    } catch (error) {
      console.log(JSON.stringify(error));
    }
  }

  async createOriginalVersionCopyOfRegn(regnId: string, clientId: string, originalRegn: any): Promise<string | null> {
    try {
      const newVersionDocRef = await this.afs
        .collection('clients').doc(clientId)
        .collection('registrations').doc(regnId)
        .collection('versions').add({
          ...originalRegn,
          backupVersionCreationTimestamp: new Date()
        });
      return newVersionDocRef.id;
    } catch (error) {
      console.log(JSON.stringify(error));
    }
  }

  async restoreRegnFromVersionBackup(regnId: string, clientId: string, backupDocId: string, loggedInUser: any) {
    this.afs
      .collection('clients').doc(clientId)
      .collection('registrations').doc(regnId)
      .collection('versions').doc(backupDocId).get()
      .subscribe(async (originalRegnVersionDS) => {
        const originalRegnDD = originalRegnVersionDS.data();
        await this.afs.collection('clients').doc(clientId).collection('registrations').doc(regnId).update({
          ...originalRegnDD,
          isOriginal: true,
          revertedVersionAt: new Date(),
          backupDocId: null,
          backupVersionCreationTimestamp: null,
          revertedByUserId: loggedInUser?.id ?? null,
          revertedByUserName: loggedInUser?.name ?? null,
          updatedTimestamp: firebase.firestore.FieldValue.serverTimestamp()
        });
        await this.afs.collection('clients').doc(clientId).collection('registrations').doc(regnId).collection('versions').doc(backupDocId).delete();
      });
  }

  async restoreRegnFromVersionBackupBelowPresence(regnId: string, clientId: string, presenceId: string, backupDocId: string, loggedInUser: any) {
    this.afs
      .collection('clients').doc(clientId)
      .collection('presences').doc(presenceId)
      .collection('registrations').doc(regnId)
      .collection('versions').doc(backupDocId).get()
      .subscribe(async (originalRegnVersionDS) => {
        const originalRegnDD = originalRegnVersionDS.data();
        await this.afs.collection('clients').doc(clientId).collection('presences').doc(presenceId).collection('registrations').doc(regnId).update({
          ...originalRegnDD,
          isOriginal: true,
          revertedVersionAt: new Date(),
          backupDocId: null,
          backupVersionCreationTimestamp: null,
          revertedByUserId: loggedInUser?.id ?? null,
          revertedByUserName: loggedInUser?.name ?? null,
          updatedTimestamp: firebase.firestore.FieldValue.serverTimestamp()
        });
        await this.afs.collection('clients').doc(clientId)
          .collection('presences').doc(presenceId).collection('registrations').doc(regnId).collection('versions').doc(backupDocId).delete();
      });
  }

  getWebAppConfig(): Observable<any> {
    return this.afs.collection('config').doc('webApp').get();
  }

  getAllLanguageElements(clientId: string): Observable<any> {
    return this.afs.collection('languages').doc('elements').collection('elements')
      .valueChanges({idField: 'id'});
  }

  updateLanguageElementById(elementId, elementUpdateObj): Promise<any> {
    elementUpdateObj.updatedTimestamp = firebase.firestore.FieldValue.serverTimestamp();
    elementUpdateObj.translations.nl.updatedTimestamp = firebase.firestore.FieldValue.serverTimestamp();
    elementUpdateObj.translations.en.updatedTimestamp = firebase.firestore.FieldValue.serverTimestamp();
    delete elementUpdateObj.id; //id does not need to be saved
    return this.afs
      .collection('languages')
      .doc('elements')
      .collection('elements')
      .doc(elementId)
      .update(elementUpdateObj);

  }

  createLanguageElement(elementCreateObj): Observable<any> {
    const callable = this.angularFireFunctions.httpsCallable('createLanguageElement');
    return callable({
      secret: 'orangeswereneverapples',
      elementCreateObj,
    });
  }

  deleteLanguageElementById(elementId): Promise<any> {
    return this.afs
      .collection('languages')
      .doc('elements')
      .collection('elements')
      .doc(elementId)
      .delete();
  }

  getLanguageJSON(languageCode): Observable<any> {
    return this.afs.collection('languages').doc(languageCode).get();
  }

  getAllUnarchivedTaskRegnsForPresence(presence: any): Observable<any> {
    return this.afs
      .collection('clients').doc(presence.clientId)
      .collection('presences').doc(presence.id)
      .collection('registrations', (ref) =>
        ref.where('isArchived', '==', false)
      ).valueChanges({idField: 'id'});
  }

  async archiveAllTaskRegnsNPresence(taskRegns: any[], presenceId: any, clientId: string): Promise<any> {
    for (const taskRegn of taskRegns) {
      if (taskRegn.id) {
        await this.afs
          .collection('clients').doc(clientId)
          .collection('presences').doc(presenceId)
          .collection('registrations').doc(taskRegn.id)
          .update({
            isArchived: true,
            updatedTimestamp: firebase.firestore.FieldValue.serverTimestamp()
          });
      }
    }
    return await this.afs
      .collection('clients').doc(clientId)
      .collection('presences').doc(presenceId)
      .update({
        isArchived: true,
        updatedTimestamp: firebase.firestore.FieldValue.serverTimestamp()
      });
  }

  async deleteRegn(regnId: string, presenceId: string, clientId: string): Promise<any> {
    return await this.afs
      .collection('clients').doc(clientId)
      .collection('presences').doc(presenceId)
      .collection('registrations').doc(regnId)
      .delete();
  }

  async createRegn(regn: any, presenceId: string, clientId: string): Promise<any> {
    regn.updatedTimestamp = firebase.firestore.FieldValue.serverTimestamp();
    return await this.afs
      .collection('clients').doc(clientId)
      .collection('presences').doc(presenceId)
      .collection('registrations').add(regn);
  }

}
