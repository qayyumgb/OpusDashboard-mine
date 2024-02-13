import { TestBed } from '@angular/core/testing';

import { UrlNavigationInterceptorService } from './url-navigation-interceptor.service';

describe('UrlNavigationInterceptorService', () => {
  let service: UrlNavigationInterceptorService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(UrlNavigationInterceptorService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
