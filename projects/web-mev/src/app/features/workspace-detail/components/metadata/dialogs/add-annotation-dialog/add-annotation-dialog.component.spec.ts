import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AddAnnotationDialogComponent } from './add-annotation-dialog.component';

describe('AddAnnotationDialogComponent', () => {
  let component: AddAnnotationDialogComponent;
  let fixture: ComponentFixture<AddAnnotationDialogComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [AddAnnotationDialogComponent]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AddAnnotationDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
