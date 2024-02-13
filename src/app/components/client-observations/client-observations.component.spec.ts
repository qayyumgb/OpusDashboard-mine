import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ClientObservationsComponent } from './client-observations.component';

describe('ClientObservationsComponent', () => {
  let component: ClientObservationsComponent;
  let fixture: ComponentFixture<ClientObservationsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ClientObservationsComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ClientObservationsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
