import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreatePositionDialogComponent } from './create-position-dialog.component';

describe('CreatePositionDialogComponent', () => {
  let component: CreatePositionDialogComponent;
  let fixture: ComponentFixture<CreatePositionDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CreatePositionDialogComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CreatePositionDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
