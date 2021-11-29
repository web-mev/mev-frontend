import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PublicDatasetsListComponent } from './public-datasets-list.component';

describe('PublicDatasetsListComponent', () => {
  let component: PublicDatasetsListComponent;
  let fixture: ComponentFixture<PublicDatasetsListComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [PublicDatasetsListComponent]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PublicDatasetsListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
