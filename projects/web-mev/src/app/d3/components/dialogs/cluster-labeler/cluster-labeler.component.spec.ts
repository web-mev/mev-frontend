import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ClusterLabelerComponent } from './cluster-labeler.component';

describe('ClusterLabelerComponent', () => {
  let component: ClusterLabelerComponent;
  let fixture: ComponentFixture<ClusterLabelerComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ClusterLabelerComponent]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ClusterLabelerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
