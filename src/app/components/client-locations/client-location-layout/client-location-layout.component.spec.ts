import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ClientLocationLayoutComponent } from './client-location-layout.component';

describe('ClientLocationLayoutComponent', () => {
  let component: ClientLocationLayoutComponent;
  let fixture: ComponentFixture<ClientLocationLayoutComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ClientLocationLayoutComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ClientLocationLayoutComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
