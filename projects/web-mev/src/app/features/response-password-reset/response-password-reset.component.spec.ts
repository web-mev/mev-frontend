import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ResponsePasswordResetComponent } from './response-password-reset.component';

describe('ResponsePasswordResetComponent', () => {
  let component: ResponsePasswordResetComponent;
  let fixture: ComponentFixture<ResponsePasswordResetComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ResponsePasswordResetComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ResponsePasswordResetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
