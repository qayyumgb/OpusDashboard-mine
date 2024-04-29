import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LanguageSettingsComponent } from './language-settings.component';

describe('ClientLanguagesComponent', () => {
  let component: LanguageSettingsComponent;
  let fixture: ComponentFixture<LanguageSettingsComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [LanguageSettingsComponent]
    });
    fixture = TestBed.createComponent(LanguageSettingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
