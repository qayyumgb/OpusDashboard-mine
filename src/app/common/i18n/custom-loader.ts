import {TranslateLoader} from '@ngx-translate/core';
import {Observable, of} from 'rxjs';
import {FirestoreService} from "../../services/firestore.service";

export class CustomLoader implements TranslateLoader {
  en: any;
  nl: any;

  constructor(private firestoreService: FirestoreService) {
    this.firestoreService.getLanguageJSON('en').subscribe(enDS => {
      this.en = enDS.data();
      //console.log(JSON.stringify(this.en), undefined, 4);
    });
    this.firestoreService.getLanguageJSON('nl').subscribe(nlDS => {
      this.nl = nlDS.data();
    });
  }

  getTranslation(lang: string): Observable<any> {

    const options = {
      async: false,
      breaks: false,
      extensions: null,
      gfm: true,
      hooks: null,
      pedantic: false,
      silent: false,
      tokenizer: null,
      walkTokens: null,
    };

    switch (lang) {
      case 'en':
        return of(this.en); // the rxjs 'of' is to simulate an Observable (expected) return for this class
      case 'nl':
        return of(this.nl);
      default:
        return of(this.en);
    }
  }
}
