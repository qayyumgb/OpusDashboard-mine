import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateLabelDialogComponent } from './create-label-dialog.component';

describe('CreateLabelDialogComponent', () => {
  let component: CreateLabelDialogComponent;
  let fixture: ComponentFixture<CreateLabelDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CreateLabelDialogComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CreateLabelDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
