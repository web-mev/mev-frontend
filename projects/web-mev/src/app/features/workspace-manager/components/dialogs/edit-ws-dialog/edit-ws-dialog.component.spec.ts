import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { EditWSDialogComponent } from './edit-ws-dialog.component';

describe('EditWSDialogComponent', () => {
  let component: EditWSDialogComponent;
  let fixture: ComponentFixture<EditWSDialogComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [EditWSDialogComponent]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(EditWSDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
