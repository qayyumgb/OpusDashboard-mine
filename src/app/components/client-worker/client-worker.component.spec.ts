import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ClientWorkerComponent } from './client-worker.component';

describe('ClientWorkerComponent', () => {
  let component: ClientWorkerComponent;
  let fixture: ComponentFixture<ClientWorkerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ClientWorkerComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ClientWorkerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
