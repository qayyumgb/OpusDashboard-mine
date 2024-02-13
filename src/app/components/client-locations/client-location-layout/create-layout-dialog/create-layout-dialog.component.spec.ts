import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateLayoutDialogComponent } from './create-layout-dialog.component';

describe('CreateWorkerDialogComponent', () => {
  let component: CreateLayoutDialogComponent;
  let fixture: ComponentFixture<CreateLayoutDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CreateLayoutDialogComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CreateLayoutDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
