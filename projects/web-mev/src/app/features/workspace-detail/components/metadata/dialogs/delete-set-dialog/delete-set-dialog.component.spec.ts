import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DeleteSetDialogComponent } from './delete-set-dialog.component';

describe('DeleteSetDialogComponent', () => {
  let component: DeleteSetDialogComponent;
  let fixture: ComponentFixture<DeleteSetDialogComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [DeleteSetDialogComponent]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DeleteSetDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
