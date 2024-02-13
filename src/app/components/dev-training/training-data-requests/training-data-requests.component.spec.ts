import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TrainingDataRequestsComponent } from './training-data-requests.component';

describe('TrainingDataRequestsComponent', () => {
  let component: TrainingDataRequestsComponent;
  let fixture: ComponentFixture<TrainingDataRequestsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ TrainingDataRequestsComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TrainingDataRequestsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
