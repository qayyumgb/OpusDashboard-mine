import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditLangElementDialogComponent } from './edit-lang-element-dialog.component';

describe('EditLanguageElementComponent', () => {
  let component: EditLangElementDialogComponent;
  let fixture: ComponentFixture<EditLangElementDialogComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [EditLangElementDialogComponent]
    });
    fixture = TestBed.createComponent(EditLangElementDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
