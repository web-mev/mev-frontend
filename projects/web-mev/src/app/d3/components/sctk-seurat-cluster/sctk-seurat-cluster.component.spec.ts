import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SctkSeuratClusterComponent } from './sctk-seurat-cluster.component';

describe('SctkSeuratClusterComponent', () => {
  let component: SctkSeuratClusterComponent;
  let fixture: ComponentFixture<SctkSeuratClusterComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SctkSeuratClusterComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SctkSeuratClusterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
