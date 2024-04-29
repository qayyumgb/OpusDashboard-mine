import {Component, HostListener, Input, OnInit} from '@angular/core';
import {FormControl, FormsModule, ReactiveFormsModule} from '@angular/forms';
import {MatDrawerMode, MatSidenavModule} from '@angular/material/sidenav';
import {MatRadioModule} from '@angular/material/radio';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {CommonModule} from '@angular/common';
import {AuthService} from "../../services/auth.service";
import {FirestoreService} from "../../services/firestore.service";
import {ActivatedRoute, NavigationEnd, NavigationError, NavigationStart, Router} from "@angular/router";
import {ClientInContextService} from "../../services/client-in-context.service";
import {TranslateService} from "@ngx-translate/core";

@Component({
  selector: 'app-sidenav-help',
  templateUrl: './sidenav-help.component.html',
  styleUrls: ['./sidenav-help.component.scss'],
})
export class SidenavHelpComponent implements OnInit {
  screenWidth: number;
  sideNavMode: MatDrawerMode = 'side';

  @Input() helpContent = ``;

  constructor(
    public authService: AuthService,
    public firestoreService: FirestoreService,
    public route: ActivatedRoute,
    private router: Router,
    public clientInContextService: ClientInContextService,
    private translate: TranslateService
  ) {
    translate.addLangs(['en', 'nl']);
    translate.setDefaultLang('en');

    const browserLang = translate.getBrowserLang();
    console.log('Translate will use language:' + browserLang.match(/en|nl/) ? browserLang : 'en');

    translate.use(browserLang.match(/en|nl/) ? browserLang : 'en');

    this.firestoreService.getLanguageJSON('en').subscribe(enDS => translate.setTranslation('en', enDS.data()));
    this.firestoreService.getLanguageJSON('nl').subscribe(nlDS => translate.setTranslation('nl', nlDS.data()));

    this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        //console.log(JSON.stringify(event));
        // Hide loading indicator
        let url = event.urlAfterRedirects;
        url = url.substring(1, url.length);
        console.log('Loading help for:' + event.urlAfterRedirects);
        this.translate.get(url.toUpperCase().split('/').join('.') + '.SIDE_HELP.TEXT').subscribe(translation => this.helpContent = translation)
      }
    });

  }

  ngOnInit() {
    this.onResize();

  }

  @HostListener('window:resize', ['$event'])
  onResize() {
    this.sideNavMode = window.innerWidth < 1200 ? 'over' : 'side';
  }
}
