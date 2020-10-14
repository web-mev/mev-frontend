import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AddSampleSetComponent } from './add-sample-set.component';

describe('AddSampleSetComponent', () => {
  let component: AddSampleSetComponent;
  let fixture: ComponentFixture<AddSampleSetComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [AddSampleSetComponent]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AddSampleSetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
