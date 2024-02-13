import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ClientSessionsDashboardComponent } from './client-sessions-dashboard.component';

describe('ClientSessionsDashboardComponent', () => {
  let component: ClientSessionsDashboardComponent;
  let fixture: ComponentFixture<ClientSessionsDashboardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ClientSessionsDashboardComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ClientSessionsDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
