import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ClientTrainingDashboardComponent } from './client-training-dashboard.component';

describe('ClientTrainingDashboardComponent', () => {
  let component: ClientTrainingDashboardComponent;
  let fixture: ComponentFixture<ClientTrainingDashboardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ClientTrainingDashboardComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ClientTrainingDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
