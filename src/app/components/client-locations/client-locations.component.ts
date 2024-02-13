import {
	Component,
	OnDestroy,
	OnInit,
	ViewChild,
} from '@angular/core';
import {MatButtonModule} from '@angular/material/button';
import {MatSort} from '@angular/material/sort';
import {MatDialog, MatDialogConfig} from '@angular/material/dialog';
import {MatTooltipModule, TooltipPosition} from '@angular/material/tooltip';
import {
	MatSnackBar,
	MatSnackBarHorizontalPosition,
	MatSnackBarVerticalPosition,
} from '@angular/material/snack-bar';
import {
	DeviceMainAttributes,
	DeviceRemainingAttributes,
} from '../../common/interfaces/device-interfaces';
import {FirestoreService} from '../../services/firestore.service';
import {MatPaginator} from '@angular/material/paginator';
import {MatTableDataSource} from '@angular/material/table';
import {
	animate,
	state,
	style,
	transition,
	trigger,
} from '@angular/animations';
import {Subscription} from 'rxjs';
import {AuthService} from '../../services/auth.service';
import {ActivatedRoute} from '@angular/router';
import {DatePipe} from '@angular/common';
import firebase from 'firebase/compat/app';
import {Timestamp} from 'firebase/firestore';
import {CreateLocationDialogComponent} from "./create-location-dialog/create-location-dialog.component";
import {CreateLayoutDialogComponent} from "./client-location-layout/create-layout-dialog/create-layout-dialog.component";
import {ClientInContextService} from "../../services/client-in-context.service";
import {EditLocationDialogComponent} from "./edit-location-dialog/edit-location-dialog.component";

@Component({
	selector: 'app-client-locations',
	templateUrl: './client-locations.component.html',
	styleUrls: ['./client-locations.component.scss',
		'../../common/styles/listing.scss'],
	animations: [
		trigger('detailExpand', [
			state('collapsed', style({height: '0px', minHeight: '0'})),
			state('expanded', style({height: '*'})),
			transition(
				'expanded <=> collapsed',
				animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')
			)
		])
	]
})
export class ClientLocationsComponent implements OnInit, OnDestroy {

	datePipe = new DatePipe('en-US');

	deviceAttributesReadableMap: Map<string, string> = new Map([
		['id', 'ID'],
		['name', 'Name'],
		['workerName', 'Worker'],
		['activityName', 'Activity'],
		['state', 'State'],
	]);

	deviceRemainingAttributesReadableMap: Map<string, string> = new Map([
		['id', 'Device ID'],
		['workerId', 'Worker ID'],
		['activityId', 'Activity ID'],
		['creationTimestamp', 'Creation Timestamp'],
		['trainingMode', 'Training Mode'],
		['notes', 'Notes'],
		['clientName', 'Client'],
	]);
	columnsToDisplay: string[] = [
		// 'id',
		'name',
		'workerName',
		'activityName',
		'state',
	];
	columnsHeadersToDisplay: string[] = [
		// 'id',
		'name',
		'workerName',
		'activityName',
		'state',
		'edit',
	];
	dateColumns: string[] = [
		'creationTimestamp',
		'activityRecordTimestamp',
		'trainingRecordTimestamp',
	];
	dataSource: MatTableDataSource<DeviceMainAttributes>;
	expandedElement: DeviceRemainingAttributes | null;

	@ViewChild(MatPaginator) paginator: MatPaginator;
	@ViewChild(MatSort) sort: MatSort;
	public locationList: any[];
	loggedInUserFromAuthServiceSubscription: Subscription;
	clientInContextServiceSubscription: Subscription;
	selectedClientDocData: any;
	private locationListSubscription: Subscription;

	constructor(
		public firestoreService: FirestoreService,
		private dialog: MatDialog,
		public authService: AuthService,
		public route: ActivatedRoute,
		private snackBar: MatSnackBar,
		private clientInContextService: ClientInContextService
	) {
		this.clientInContextServiceSubscription = this.clientInContextService.clientInContextSubject.subscribe(selectedClientDocData => {
			if(!selectedClientDocData){
				return;
			}
			this.selectedClientDocData = selectedClientDocData;

			this.locationListSubscription = this.firestoreService
				.getAllLocationsForClientId(selectedClientDocData.id)
				.subscribe((locationsList) => {
					this.locationList = locationsList.map((location) => {
						const remainingAttributesList: any[] = [];
						for (const [key, value] of Object.entries(location)) {
							if (this.dateColumns.includes(key)) {
								const timeValue = value as Timestamp;
								location[key] = this.datePipe.transform(
									timeValue.toMillis(),
									'yyyy-MM-dd HH:mm'
								);
							}
							if (
								!this.columnsToDisplay.includes(key) &&
								![
									'activationKey',
									'trainingKey',
									'clientId',
									'workerId',
									'activityId',
								].includes(key)
							) {
								remainingAttributesList.push([
									this.deviceRemainingAttributesReadableMap.get(key),
									location[key],
								]);
							}
						}
						remainingAttributesList.sort((n1, n2) =>
							n1 > n2 ? 1 : n1 < n2 ? -1 : 0
						);
						return {
							...location,
							remainingAttributesList,
						};
					});

					this.dataSource = new MatTableDataSource(this.locationList);
					this.dataSource.paginator = this.paginator;
					this.dataSource.sort = this.sort;
				});
		});
	}

	ngOnInit() {

	}

	ngOnDestroy(): void {
		this.clientInContextServiceSubscription?.unsubscribe();
		this.locationListSubscription?.unsubscribe();
	}

	openSnackBar(message) {
		this.snackBar.open(message, '', {
			duration: 5000,
			horizontalPosition: 'center',
			verticalPosition: 'bottom',
		});
	}

	async saveNewLocationName($event, location) {
		$event?.stopPropagation();
		$event?.preventDefault();
		if (!location.name) {
			return;
		}
		await this.firestoreService.updateLocByIdForClientId(this.selectedClientDocData.id, location.id, {name: location.name ? location.name : null});
	}

	openDialog() {
		const dialogConfig = new MatDialogConfig();
		dialogConfig.autoFocus = true;
		dialogConfig.data = {};
		this.dialog.open(CreateLocationDialogComponent, dialogConfig);
	}

	/*deleteLocation($event, location) {
		$event.stopPropagation();
	}*/

	openCreateLayoutDialog($event, location) {
		$event.stopPropagation();
		const dialogConfig = new MatDialogConfig();
		dialogConfig.autoFocus = true;
		dialogConfig.data = {
			clientId: this.selectedClientDocData.id,
			locationId: location.id,
			locationName: location.name
		};
		this.dialog.open(CreateLayoutDialogComponent, dialogConfig);
	}

	openEditLocationDialog($event, location) {
		$event.stopPropagation();
		const dialogConfig = new MatDialogConfig();
		dialogConfig.autoFocus = true;
		dialogConfig.data = {
			clientId: this.selectedClientDocData.id,
			location
		};
		this.dialog.open(EditLocationDialogComponent, dialogConfig);
	}

	preventPropagation($event) {
		$event.stopPropagation();
	}


}
