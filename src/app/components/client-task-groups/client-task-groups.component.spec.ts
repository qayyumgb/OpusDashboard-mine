import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ClientTaskGroupsComponent } from './client-task-groups.component';

describe('ClientTaskGroupsComponent', () => {
  let component: ClientTaskGroupsComponent;
  let fixture: ComponentFixture<ClientTaskGroupsComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ClientTaskGroupsComponent]
    });
    fixture = TestBed.createComponent(ClientTaskGroupsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
