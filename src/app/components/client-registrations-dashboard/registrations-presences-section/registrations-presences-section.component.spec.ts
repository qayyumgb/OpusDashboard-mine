import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RegistrationsPresencesSectionComponent } from './registrations-presences-section.component';

describe('RegistrationsPresencesSectionComponent', () => {
  let component: RegistrationsPresencesSectionComponent;
  let fixture: ComponentFixture<RegistrationsPresencesSectionComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [RegistrationsPresencesSectionComponent]
    });
    fixture = TestBed.createComponent(RegistrationsPresencesSectionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
