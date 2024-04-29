import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SidenavHelpComponent } from './sidenav-help.component';

describe('SidenavHelpComponent', () => {
  let component: SidenavHelpComponent;
  let fixture: ComponentFixture<SidenavHelpComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [SidenavHelpComponent]
    });
    fixture = TestBed.createComponent(SidenavHelpComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
