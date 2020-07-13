import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AddWSDialogComponent } from './add-ws-dialog.component';

describe('AddWSDialogComponent', () => {
  let component: AddWSDialogComponent;
  let fixture: ComponentFixture<AddWSDialogComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [AddWSDialogComponent]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AddWSDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
