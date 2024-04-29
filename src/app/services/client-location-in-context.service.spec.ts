import { TestBed } from '@angular/core/testing';

import { ClientLocationInContextService } from './client-location-in-context.service';

describe('ClientLocationInContextService', () => {
  let service: ClientLocationInContextService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ClientLocationInContextService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
