import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ClientLaborDashboardComponent } from './client-labor-dashboard.component';

describe('ClientLaborDashboardComponent', () => {
  let component: ClientLaborDashboardComponent;
  let fixture: ComponentFixture<ClientLaborDashboardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ClientLaborDashboardComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ClientLaborDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
