import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ClientGeneralComponent } from './client-general.component';

describe('ClientGeneralComponent', () => {
  let component: ClientGeneralComponent;
  let fixture: ComponentFixture<ClientGeneralComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ClientGeneralComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ClientGeneralComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
