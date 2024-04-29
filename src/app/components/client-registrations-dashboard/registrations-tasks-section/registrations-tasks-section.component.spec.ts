import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RegistrationsTasksSectionComponent } from './registrations-tasks-section.component';

describe('RegistrationsTasksSectionComponent', () => {
  let component: RegistrationsTasksSectionComponent;
  let fixture: ComponentFixture<RegistrationsTasksSectionComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [RegistrationsTasksSectionComponent]
    });
    fixture = TestBed.createComponent(RegistrationsTasksSectionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
