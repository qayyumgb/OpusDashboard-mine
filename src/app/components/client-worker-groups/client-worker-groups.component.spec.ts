import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ClientWorkerGroupsComponent } from './client-worker-groups.component';

describe('ClientWorkerGroupsComponent', () => {
  let component: ClientWorkerGroupsComponent;
  let fixture: ComponentFixture<ClientWorkerGroupsComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ClientWorkerGroupsComponent]
    });
    fixture = TestBed.createComponent(ClientWorkerGroupsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
