import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ClientRegistrationsDashboardComponent } from './client-registrations-dashboard.component';

describe('ClientRegistrationsDashboardComponent', () => {
  let component: ClientRegistrationsDashboardComponent;
  let fixture: ComponentFixture<ClientRegistrationsDashboardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ClientRegistrationsDashboardComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ClientRegistrationsDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
