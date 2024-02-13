import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ClientApisComponent } from './client-apis.component';

describe('ClientApisComponent', () => {
  let component: ClientApisComponent;
  let fixture: ComponentFixture<ClientApisComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ClientApisComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ClientApisComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
