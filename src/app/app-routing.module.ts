import {NgModule} from '@angular/core';
import {Routes, RouterModule} from '@angular/router';
import {AuthGuard} from './common/guards/auth.guard';

import {
  SignInComponent,
  DevDashboardComponent,
  DevDeviceComponent,
  DevWorkerComponent,
  DevTrainingComponent,
  DevActivityComponent,
  DevClientComponent,
  ClientDashboardComponent,
  ClientTrainingComponent,
  ClientTrainingDashboardComponent,
  ClientWorkerComponent, ClientDeviceComponent, ClientUserComponent,
} from './components.module';
import {ClientSettingsComponent} from "./components/client-settings/client-settings.component";
import {
  ClientProductivityDashboardComponent
} from "./components/client-productivity-dashboard/client-productivity-dashboard.component";
import {ClientLaborDashboardComponent} from "./components/client-labor-dashboard/client-labor-dashboard.component";
import {AddAnnotationComponent} from "./components/dev-training/add-annotation/add-annotation.component";
import {ClientLocationsComponent} from "./components/client-locations/client-locations.component";
import {ClientApisComponent} from "./components/client-apis/client-apis.component";
import {ClientUserProfileComponent} from "./components/client-user-profile/client-user-profile.component";
import {HelpComponent} from "./components/help/help.component";
import {ClientGeneralComponent} from "./components/client-general/client-general.component";
import {
  TrainingDataRequestsComponent
} from "./components/dev-training/training-data-requests/training-data-requests.component";
import {
  LaborPerformanceSectionComponent
} from "./components/client-labor-dashboard/labor-performance-section/labor-performance-section.component";
import {
  LaborOverviewSectionComponent
} from "./components/client-labor-dashboard/labor-overview-section/labor-overview-section.component";
import {
  LaborProductivitySectionComponent
} from "./components/client-labor-dashboard/labor-productivity-section/labor-productivity-section.component";
import {
  ClientProductivityRowSectionComponent
} from "./components/client-productivity-dashboard/client-productivity-row-section/client-productivity-row-section.component";
import {
  ClientProductivityVarietySectionComponent
} from "./components/client-productivity-dashboard/client-productivity-variety-section/client-productivity-variety-section.component";
import {ClientLabelsComponent} from "./components/client-labels/client-labels.component";
import {ClientVarietiesComponent} from "./components/client-varieties/client-varieties.component";
import {
  ClientProductivityRowmapSectionComponent
} from "./components/client-productivity-dashboard/client-productivity-rowmap-section/client-productivity-rowmap-section.component";
import {ClientObservationsComponent} from "./components/client-observations/client-observations.component";
import {ClientPositionsComponent} from "./components/client-positions/client-positions.component";
import {ClientTasksComponent} from "./components/client-tasks/client-tasks.component";
import {
  ClientRegistrationsDashboardComponent
} from "./components/client-registrations-dashboard/client-registrations-dashboard.component";
import {
  LaborTrolleySectionComponent
} from "./components/client-labor-dashboard/labor-trolley-section/labor-trolley-section.component";
import {
  ClientSessionsDashboardComponent
} from "./components/client-sessions-dashboard/client-sessions-dashboard.component";
import {ClientTaskGroupsComponent} from "./components/client-task-groups/client-task-groups.component";
import {ClientWorkerGroupsComponent} from "./components/client-worker-groups/client-worker-groups.component";
import {ClientPresencesComponent} from "./components/client-presences/client-presences.component";
import {
  LaborPresencesSectionComponent
} from "./components/client-labor-dashboard/labor-presences-section/labor-presences-section.component";
import {LanguageSettingsComponent} from "./components/language-settings/language-settings.component";
import {
  RegistrationsTasksSectionComponent
} from './components/client-registrations-dashboard/registrations-tasks-section/registrations-tasks-section.component';
import {
  RegistrationsPresencesSectionComponent
} from './components/client-registrations-dashboard/registrations-presences-section/registrations-presences-section.component';

const routes: Routes = [
  {
    path: '',
    component: SignInComponent
  },
  {
    path: 'sign-in',
    component: SignInComponent
  },
  {
    path: 'clients',
    component: DevClientComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'devices',
    component: DevDeviceComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'workers',
    component: DevWorkerComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'trainings',
    component: DevTrainingComponent,
    canActivate: [AuthGuard],
    data: {
      isDeveloperRoute: true,
      roles: ['admin', 'manager', 'regular']
    }
  },
  {
    path: 'annotations/:training_id',
    component: AddAnnotationComponent,
    canActivate: [AuthGuard],
    data: {
      isDeveloperRoute: true,
      roles: ['admin', 'manager', 'regular']
    }
  },
  {
    path: 'annotations/:training_id/download_requests',
    component: TrainingDataRequestsComponent,
    canActivate: [AuthGuard],
    data: {
      isDeveloperRoute: true,
      roles: ['admin', 'manager', 'regular']
    }
  },
  {
    path: 'activities',
    component: DevActivityComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'client/:client_id/training/:training_id/trainingdashboard',
    component: ClientTrainingDashboardComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'settings',
    component: ClientSettingsComponent,
    canActivate: [AuthGuard],
    data: {
      roles: ['manager', 'admin']
    },
    children: [
      {
        path: '',
        redirectTo: 'general',
        pathMatch: 'full'
      },
      {
        path: 'general',
        pathMatch: 'full',
        component: ClientGeneralComponent
      },
      {
        path: 'userprofile',
        pathMatch: 'full',
        component: ClientUserProfileComponent
      },
      {
        path: 'locations',
        pathMatch: 'full',
        component: ClientLocationsComponent
      },
      {
        path: 'users',
        pathMatch: 'full',
        component: ClientUserComponent
      },
      {
        path: 'workers',
        pathMatch: 'full',
        component: ClientWorkerComponent
      },
      {
        path: 'workergroups',
        pathMatch: 'full',
        component: ClientWorkerGroupsComponent
      },
      {
        path: 'varieties',
        pathMatch: 'full',
        component: ClientVarietiesComponent
      },
      {
        path: 'presences',
        pathMatch: 'full',
        component: ClientPresencesComponent
      },
      {
        path: 'labels',
        pathMatch: 'full',
        component: ClientLabelsComponent
      },
      {
        path: 'positions',
        pathMatch: 'full',
        component: ClientPositionsComponent
      },
      {
        path: 'tasks',
        pathMatch: 'full',
        component: ClientTasksComponent
      },
      {
        path: 'taskgroups',
        pathMatch: 'full',
        component: ClientTaskGroupsComponent
      },
      {
        path: 'devices',
        pathMatch: 'full',
        component: ClientDeviceComponent
      },
      {
        path: 'apis',
        pathMatch: 'full',
        component: ClientApisComponent
      },
      {
        path: 'languages',
        pathMatch: 'full',
        component: LanguageSettingsComponent
      },
    ]
  },
  {
    path: 'dashboard/productivity',
    component: ClientProductivityDashboardComponent,
    canActivate: [AuthGuard],
    data: {
      roles: ['regular', 'manager', 'admin']
    },
    children: [
      {
        path: '',
        redirectTo: 'rowmap',
        pathMatch: 'full'
      },
      {
        path: 'rowmap',
        pathMatch: 'full',
        component: ClientProductivityRowmapSectionComponent
      },
      {
        path: 'row',
        pathMatch: 'full',
        component: ClientProductivityRowSectionComponent
      },
      {
        path: 'variety',
        pathMatch: 'full',
        component: ClientProductivityVarietySectionComponent
      }
    ]
  },
  {
    path: 'dashboard/rowmap',
    component: ClientProductivityRowmapSectionComponent,
    canActivate: [AuthGuard],
    data: {
      roles: ['regular', 'manager', 'admin']
    }
  },
  {
    path: 'dashboard/observations',
    component: ClientObservationsComponent,
    canActivate: [AuthGuard],
    data: {
      roles: ['regular', 'manager', 'admin']
    }
  },
  {
    path: 'dashboard/labor',
    component: ClientLaborDashboardComponent,
    canActivate: [AuthGuard],
    data: {
      roles: ['regular', 'manager', 'admin']
    },
    children: [
      {
        path: '',
        redirectTo: 'presences',
        pathMatch: 'full'
      },
      {
        path: 'presences',
        pathMatch: 'full',
        component: LaborPresencesSectionComponent
      },
      {
        path: 'overview',
        pathMatch: 'full',
        component: LaborOverviewSectionComponent
      },
      {
        path: 'trolley',
        pathMatch: 'full',
        component: LaborTrolleySectionComponent
      },
      {
        path: 'performance',
        pathMatch: 'full',
        component: LaborPerformanceSectionComponent
      },
      {
        path: 'productivity',
        pathMatch: 'full',
        component: LaborProductivitySectionComponent
      }
    ]
  },
  {
    path: 'dashboard/sessions',
    component: ClientSessionsDashboardComponent,
    canActivate: [AuthGuard],
    data: {
      roles: ['regular', 'manager', 'admin']
    }
  },
  {
    path: 'dashboard/registrations',
    component: ClientRegistrationsDashboardComponent,
    canActivate: [AuthGuard],
    data: {
      roles: ['regular', 'manager', 'admin']
    },
    children: [
      {
        path: '',
        redirectTo: 'tasks',
        pathMatch: 'full'
      },
      {
        path: 'tasks',
        pathMatch: 'full',
        component: RegistrationsTasksSectionComponent
      },
      {
        path: 'presences',
        pathMatch: 'full',
        component: RegistrationsPresencesSectionComponent
      }
    ]
  },
  {
    path: 'help',
    component: HelpComponent,
    canActivate: [AuthGuard],
    data: {
      roles: ['regular', 'manager', 'admin']
    }
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {
}
