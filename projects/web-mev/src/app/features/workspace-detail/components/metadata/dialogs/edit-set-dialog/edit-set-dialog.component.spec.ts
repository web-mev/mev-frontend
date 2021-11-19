import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { EditFeatureSetDialogComponent } from './edit-feature-set-dialog.component';

describe('EditFeatureSetDialogComponent', () => {
  let component: EditFeatureSetDialogComponent;
  let fixture: ComponentFixture<EditFeatureSetDialogComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [EditFeatureSetDialogComponent]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(EditFeatureSetDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
