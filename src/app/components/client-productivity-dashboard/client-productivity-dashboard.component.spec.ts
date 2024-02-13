import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ClientProductivityDashboardComponent } from './client-productivity-dashboard.component';

describe('ClientProductivityDashboardComponent', () => {
  let component: ClientProductivityDashboardComponent;
  let fixture: ComponentFixture<ClientProductivityDashboardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ClientProductivityDashboardComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ClientProductivityDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
