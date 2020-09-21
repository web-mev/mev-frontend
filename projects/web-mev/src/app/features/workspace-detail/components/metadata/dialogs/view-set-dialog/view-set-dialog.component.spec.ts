import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ViewSetDialogComponent } from './view-set-dialog.component';

describe('ViewSetDialogComponent', () => {
  let component: ViewSetDialogComponent;
  let fixture: ComponentFixture<ViewSetDialogComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ViewSetDialogComponent]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ViewSetDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
