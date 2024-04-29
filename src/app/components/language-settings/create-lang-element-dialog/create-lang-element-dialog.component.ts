import {ChangeDetectorRef, Component, Inject, OnDestroy, OnInit} from '@angular/core';
import {UntypedFormBuilder, UntypedFormGroup, Validators} from '@angular/forms';
import {Subscription} from 'rxjs';
import {FirestoreService} from '../../../services/firestore.service';
import {ClientInContextService} from '../../../services/client-in-context.service';
import {AuthService} from '../../../services/auth.service';
import {MatSnackBar} from '@angular/material/snack-bar';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import {elementTypes} from '../language-utils/language-utils';
import {marked} from 'marked';
import {SNACKBAR_CLASSES} from '../../../common/utils/utils';

@Component({
  selector: 'app-create-lang-element-dialog',
  templateUrl: './create-lang-element-dialog.component.html',
  styleUrls: ['./create-lang-element-dialog.component.scss',
    '../../../common/styles/listing.scss']
})
export class CreateLangElementDialogComponent implements OnInit, OnDestroy {
  createLanguageElementForm: UntypedFormGroup;
  loggedInUserFromAuthServiceSubscription: Subscription;
  loggedInUserDocData: any;
  elementTypes: any[];

  elementBeingEdited: any;
  selectedClientDocData: any;
  languagesList: any[];

  constructor(
    private firestoreService: FirestoreService,
    private clientInContextService: ClientInContextService,
    public authService: AuthService,
    private fb: UntypedFormBuilder,
    private snackBar: MatSnackBar,
    private dialogRef: MatDialogRef<CreateLangElementDialogComponent>,
    @Inject(MAT_DIALOG_DATA) data,
    private ref: ChangeDetectorRef
  ) {
    this.elementTypes = elementTypes.sort((eleTypeA: any, eleTypeB: any) => {
      return eleTypeA.friendlyName < eleTypeB.friendlyName ? -1 : eleTypeA.friendlyName > eleTypeB.friendlyName ? 1 : 0;
    });
    this.loggedInUserFromAuthServiceSubscription = this.authService.loggedInUserFromAuthService$.subscribe(
      (userDocData) => {
        this.loggedInUserDocData = userDocData;
      }
    );
  }

  ngOnInit() {
    this.createLanguageElementForm = this.fb.group({
      pathStr: ['', [Validators.required]],
      typeCode: ['', [Validators.required]],
      header_en: ['', []],
      enabled_en: [{value: true, disabled: true}, []],
      plain_en: ['', []],
      header_nl: ['', []],
      enabled_nl: [false, []],
      plain_nl: ['', []],
      releaseDate: [{
        disabled: true/*this.elementBeingEdited !== 'RELEASE_NOTES'*/,
        value: ''
      }, []],//TODO -- handle dates

    });
  }

  async updateElement() {

    if (this.createLanguageElementForm.pristine) {
      this.openSnackBar('No changes detected!', 'error');
      return;
    }

    if (!this.createLanguageElementForm.valid) {
      this.openSnackBar('Please fill in all mandatory fields', 'error');
      return;
    }

    const elementCreateObject: any = {
      translations: {}
    };

    const formValue = this.createLanguageElementForm.value;

    if (formValue.pathStr.length < 3) {
      this.openSnackBar('Reference is too short. Atleast 3 characters required.', 'error');
      return;
    }

    if (formValue.pathStr.indexOf('/') === -1) {
      this.openSnackBar('Reference should contain atleast 1 forward slash.', 'error');
      return;
    }

    elementCreateObject.pathStr = formValue.pathStr;

    elementCreateObject.type = formValue.typeCode;

    elementCreateObject.translations.en = {
      enabled: true,
      header: formValue.header_en ?? '',
      plain: formValue.plain_en ?? '',
      html: formValue.plain_en ? elementTypes.filter(elementType => elementType.type === this.createLanguageElementForm.get('typeCode').value)[0].convertToHtml ?
        marked.parse(formValue.plain_en) : formValue.plain_en : ''
    }
    if (!formValue.enabled_nl) {
      elementCreateObject.translations.nl = {
        enabled: false,
        header: formValue.header_nl ?? '',
        plain: formValue.plain_nl ?? '',
        html: formValue.plain_nl ? elementTypes.filter(elementType => elementType.type === this.createLanguageElementForm.get('typeCode').value)[0].convertToHtml ?
          marked.parse(formValue.plain_nl) : formValue.plain_nl : ''
      }
    } else {
      elementCreateObject.translations.nl = {
        enabled: true,
        header: formValue.header_nl ?? '',
        plain: formValue.plain_nl ?? '',
        html: formValue.plain_nl ? elementTypes.filter(elementType => elementType.type === this.createLanguageElementForm.get('typeCode').value)[0].convertToHtml ?
          marked.parse(formValue.plain_nl) : formValue.plain_nl : ''
      }
    }

    this.firestoreService.createLanguageElement(elementCreateObject).subscribe({
      next: async (apiResponse) => {
        if (apiResponse.success) {
          this.createLanguageElementForm.markAsPristine();
          this.dialogRef.close(this.createLanguageElementForm.value);
          this.openSnackBar(`Language Element created successfully.`, 'success');
          this.createLanguageElementForm.reset();
        } else if (apiResponse.success === false) {
          this.openSnackBar('Error in language element creation:' + apiResponse.error, 'error');
        }
      },
      error: (error) => {
        this.openSnackBar('Error in language element creation:' + error.message, 'error');
        console.log(error.message);
      }
    });
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

  getPreview(langCode: string) {
    if (!this.createLanguageElementForm.get('typeCode').value){
      return ''
    }

    if (elementTypes.filter(elementType => elementType.type === this.createLanguageElementForm.get('typeCode').value)[0].convertToHtml) {
      if (this.createLanguageElementForm.get(`plain_${langCode.toLowerCase()}`).value) {
        return marked.parse(this.createLanguageElementForm.controls[`plain_${langCode.toLowerCase()}`].value ?? '');
      } else {
        return '<span></span>';
      }
    } else {
      return this.createLanguageElementForm.controls[`plain_${langCode.toLowerCase()}`].value ?? '';
    }
  }

  onTabChange($event) {
    //console.log($event.tab.textLabel);
    if ($event.tab.textLabel === 'EN') {

    }
  }

}

