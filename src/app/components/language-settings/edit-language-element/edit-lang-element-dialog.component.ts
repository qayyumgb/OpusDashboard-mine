import {ChangeDetectorRef, Component, Inject, OnDestroy, OnInit} from '@angular/core';
import {UntypedFormBuilder, UntypedFormGroup, Validators} from "@angular/forms";
import {Subscription} from "rxjs";
import {FirestoreService} from "../../../services/firestore.service";
import {ClientInContextService} from "../../../services/client-in-context.service";
import {AuthService} from "../../../services/auth.service";
import {MatSnackBar} from "@angular/material/snack-bar";
import {MAT_DIALOG_DATA, MatDialogRef} from "@angular/material/dialog";
import {SNACKBAR_CLASSES} from "../../../common/utils/utils";
import {elementTypes} from "../language-utils/language-utils";
import {marked} from 'marked';

@Component({
  selector: 'app-edit-language-element',
  templateUrl: './edit-lang-element-dialog.component.html',
  styleUrls: ['./edit-lang-element-dialog.component.scss']
})
export class EditLangElementDialogComponent implements OnInit, OnDestroy {
  editLanguageElementForm: UntypedFormGroup;
  loggedInUserFromAuthServiceSubscription: Subscription;
  loggedInUserDocData: any;

  elementBeingEdited: any;
  selectedClientDocData: any;
  languagesList: any[];

  constructor(
    private firestoreService: FirestoreService,
    private clientInContextService: ClientInContextService,
    public authService: AuthService,
    private fb: UntypedFormBuilder,
    private snackBar: MatSnackBar,
    private dialogRef: MatDialogRef<EditLangElementDialogComponent>,
    @Inject(MAT_DIALOG_DATA) data,
    private ref: ChangeDetectorRef
  ) {
    this.elementBeingEdited = data.elementRecord;
    this.loggedInUserFromAuthServiceSubscription = this.authService.loggedInUserFromAuthService$.subscribe(
      (userDocData) => {
        this.loggedInUserDocData = userDocData;
      }
    );
  }

  ngOnInit() {
    this.editLanguageElementForm = this.fb.group({
      pathStr: [{
        value: this.elementBeingEdited.pathStr,
        disabled: true
      }, []],
      typeFriendlyName: [{
        value: this.elementBeingEdited.typeFriendlyName,
        disabled: true
      }, []],
      header_en: [this.elementBeingEdited.translations?.en?.header ?? '', []],
      enabled_en: [{value: true, disabled: true}, []],
      plain_en: [this.elementBeingEdited.translations.en?.plain, []],
      header_nl: [this.elementBeingEdited.translations?.nl?.header ?? '', []],
      enabled_nl: [{value: this.elementBeingEdited.translations?.nl?.enabled, disabled: false}, []],
      plain_nl: [this.elementBeingEdited.translations.nl?.plain, []],
      releaseDate: [{
        disabled: this.elementBeingEdited !== 'RELEASE_NOTES',
        value: this.elementBeingEdited.releaseDate
      }, []],//TODO -- handle dates

    });
  }

  async updateElement() {

    if (this.editLanguageElementForm.pristine) {
      this.openSnackBar('No changes detected!', 'error');
      return;
    }

    const elementUpdateObj: any = {
      translations: {}
    };
    const formValue = this.editLanguageElementForm.value;
    elementUpdateObj.translations.en = {
      enabled: true,
      header: formValue.header_en ?? '',
      plain: formValue.plain_en ?? '',
      html: formValue.plain_en ? elementTypes.filter(elementType => elementType.type === this.elementBeingEdited.type)[0].convertToHtml ?
        marked.parse(formValue.plain_en) : formValue.plain_en : ''
    }
    if (!formValue.enabled_nl) {
      elementUpdateObj.translations.nl = {
        enabled: false,
        header: formValue.header_nl ?? '',
        plain: formValue.plain_nl ?? '',
        html: formValue.plain_nl ? elementTypes.filter(elementType => elementType.type === this.elementBeingEdited.type)[0].convertToHtml ?
          marked.parse(formValue.plain_nl) : formValue.plain_nl : ''
      }
    } else {
      elementUpdateObj.translations.nl = {
        enabled: true,
        header: formValue.header_nl ?? '',
        plain: formValue.plain_nl ?? '',
        html: formValue.plain_nl ? elementTypes.filter(elementType => elementType.type === this.elementBeingEdited.type)[0].convertToHtml ?
          marked.parse(formValue.plain_nl) : formValue.plain_nl : ''
      }
    }

    try {
      await this.firestoreService.updateLanguageElementById(this.elementBeingEdited.id, elementUpdateObj);
      this.openSnackBar('Changes have been saved', 'success');
      this.editLanguageElementForm.markAsPristine();
      this.dialogRef.close();
    } catch (error: any) {
      this.openSnackBar('Error in saving changes:' + error.message, 'error');
      console.log(error.message);
    }
  }

  close() {
    this.dialogRef.close();
  }

  ngOnDestroy(): void {
    this.loggedInUserFromAuthServiceSubscription?.unsubscribe();
  }

  openSnackBar(message, type) {
    this.snackBar.open(message, '', {
      panelClass: SNACKBAR_CLASSES[type],
      duration: 5000,
      horizontalPosition: 'center',
      verticalPosition: 'bottom',
    });
  }

  getPreview(langCode) {
    if (this.editLanguageElementForm.dirty) {
      if (elementTypes.filter(elementType => elementType.type === this.elementBeingEdited.type)[0].convertToHtml && this.editLanguageElementForm.controls[`plain_${langCode.toLowerCase()}`].value) {
        return marked.parse(this.editLanguageElementForm.controls[`plain_${langCode.toLowerCase()}`].value);
      } else {
        return '<span></span>';
      }
    } else {
      if (langCode === 'EN' && this.elementBeingEdited.translations.en && elementTypes.filter(elementType => elementType.type === this.elementBeingEdited.type)[0].convertToHtml) {
        return this.elementBeingEdited.translations.en.html ?? '<span></span>';
      }

      if (langCode === 'NL' && this.elementBeingEdited.translations.nl && elementTypes.filter(elementType => elementType.type === this.elementBeingEdited.type)[0].convertToHtml) {
        return this.elementBeingEdited.translations.nl.html ?? '<span></span>';
      } else {
        return '<span></span>';
      }
    }

  }

  onTabChange($event) {
    //console.log($event.tab.textLabel);
    if ($event.tab.textLabel === 'EN') {

    }
  }
}

