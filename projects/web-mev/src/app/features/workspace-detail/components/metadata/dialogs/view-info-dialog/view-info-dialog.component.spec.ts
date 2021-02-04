import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ViewInfoDialogComponent } from './view-info-dialog.component';

describe('ViewInfoDialogComponent', () => {
  let component: ViewInfoDialogComponent;
  let fixture: ComponentFixture<ViewInfoDialogComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ViewInfoDialogComponent]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ViewInfoDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
