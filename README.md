OpusDashboard
===

# 1. Introduction
For the start we need a relative simple dashboard with a basic interface. The dashboard should be based on Angular Material with the Firebase modul.

## 1.1 Modules
 * @angular/material
 * firebase@latest
 * ...and related modules

# Users structure
The dashboard will be used by two types of users:
 * Clients (client) - roles are [admin,manager]
 * Developers (developer)

> Note: workers are not users in the  definition of a Firebase user.

## Client Users
The client User will see only his own client object/record.
Client Users can have the following roles:
 * Client admin (client_admin), Read and write access own client:
   * Devices (list, add, edit)
   * Workers (list, add, edit)
   * Dashboard
 * Manager (manager)
     * Devices (list)
     * Workers (list)
     * Dashboard
## Developers
The developer has read only access to all clients.
 * Read only access to all:
   * Clients (list)
   * Devices (list)
   * Workers (list)
   * Trainings (list)
   * Models (list)
   * Dashboard

 # Dashboard-app
 ## Pages
 The dashboard contains the following 'pages' per user type/role:

 * **client/client_admin:**
   * Productivity Dashboard <br/> 
   * Growth Dashboard <br/> 
   * Labor Dashboard <br/> 
   * Settings
     * Locations <br/>
     * Workers <br/> _table list all details of all workers (see [Adding user routine](#Adding-user-routine)), add-fab to add a new worker  and edit devices (name, notes)_<br/> endpoint: .../{clientId}/workers
     * Devices <br/> _table list all details of all devices, add-fab to add a new device (see [Adding device routine](#Adding-device-routine)) and edit devices (name, worker [dropdown], model [dropdown], notes)_<br/> endpoint: .../{clientId}/devices
     * APIS <br/> 
* **client/Manager:**
    * Productivity Dashboard <br/>
    * Growth Dashboard <br/>
    * Labor Dashboard <br/>
    * Settings
        * Locations <br/>
        * Workers <br/> _table list all details of all workers (see [Adding user routine](#Adding-user-routine)), add-fab to add a new worker  and edit devices (name, notes)_<br/> endpoint: .../{clientId}/workers
        * Devices <br/> _table list all details of all devices, add-fab to add a new device (see [Adding device routine](#Adding-device-routine)) and edit devices (name, worker [dropdown], model [dropdown], notes)_<br/> endpoint: .../{clientId}/devices
        * APIS <br/>
* **developer:**
   * Clients <br/> _table list all details of all clients_<br/> endpoint: .../clients
   * Devices <br/> _table list all details of all devices_<br/> endpoint: .../devices
   * Workers <br/> _table list all details of all workers_<br/> endpoint: .../workers
   * Trainings <br/> _table list all details of all training where activityType is 'training'_<br/> endpoint: .../trainings
   * Models <br/> _table list all details of all models_<br/> endpoint: .../trainings
   * Dashboard <br/> _for now an empty page_<br/> endpoint: .../{clientId}/devices

## Routines
### Adding device routine
 1. with the Add (+) fab button a dialog shows up (example: https://stackblitz.com/angular/jdkeenpvalj?file=src%2Fapp%2Fdialog-content-example.ts)
 2. directly a new device will be added to Firestore.
 3. on the background a activationKey will be generated, observe the activationKey and show the key when generate.
 4. the key will be added to the external device. When successful the device state will be updated to 'active'. Observe the 'state' value. When on 'active' return back to the user that the device is successfully added.
 5. dialog can be closed and user can be assigned to the device table.

### Adding user routine
 1. with the Add (+) fab button a dialog shows up (example: https://stackblitz.com/angular/jdkeenpvalj?file=src%2Fapp%2Fdialog-content-example.ts)
 2. when user is added return back to the user that the user is successfully added.
 3. dialog can be closed.
  
## Appearance
 * responsive
 * use observables keep the client side synced with Firestore
 * login window (email/password), using Firebase Authentication method (no signing-up yet)
 * top navbar
 * dark theme, like: https://material.io/design
 * tables
   * all editiable values can be edited directly in the table
   * format example: https://stackblitz.com/angular/jyqdokkjoap?file=src%2Fapp%2Ftable-overview-example.ts

## GitHub Actions
 * **'on'**: push:  branches: - development/master - 'on' event specifies the trigger(push=commit) and the branch(development or master) for which this script should run
 * **'jobs'** are the set of build steps that run to compile and deploy the code. We need only 1 job here which is called 'build and deploy'
 * **'runs-on'** is Operating System for which code has to be built
 * **'steps'** define the actual steps being run
 * **'uses'** are the Actions imported so that specific build and deploy steps can be performed
 * We use **2 Actions** in this project's Actions file - 
   * **actions/checkout@v2** - to checkout code
   * **FirebaseExtended/action-hosting-deploy@v0** - to deploy code on Firebase Hosting
 * Each step has -
   1. **'name'(optional)** - it describes what the step does
   2. **'run'** executes the CLI commands while * **'run: |'** executes multiple CLI commands
 * **'with'** are the configurable parameters which the Action before it expects.
* **${{variable(s)}}** are environment or workspace variables

