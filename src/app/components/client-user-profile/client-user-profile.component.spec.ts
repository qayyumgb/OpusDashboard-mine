import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ClientUserProfileComponent } from './client-user-profile.component';

describe('ClientUserProfileComponent', () => {
  let component: ClientUserProfileComponent;
  let fixture: ComponentFixture<ClientUserProfileComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ClientUserProfileComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ClientUserProfileComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
