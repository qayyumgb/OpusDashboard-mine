import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreatePresenceDialogComponent } from './create-presence-dialog.component';

describe('CreatePresenceDialogComponent', () => {
  let component: CreatePresenceDialogComponent;
  let fixture: ComponentFixture<CreatePresenceDialogComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [CreatePresenceDialogComponent]
    });
    fixture = TestBed.createComponent(CreatePresenceDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
