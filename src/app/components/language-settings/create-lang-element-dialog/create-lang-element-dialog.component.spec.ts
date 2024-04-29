import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateLangElementDialogComponent } from './create-lang-element-dialog.component';

describe('CreateLangElementDialogComponent', () => {
  let component: CreateLangElementDialogComponent;
  let fixture: ComponentFixture<CreateLangElementDialogComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [CreateLangElementDialogComponent]
    });
    fixture = TestBed.createComponent(CreateLangElementDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
