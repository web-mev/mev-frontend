import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AddObservationSetDialogComponent } from './add-observation-set-dialog.component';

describe('AddObservationSetDialogComponent', () => {
  let component: AddObservationSetDialogComponent;
  let fixture: ComponentFixture<AddObservationSetDialogComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [AddObservationSetDialogComponent]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AddObservationSetDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
