import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AddFeatureSetDialogComponent } from './add-feature-set-dialog.component';

describe('AddFeatureSetDialogComponent', () => {
  let component: AddFeatureSetDialogComponent;
  let fixture: ComponentFixture<AddFeatureSetDialogComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [AddFeatureSetDialogComponent]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AddFeatureSetDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
