import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DeleteWSDialogComponent } from './delete-ws-dialog.component';

describe('DeleteWSDialogComponent', () => {
  let component: DeleteWSDialogComponent;
  let fixture: ComponentFixture<DeleteWSDialogComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [DeleteWSDialogComponent]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DeleteWSDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
