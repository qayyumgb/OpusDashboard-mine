// This file can be replaced during build by using the `fileReplacements` array.
// `ng build --prod` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  production: false,
  useEmulators: false,
  functionsBase: 'https://us-central1-opustest-6d0c8.cloudfunctions.net',
  firebase: {
    apiKey: "AIzaSyDSs7_Un6rSqwVUO4ylwjvad2UnUj2lkzM",
    authDomain: "opustest-6d0c8.firebaseapp.com",
    projectId: "opustest-6d0c8",
    storageBucket: "opustest-6d0c8.appspot.com",
    messagingSenderId: "1050438520935",
    appId: "1:1050438520935:web:62e8df6ce2bb823b0184c2",
    measurementId: "G-H556RQ6NVT",
    databaseURL: "https://opustest-6d0c8-default-rtdb.europe-west1.firebasedatabase.app/"
  }
};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/plugins/zone-error';  // Included with Angular CLI.
