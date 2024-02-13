import {Component, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE} from "@angular/material/core";
import {MAT_MOMENT_DATE_ADAPTER_OPTIONS, MomentDateAdapter} from "@angular/material-moment-adapter";
import {EUROPEAN_DATE_FORMATS} from "../../common/utils/date-utils";
import HeatmapLayerOptions = google.maps.visualization.HeatmapLayerOptions;
import {AuthService} from "../../services/auth.service";
import {FirestoreService} from "../../services/firestore.service";
import {Router} from "@angular/router";
import {ClientInContextService} from "../../services/client-in-context.service";
import * as moment from "moment";
import {Subscription} from "rxjs";
import firebase from 'firebase/compat/app';
import GeoPoint = firebase.firestore.GeoPoint;
import {MapType} from "@angular/compiler";
import {MapInfoWindow, MapMarker} from "@angular/google-maps";
import {GoogleMap} from '@angular/google-maps';

@Component({
  selector: 'app-client-observations',
  templateUrl: './client-observations.component.html',
  styleUrls: ['./client-observations.component.scss'],
  providers: [
    {
      provide: DateAdapter,
      useClass: MomentDateAdapter,
      deps: [MAT_DATE_LOCALE, MAT_MOMENT_DATE_ADAPTER_OPTIONS],
    },
    {provide: MAT_DATE_FORMATS, useValue: EUROPEAN_DATE_FORMATS}
  ]
})
export class ClientObservationsComponent implements OnInit, OnDestroy {
  @ViewChild(MapInfoWindow, {static: false}) infoWindow: MapInfoWindow;
  mapLoaded = false;
  @ViewChild(GoogleMap, {static: false}) map: GoogleMap;
  markerOptions = {draggable: false};
  center: google.maps.LatLngLiteral;

  markerPositions: google.maps.LatLngLiteral[] = [];
  zoom = 20;
  display?: google.maps.LatLngLiteral;
  drawingManager: google.maps.drawing.DrawingManager;

  dateToday: Date = new Date();

  markerClustererImagePath =
    'https://developers.google.com/maps/documentation/javascript/examples/markerclusterer/m';

  MapTypeStyle = google.maps.MapTypeId.SATELLITE;
  clientInContextServiceSubscription: Subscription;
  selectedClientDocData: any;
  selectedDate: Date;
  dateInContextSubscription: Subscription;
  growthDataSubscription: Subscription;
  private infowindow: google.maps.InfoWindow;
  observationsList: any[];
  observationsDataSubscription: Subscription;

  constructor(private authService: AuthService,
              private firestoreService: FirestoreService,
              private router: Router,
              private clientInContextService: ClientInContextService) {
    this.dateInContextSubscription = this.clientInContextService.dateInContextSubject
      .subscribe(dateInContext => {
        if (!dateInContext) {
          const dateNow = new Date();
          this.selectedDate = dateNow;
          this.clientInContextService.dateInContextSubject.next(dateNow);
        } else {
          this.selectedDate = dateInContext;
        }

        this.clientInContextServiceSubscription = this.clientInContextService.clientInContextSubject.subscribe(selectedClientDocData => {
          if (!selectedClientDocData) {
            return;
          }
          this.selectedClientDocData = selectedClientDocData;
          const dateToQuery = moment(this.selectedDate).format('YYYY-MM-DD');
          this.observationsList = [];
          this.observationsDataSubscription = this.firestoreService.getObservationsData(this.selectedClientDocData.id, dateToQuery)
            .subscribe(observations => {
              this.observationsList = [];
              this.markerPositions = [];
              if (!observations || (observations.length === 0)) {
                return;
              }
              this.observationsList = observations;
              this.center = {lat: this.observationsList[0].geopoint._lat, lng: this.observationsList[0].geopoint._long};
              this.observationsList.map(observation => {
                this.markerPositions.push({lat: observation.geopoint._lat, lng: observation.geopoint._long});
              })
            });
        });
      });
  }

  ngOnDestroy(): void {
    this.clientInContextServiceSubscription.unsubscribe();
    this.dateInContextSubscription?.unsubscribe();
    this.growthDataSubscription?.unsubscribe();
    this.observationsDataSubscription?.unsubscribe();
  }

  ngOnInit(): void {
  }

  addMarker(event: google.maps.MapMouseEvent) {
    //this.markers.push(event.latLng.toJSON()); //TODO --delete before final version
  }

  onDateChange() {
    this.clientInContextService.dateInContextSubject.next(this.selectedDate);
  }

  decrementDate() {
    this.selectedDate = moment(this.selectedDate).subtract(1, 'day').toDate();
    this.clientInContextService.dateInContextSubject.next(this.selectedDate);
  }

  decrementMonth() {
    this.selectedDate = moment(this.selectedDate).subtract(1, 'month').toDate();
    this.clientInContextService.dateInContextSubject.next(this.selectedDate);
  }

  incrementDate() {
    this.selectedDate = moment(this.selectedDate).add(1, 'day').toDate();
    this.clientInContextService.dateInContextSubject.next(this.selectedDate);
  }

  incrementMonth() {
    this.selectedDate = moment(this.selectedDate).add(1, 'month').toDate();
    this.clientInContextService.dateInContextSubject.next(this.selectedDate);
  }

  futureFilter = (d: Date | null): boolean => {
    return d <= this.dateToday;
  };

  getLabel(markerPosition) {
    return new google.maps.Marker({label: {text: "a", color: "white"}}).getLabel();
  }

  openInfoWindow(marker: MapMarker) {
    this.infowindow = new google.maps.InfoWindow({
      //minWidth: 200,
      //content: `<div style="min-width:10rem !important;">bbbb</div>`
    });
    /*this.infowindow.setContent('cccccccccc');
    this.infowindow.setOptions({
      minWidth: 300
    })*/
    this.infoWindow.open(marker); //TODO -- start from here
  }

  getInfoWindowForMarker(index: number){
    return `<strong>${this.observationsList[index].label ?? 'n/a'}</strong>`;
}

}
