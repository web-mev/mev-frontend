import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { EditSetDialogComponent } from './edit-set-dialog.component';

describe('EditSetDialogComponent', () => {
  let component: EditSetDialogComponent;
  let fixture: ComponentFixture<EditSetDialogComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [EditSetDialogComponent]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(EditSetDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
