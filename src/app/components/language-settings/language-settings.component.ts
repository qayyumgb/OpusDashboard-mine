import {AfterViewInit, Component, OnDestroy, ViewChild} from '@angular/core';
import {MatTableDataSource} from "@angular/material/table";
import {LabelMainAttributes} from "../../common/interfaces/label-interfaces";
import {MatPaginator} from "@angular/material/paginator";
import {MatSort} from "@angular/material/sort";
import {DatePipe} from "@angular/common";
import {Subscription} from "rxjs";
import {FirestoreService} from "../../services/firestore.service";
import {AuthService} from "../../services/auth.service";
import {ActivatedRoute} from "@angular/router";
import {MatDialog, MatDialogConfig} from "@angular/material/dialog";
import {ClientInContextService} from "../../services/client-in-context.service";
import {MatSnackBar} from "@angular/material/snack-bar";
import {BreakpointService} from "../../services/breakpoint.service";
import {EditLangElementDialogComponent} from "./edit-language-element/edit-lang-element-dialog.component";
import {Timestamp} from "firebase/firestore";
import {elementTypes} from "./language-utils/language-utils";
import {CreateLangElementDialogComponent} from "./create-lang-element-dialog/create-lang-element-dialog.component";
import {SNACKBAR_CLASSES} from "../../common/utils/utils";
import {ConfirmationDialogComponent} from "../utility/confirmation-dialog/confirmation-dialog.component";

@Component({
  selector: 'app-language-settings',
  templateUrl: './language-settings.component.html',
  styleUrls: ['./language-settings.component.scss',
    '../../common/styles/listing.scss',]
})
export class LanguageSettingsComponent implements OnDestroy, AfterViewInit {
  unArchivedVsArchived = 'unarchived';
  labelAttributesReadableMap: Map<string, string> = new Map([
    ['typeFriendlyName', 'Type'],
    ['pathStr', 'Path'],
    ['langsEnabled', 'Languages enabled'],
    ['updatedTimestamp', 'Updated']
  ]);

  screenSize = 'default';

  columnsToDisplay: string[] = ['typeFriendlyName', 'pathStr', 'langsEnabled', 'updatedTimestamp'];
  columnsHeadersToDisplay: string[] = [
    'typeFriendlyName',
    'pathStr',
    'langsEnabled',
    'updatedTimestamp',
    'Edit'
  ];
  dataSource: MatTableDataSource<LabelMainAttributes>;
  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;
  elementsList: any[];
  dateColumns: string[] = ['updatedTimestamp'];
  datePipe = new DatePipe('en-US');
  loggedInUserFromAuthServiceSubscription: Subscription;
  loggedInUserDocData: any;
  clientInContextServiceSubscription: Subscription;
  selectedClientDocData: any;
  allLanguageElementsSubscription: Subscription;
  breakpointSubscription: Subscription;
  filterValue: string

  constructor(public firestoreService: FirestoreService,
              public authService: AuthService,
              public route: ActivatedRoute,
              private dialog: MatDialog,
              private clientInContextService: ClientInContextService,
              private snackBar: MatSnackBar,
              private breakpointService: BreakpointService
  ) {
    this.breakpointSubscription = this.breakpointService.screenSize$.subscribe(screenSize => this.screenSize = screenSize);
    this.loggedInUserFromAuthServiceSubscription = this.authService.loggedInUserFromAuthService$.subscribe(
      (userDocData) => {
        this.loggedInUserDocData = userDocData;
      }
    );

    this.clientInContextServiceSubscription = this.clientInContextService.clientInContextSubject.subscribe(selectedClientDocData => {
      if (!selectedClientDocData) {
        return;
      }
      this.selectedClientDocData = selectedClientDocData;
      this.fetchLanguageElements();
    });
  }

  ngAfterViewInit() {
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  openEditDialog(record) {
    const dialogConfig = new MatDialogConfig();
    dialogConfig.autoFocus = true;

    dialogConfig.data = {
      elementRecord: record
    };

    this.dialog.open(EditLangElementDialogComponent, dialogConfig);
  }

  async deleteElement(element) {
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      data: {
        message: `Are you sure want to delete element '${element?.pathStr ?? ''}' ?`,
        buttonText: {
          ok: 'Delete',
          cancel: 'Cancel'
        },
        element
      }
    });

    dialogRef.afterClosed().subscribe(async (value) => {
      if (value.decision) {
        try {
          await this.firestoreService.deleteLanguageElementById(element.id);
          this.openSnackBar('Language element has been deleted', 'success');
        } catch (error) {
          this.openSnackBar('Error in deleting language element:' + error.message, 'error');
          console.log(error.message);
        }
      }
    });
  }

  openSnackBar(message, type) {
    this.snackBar.open(message, '', {
      panelClass: SNACKBAR_CLASSES[type],
      duration: 5000,
      horizontalPosition: 'center',
      verticalPosition: 'bottom',
    });
  }

  ngOnDestroy(): void {
    this.loggedInUserFromAuthServiceSubscription?.unsubscribe();
    this.clientInContextServiceSubscription?.unsubscribe();
    this.allLanguageElementsSubscription?.unsubscribe();
    this.breakpointSubscription?.unsubscribe();
  }

  fetchLanguageElements() {
    this.elementsList = [];
    this.allLanguageElementsSubscription = this.firestoreService
      .getAllLanguageElements(this.selectedClientDocData.id)
      .subscribe((elementsList) => {
        this.elementsList = elementsList.map(element => {
          const langTranslations = element.translations;
          const langsEnabledSet = new Set();
          langsEnabledSet.add('EN');
          if (langTranslations && (typeof langTranslations === 'object') && (Object.keys(langTranslations).length > 0)) {
            for (const key of Object.keys(langTranslations)) {
              if (langTranslations[key].enabled) {
                langsEnabledSet.add(key.toUpperCase());
              }
            }
          }
          for (const [key, value] of Object.entries(element)) {
            if (this.dateColumns.includes(key) && element[key]) {
              const timeValue = value as Timestamp;
              element[key] = this.datePipe.transform(
                timeValue.toMillis(),
                'yyyy-MM-dd HH:mm'
              );
            }
          }
          return {
            ...element,
            pathStr: element.path.join('/'),
            typeFriendlyName: element.type ? elementTypes.filter(type => type.type === element.type)[0].friendlyName : '',
            langsEnabled: Array.from(langsEnabledSet).join(', ')
          }
        });

        this.elementsList.sort((eleA: any, eleB: any) => {
          return eleA.pathStr < eleB.pathStr ? -1 : eleA.pathStr > eleB.pathStr ? 1 : 0;
        });

        this.dataSource = new MatTableDataSource(this.elementsList);
        this.dataSource.paginator = this.paginator;
        this.dataSource.sort = this.sort;
        this.initiateFiltering();
      });
  }

  initiateFiltering() {
    if (this.filterValue) {
      this.dataSource.filter = this.filterValue.trim().toLowerCase();
      if (this.dataSource.paginator) {
        this.dataSource.paginator.firstPage();
      }
    }
  }

  openDialog() {
    const dialogConfig = new MatDialogConfig();
    dialogConfig.autoFocus = true;
    dialogConfig.data = {};
    this.dialog.open(CreateLangElementDialogComponent, dialogConfig);
  }
}

