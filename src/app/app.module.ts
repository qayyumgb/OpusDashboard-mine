import {CommonModule, NgOptimizedImage} from '@angular/common';
import {BrowserModule} from '@angular/platform-browser';
import {APP_INITIALIZER, NgModule} from '@angular/core';
import {HttpClientModule} from "@angular/common/http";
import {AppRoutingModule} from './app-routing.module';
import {AppComponent} from './app.component';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {environment} from '../environments/environment';
import {AngularFireModule} from '@angular/fire/compat';
import {AngularFirestoreModule} from '@angular/fire/compat/firestore';
import {AngularFireStorageModule} from '@angular/fire/compat/storage';
import {AngularFireAuth, AngularFireAuthModule} from '@angular/fire/compat/auth';
import {USE_EMULATOR as USE_AUTH_EMULATOR} from '@angular/fire/compat/auth';
import {USE_EMULATOR as USE_FIRESTORE_EMULATOR} from '@angular/fire/compat/firestore';
import {USE_EMULATOR as USE_FUNCTIONS_EMULATOR} from '@angular/fire/compat/functions';
import {MaterialModule} from './material.module';
import {MatTab, MatTabBody, MatTabGroup, MatTabHeader, MatTabsModule} from '@angular/material/tabs';
import {MatDividerModule} from "@angular/material/divider";
import {MatDatepickerModule} from '@angular/material/datepicker';
import {SimplebarAngularModule} from 'simplebar-angular';
import {NgxChartsModule} from "@swimlane/ngx-charts";
import {NgsContenteditableModule} from "@ng-stack/contenteditable";
import {ClipboardModule} from 'ngx-clipboard';
import { GoogleMapsModule } from '@angular/google-maps';
import {NgxMaterialTimepickerModule} from 'ngx-material-timepicker';
import {
  NgxMatDatetimePickerModule,
  NgxMatTimepickerModule,
  NgxMatNativeDateModule,
  NgxMatDateFormats, NGX_MAT_DATE_FORMATS
} from '@angular-material-components/datetime-picker';
import { NgxMatMomentModule } from '@angular-material-components/moment-adapter';
import {MatInputModule} from '@angular/material/input';
import {MatFormFieldModule} from '@angular/material/form-field';

import {
    NavComponent,
    SignInComponent,
    ActivateDeviceDialogComponent,
    CreateWorkerDialogComponent,
    EditWorkerDialogComponent,
    EditDeviceDialogComponent,
    EditTrainingDialogComponent,
    DevDashboardComponent,
    DevDeviceComponent,
    DevWorkerComponent,
    DevTrainingComponent,
    DevActivityComponent,
    DevClientComponent,
    ClientDashboardComponent,
    ClientTrainingComponent,
    ClientTrainingDashboardComponent,
    ClientDeviceComponent,
    ClientWorkerComponent
} from './components.module';
import {ClientSettingsComponent} from './components/client-settings/client-settings.component';
import {ClientProductivityDashboardComponent} from './components/client-productivity-dashboard/client-productivity-dashboard.component';
import {ClientLaborDashboardComponent} from './components/client-labor-dashboard/client-labor-dashboard.component';
import {ClientLocationsComponent} from './components/client-locations/client-locations.component';
import {ClientLocationLayoutComponent} from './components/client-locations/client-location-layout/client-location-layout.component';
import {ClientLocLytRowsComponent} from './components/client-locations/client-location-layout/client-loc-lyt-rows/client-loc-lyt-rows.component';
import {CreateLayoutDialogComponent} from './components/client-locations/client-location-layout/create-layout-dialog/create-layout-dialog.component';
import {EditLayoutDialogComponent} from './components/client-locations/client-location-layout/edit-layout-dialog/edit-layout-dialog.component';
import {CreateLocationDialogComponent} from './components/client-locations/create-location-dialog/create-location-dialog.component';
import {ClientApisComponent} from './components/client-apis/client-apis.component';
import {EditLocationDialogComponent} from './components/client-locations/edit-location-dialog/edit-location-dialog.component';
import { ConfirmationDialogComponent } from './components/utility/confirmation-dialog/confirmation-dialog.component';
import { SafeHtmlPipe } from './common/pipes/safe-html.pipe';
import { ClientUserComponent } from './components/client-user/client-user.component';
import { EditUserDialogComponent } from './components/client-user/edit-user-dialog/edit-user-dialog.component';
import { CreateUserDialogComponent } from './components/client-user/create-user-dialog/create-user-dialog.component';
import { AddAnnotationComponent } from './components/dev-training/add-annotation/add-annotation.component';
import { YouTubePlayerModule } from "@angular/youtube-player";
import { ConfirmationSnackbarComponent } from './components/utility/confirmation-snackbar/confirmation-snackbar.component';
import { ClientUserProfileComponent } from './components/client-user-profile/client-user-profile.component';
import { HelpComponent } from './components/help/help.component';
import { ClientGeneralComponent } from './components/client-general/client-general.component';
import { TrainingDataRequestsComponent } from './components/dev-training/training-data-requests/training-data-requests.component';
import { LaborPerformanceSectionComponent } from './components/client-labor-dashboard/labor-performance-section/labor-performance-section.component';
import {MatDialogModule} from "@angular/material/dialog";
import { ClientProductivityVarietySectionComponent } from './components/client-productivity-dashboard/client-productivity-variety-section/client-productivity-variety-section.component';
import {ContenteditableValueAccessorModule} from "@tinkoff/angular-contenteditable-accessor";
import { LaborOverviewSectionComponent } from './components/client-labor-dashboard/labor-overview-section/labor-overview-section.component';
import { CdkDetailRowDirective } from './components/client-labor-dashboard/labor-overview-section/cdk-detail-row.directive';
import { LaborProductivitySectionComponent } from './components/client-labor-dashboard/labor-productivity-section/labor-productivity-section.component';
import { ClientProductivityRowSectionComponent } from './components/client-productivity-dashboard/client-productivity-row-section/client-productivity-row-section.component';
import { ClientLabelsComponent } from './components/client-labels/client-labels.component';
import { CreateLabelDialogComponent } from './components/client-labels/create-label-dialog/create-label-dialog.component';
import { EditLabelDialogComponent } from './components/client-labels/edit-label-dialog/edit-label-dialog.component';
import { ClientVarietiesComponent } from './components/client-varieties/client-varieties.component';
import { CreateVarietyDialogComponent } from './components/client-varieties/create-variety-dialog/create-variety-dialog.component';
import { EditVarietyDialogComponent } from './components/client-varieties/edit-variety-dialog/edit-variety-dialog.component';
import { ClientProductivityRowmapSectionComponent } from './components/client-productivity-dashboard/client-productivity-rowmap-section/client-productivity-rowmap-section.component';
import { ClientObservationsComponent } from './components/client-observations/client-observations.component';
import { ClientPositionsComponent } from './components/client-positions/client-positions.component';
import { CreatePositionDialogComponent } from './components/client-positions/create-position-dialog/create-position-dialog.component';
import { EditPositionDialogComponent } from './components/client-positions/edit-position-dialog/edit-position-dialog.component';
import { ClientTasksComponent } from './components/client-tasks/client-tasks.component';
import { CreateTaskDialogComponent } from './components/client-tasks/create-task-dialog/create-task-dialog.component';
import { EditTaskDialogComponent } from './components/client-tasks/edit-task-dialog/edit-task-dialog.component';
import { ClientRegistrationsDashboardComponent } from './components/client-registrations-dashboard/client-registrations-dashboard.component';
import { LaborTrolleySectionComponent } from './components/client-labor-dashboard/labor-trolley-section/labor-trolley-section.component';
import { ClientSessionsDashboardComponent } from './components/client-sessions-dashboard/client-sessions-dashboard.component';
import { EditSessionDialogComponent } from './components/client-sessions-dashboard/edit-session-dialog/edit-session-dialog.component';
import {MatCardModule} from "@angular/material/card";
import { MultipleDeviceEditComponent } from './components/client-device/multiple-device-edit-dialog/multiple-device-edit.component';
import { EditRegistrationDialogComponent } from './components/client-registrations-dashboard/edit-registration-dialog/edit-registration-dialog.component';
import { ClientTaskGroupsComponent } from './components/client-task-groups/client-task-groups.component';
import { CreateTaskGroupDialogComponent } from './components/client-task-groups/create-task-group-dialog/create-task-group-dialog.component';
import { EditTaskGroupDialogComponent } from './components/client-task-groups/edit-task-group-dialog/edit-task-group-dialog.component';
import { CreateSessionDialogComponent } from './components/client-sessions-dashboard/create-session-dialog/create-session-dialog.component';
import { EnrollmentSettingsDialogComponent } from './components/client-device/enrollment-settings-dialog/enrollment-settings-dialog.component';
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";
import { MtxTooltipModule } from '@ng-matero/extensions/tooltip';
import { ClientWorkerGroupsComponent } from './components/client-worker-groups/client-worker-groups.component';
import { CreateWorkerGroupDialogComponent } from './components/client-worker-groups/create-worker-group-dialog/create-worker-group-dialog.component';
import { EditWorkerGroupDialogComponent } from './components/client-worker-groups/edit-worker-group-dialog/edit-worker-group-dialog.component';
import { ClientPresencesComponent } from './components/client-presences/client-presences.component';

export function initializeApp(afAuth: AngularFireAuth): () => Promise<null> {
    return () => {
        return new Promise((resolve) => {
            if (!environment.useEmulators) {
                return resolve(null);
            } else {
                afAuth.useEmulator(`http://${location.hostname}:9099/`).then(() => {
                    resolve(null);
                });
            }
        });
    };
}

const CUSTOM_DATE_FORMATS: NgxMatDateFormats = {
  parse: {
    dateInput: 'YYYY-MM-DD HH:mm:ss',
  },
  display: {
    dateInput: 'YYYY-MM-DD HH:mm:ss',
    monthYearLabel: 'MMM YYYY',
    dateA11yLabel: 'LL',
    monthYearA11yLabel: 'MMMM YYYY'
  }
};


@NgModule({
    declarations: [
        AppComponent,
        NavComponent,
        DevDashboardComponent,
        SignInComponent,
        DevClientComponent,
        DevDeviceComponent,
        DevWorkerComponent,
        DevTrainingComponent,
        DevActivityComponent,
        ClientDashboardComponent,
        ClientTrainingComponent,
        ClientTrainingDashboardComponent,
        ClientDeviceComponent,
        ClientWorkerComponent,
        ActivateDeviceDialogComponent,
        CreateWorkerDialogComponent,
        EditWorkerDialogComponent,
        EditDeviceDialogComponent,
        EditTrainingDialogComponent,
        ClientSettingsComponent,
        ClientProductivityDashboardComponent,
        ClientLaborDashboardComponent,
        ClientLocationsComponent,
        ClientLocationLayoutComponent,
        ClientLocLytRowsComponent,
        CreateLayoutDialogComponent,
        EditLayoutDialogComponent,
        CreateLocationDialogComponent,
        ClientApisComponent,
        EditLocationDialogComponent,
        ConfirmationDialogComponent,
        SafeHtmlPipe,
        ClientUserComponent,
        EditUserDialogComponent,
        CreateUserDialogComponent,
        AddAnnotationComponent,
        ConfirmationSnackbarComponent,
        ClientUserProfileComponent,
        HelpComponent,
        ClientGeneralComponent,
        TrainingDataRequestsComponent,
        LaborPerformanceSectionComponent,
        ClientProductivityVarietySectionComponent,
        LaborOverviewSectionComponent,
        CdkDetailRowDirective,
        LaborProductivitySectionComponent,
        ClientProductivityRowSectionComponent,
        ClientLabelsComponent,
        CreateLabelDialogComponent,
        EditLabelDialogComponent,
        ClientVarietiesComponent,
        CreateVarietyDialogComponent,
        EditVarietyDialogComponent,
        ClientProductivityRowmapSectionComponent,
        ClientObservationsComponent,
        ClientPositionsComponent,
        CreatePositionDialogComponent,
        EditPositionDialogComponent,
        ClientTasksComponent,
        CreateTaskDialogComponent,
        EditTaskDialogComponent,
        ClientRegistrationsDashboardComponent,
        LaborTrolleySectionComponent,
        ClientSessionsDashboardComponent,
        EditSessionDialogComponent,
        MultipleDeviceEditComponent,
        EditRegistrationDialogComponent,
        ClientTaskGroupsComponent,
        CreateTaskGroupDialogComponent,
        EditTaskGroupDialogComponent,
        CreateSessionDialogComponent,
        EnrollmentSettingsDialogComponent,
        ClientWorkerGroupsComponent,
        CreateWorkerGroupDialogComponent,
        EditWorkerGroupDialogComponent,
        ClientPresencesComponent
    ],
  imports: [
    AngularFireModule.initializeApp(environment.firebase),
    AngularFireAuthModule,
    AngularFirestoreModule,
    AngularFireStorageModule,
    CommonModule,
    BrowserModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    HttpClientModule,
    FormsModule,
    ReactiveFormsModule,
    MaterialModule,
    SimplebarAngularModule,
    MatTabsModule,
    NgxChartsModule,
    NgsContenteditableModule,
    ClipboardModule,
    MatDatepickerModule,
    MatDividerModule,
    MatDialogModule,
    YouTubePlayerModule,
    ContenteditableValueAccessorModule,
    NgOptimizedImage,
    GoogleMapsModule,
    NgxMatDatetimePickerModule,
    MatCardModule,
    MatInputModule,
    MatFormFieldModule,
    MatButtonModule,
    MatIconModule,
    NgxMaterialTimepickerModule,
    NgxMatTimepickerModule,
    NgxMatNativeDateModule,
    NgxMatMomentModule,
    MtxTooltipModule
  ],
    providers: [
        {
            provide: APP_INITIALIZER,
            multi: true,
            deps: [AngularFireAuth],
            useFactory: initializeApp
        },
        {provide: USE_AUTH_EMULATOR, useValue: environment.useEmulators ? ['localhost', 9099] : undefined},
        {provide: USE_FIRESTORE_EMULATOR, useValue: environment.useEmulators ? ['localhost', 8080] : undefined},
        {provide: USE_FUNCTIONS_EMULATOR, useValue: environment.useEmulators ? ['localhost', 5001] : undefined},
        { provide: NGX_MAT_DATE_FORMATS, useValue: CUSTOM_DATE_FORMATS }],
    bootstrap: [AppComponent],
})

export class AppModule {}
