import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SetDifferenceDialogComponent } from './set-difference-dialog.component';

describe('SetDifferenceDialogComponent', () => {
  let component: SetDifferenceDialogComponent;
  let fixture: ComponentFixture<SetDifferenceDialogComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [SetDifferenceDialogComponent]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SetDifferenceDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
