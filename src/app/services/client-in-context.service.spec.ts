import { TestBed } from '@angular/core/testing';

import { ClientInContextService } from './client-in-context.service';

describe('ClientInContextService', () => {
  let service: ClientInContextService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ClientInContextService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
