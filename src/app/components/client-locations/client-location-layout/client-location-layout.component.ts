import {Component, OnInit, Input, ElementRef, ViewChild, OnDestroy} from '@angular/core';
import {FirestoreService} from "../../../services/firestore.service";
import {MatDialog, MatDialogConfig} from "@angular/material/dialog";
import {EditLayoutDialogComponent} from "./edit-layout-dialog/edit-layout-dialog.component";
import {Subscription} from "rxjs";
import {ClientInContextService} from "../../../services/client-in-context.service";

@Component({
	selector: 'app-client-location-layout',
	templateUrl: './client-location-layout.component.html',
	styleUrls: ['./client-location-layout.component.scss']
})
export class ClientLocationLayoutComponent implements OnInit, OnDestroy {
	@Input() locationId: string;
	@Input() locationName: string;
	@Input() clientId: string;
	public layoutList: any[];
	clientInContextServiceSubscription: Subscription;
	selectedClientDocData: any;
  private allLayoutsSubscription: Subscription;

	constructor(private firestoreService: FirestoreService,
							private dialog: MatDialog,
							private clientInContextService: ClientInContextService) {
		this.clientInContextServiceSubscription = this.clientInContextService.clientInContextSubject.subscribe(selectedClientDocData => {
			if (!selectedClientDocData) {
				return;
			}
			this.selectedClientDocData = selectedClientDocData;
		});
	}


	ngOnInit(): void {
		this.allLayoutsSubscription = this.firestoreService
			.getAllLayoutsForLocIdForClientId(this.locationId, this.clientId)
			.subscribe((layoutList) => {
				this.layoutList = layoutList.map((layout) => {
					return {
						...layout,
						isLayoutNameBeingEdited: false
					};
				});
			});
	}

	async saveNewLayoutName($event, layout) {
		$event?.stopPropagation();
		if (!layout.name) {
			return;
		}
		await this.firestoreService.updateLytByIdForLocationIdClientId(this.clientId, this.locationId, layout.id, {name: layout.name ? layout.name : null});
	}

	preventPropagation($event) {
		$event.stopPropagation();
	}

	openEditLayoutDialog($event, layout){
		$event.stopPropagation();
		const dialogConfig = new MatDialogConfig();
		dialogConfig.autoFocus = true;
		dialogConfig.data = {
			clientId: this.clientId,
			locationId: this.locationId,
			locationName: this.locationName,
			layout
		};
		this.dialog.open(EditLayoutDialogComponent, dialogConfig);
	}

	ngOnDestroy(): void {
		this.clientInContextServiceSubscription?.unsubscribe();
    this.allLayoutsSubscription?.unsubscribe();
	}
}
