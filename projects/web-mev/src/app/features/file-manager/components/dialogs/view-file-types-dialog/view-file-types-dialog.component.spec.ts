import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ViewFileTypesDialogComponent } from './view-file-types-dialog.component';

describe('ViewFileTypesDialogComponent', () => {
  let component: ViewFileTypesDialogComponent;
  let fixture: ComponentFixture<ViewFileTypesDialogComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ViewFileTypesDialogComponent]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ViewFileTypesDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
