import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateVarietyDialogComponent } from './create-variety-dialog.component';

describe('CreateVarietyDialogComponent', () => {
  let component: CreateVarietyDialogComponent;
  let fixture: ComponentFixture<CreateVarietyDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CreateVarietyDialogComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CreateVarietyDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
