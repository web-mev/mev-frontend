import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ProgressSnackbarComponent } from './progress-snackbar.component';

describe('ProgressSnackbarComponent', () => {
  let component: ProgressSnackbarComponent;
  let fixture: ComponentFixture<ProgressSnackbarComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ProgressSnackbarComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ProgressSnackbarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
