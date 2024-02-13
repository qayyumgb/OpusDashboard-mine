import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ClientVarietiesComponent } from './client-varieties.component';

describe('ClientVarietiesComponent', () => {
  let component: ClientVarietiesComponent;
  let fixture: ComponentFixture<ClientVarietiesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ClientVarietiesComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ClientVarietiesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
