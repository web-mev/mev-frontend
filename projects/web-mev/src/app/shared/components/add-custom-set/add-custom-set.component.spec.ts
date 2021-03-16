import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AddCustomSetComponent } from './add-custom-set.component';

describe('AddCustomSetComponent', () => {
  let component: AddCustomSetComponent;
  let fixture: ComponentFixture<AddCustomSetComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [AddCustomSetComponent]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AddCustomSetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
