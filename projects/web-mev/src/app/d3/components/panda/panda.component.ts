import { Component, ChangeDetectionStrategy, OnChanges, Input } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError } from "rxjs/operators";
import * as cytoscape from 'cytoscape';

@Component({
    selector: 'mev-panda',
    templateUrl: './panda.component.html',
    styleUrls: ['./panda.component.css'],
    changeDetection: ChangeDetectionStrategy.Default
})
export class PandaComponent implements OnChanges {
    @Input() outputs;
    cy: any;

    constructor(private httpClient: HttpClient) { }

    ngOnChanges(): void {
        this.getData().subscribe(res => console.log(res))
    }

    getData() {
        let uuid = 'dcddb7f3-d5e5-4879-ae23-df37bf1d0a3c'
        let apiUrl = 'https://dummy.tm4.org/api'
        let endPoint = `${apiUrl}/resources/${uuid}/contents/transform/?transform-name=pandasubset&maxdepth=2&children=3&axis=0`;
        return this.httpClient.get(endPoint)
            .pipe(
                catchError(error => {
                    console.log("Error: ", error);
                    throw error;
                }))
    }

    createPanda() {
        this.cy = cytoscape({

            container: document.getElementById('cy'), // container to render in

            elements: {
                nodes: [
                    {
                        data: { id: 'FOXP1', interaction: "dp" },
                        position: { x: 123, y: 234 }
                    },
                    {
                        data: { id: 'FOXP4', interaction: "dp" },
                        renderedPosition: { x: 200, y: 200 }
                    },
                    {
                        data: { id: 'ARID3A', interaction: "dp" }
                    },
                    {
                        data: { id: 'SP3', interaction: "dp" }
                    },
                    {
                        data: { id: 'BPTF', interaction: "pd" }
                    },
                    {
                        data: { id: 'SP1', interaction: "dp" }
                    },
                    {
                        data: { id: 'FUBP1', interaction: "pd" }
                    },
                    {
                        data: { id: 'ZNF35', interaction: "pd" }
                    },
                    {
                        data: { id: 'PITX2', interaction: "dp" }
                    },
                    {
                        data: { id: 'PAX4', interaction: "dp" }
                    },
                    {
                        data: { id: 'BMS1', interaction: "pd" }
                    },
                    {
                        data: { id: 'ADO', interaction: "dp" }
                    },
                    {
                        data: { id: 'CYP20A1', interaction: "pd" }
                    },
                    {
                        data: { id: 'ZNHIT6', interaction: "pd" }
                    },
                    {
                        data: { id: 'TMED4', interaction: "pd" }
                    },
                    {
                        data: { id: 'MKRN2', interaction: "pd" }
                    },
                    {
                        data: { id: 'MRPL35', interaction: "pd" }
                    },
                    {
                        data: { id: 'LSM8', interaction: "pd" }
                    },
                    {
                        data: { id: 'MYPOP', interaction: "pd" }
                    },
                    {
                        data: { id: 'SMU1', interaction: "pd" }
                    },
                    {
                        data: { id: 'PBDC1', interaction: "pd" }
                    },
                    {
                        data: { id: 'LRRC40', interaction: "pd" }
                    },
                    {
                        data: { id: 'SFR1', interaction: "pd" }
                    },
                    {
                        data: { id: 'ZYG11B', interaction: "pd" }
                    },
                ],
                edges: [
                    {
                        data: { id: 'FOXP1_BMS1', source: 'FOXP1', target: 'BMS1', interaction: "dp", edge_weight: 10.29017754 }
                    },
                    {
                        data: { id: 'FOXP1_SMU1', source: 'FOXP1', target: 'SMU1', interaction: "dp", edge_weight: 9.105197016 }
                    },
                    {
                        data: { id: 'FOXP1_PBDC1', source: 'FOXP1', target: 'PBDC1', interaction: "dp", edge_weight: 9.038450511 }
                    },
                    {
                        data: { id: 'FOXP1_SFR1', source: 'FOXP1', target: 'SFR1', interaction: "dp", edge_weight: 8.953439023 }
                    },
                    {
                        data: { id: 'FOXP1_MRPL35', source: 'FOXP1', target: 'MRPL35', interaction: "dp", edge_weight: 8.828868788 }
                    },
                    {
                        data: { id: 'ARID3A_BMS1', source: 'ARID3A', target: 'BMS1', interaction: "dp", edge_weight: 10.20305706 }
                    },
                    {
                        data: { id: 'ARID3A_MKRN2', source: 'ARID3A', target: 'MKRN2', interaction: "dp", edge_weight: 9.08788855 }
                    },
                    {
                        data: { id: 'ARID3A_ZNHIT6', source: 'ARID3A', target: 'ZNHIT6', interaction: "dp", edge_weight: 8.828868788 }
                    },
                    {
                        data: { id: 'ARID3A_MRPL35', source: 'ARID3A', target: 'MRPL35', interaction: "dp", edge_weight: 8.999088688 }
                    },
                    {
                        data: { id: 'TMED4_SP3', source: 'TMED4', target: 'SP3', interaction: "pd", edge_weight: 8.819554868 }
                    },
                    {
                        data: { id: 'TMED4_SP1', source: 'TMED4', target: 'SP1', interaction: "pd", edge_weight: 8.713950241 }
                    },
                    {
                        data: { id: 'TMED4_PITX2', source: 'TMED4', target: 'PITX2', interaction: "pd", edge_weight: 8.163874758 }
                    },
                    {
                        data: { id: 'MYPOP_SP3', source: 'MYPOP', target: 'SP3', interaction: "pd", edge_weight: 9.792488504 }
                    },
                    {
                        data: { id: 'MYPOP_SP1', source: 'MYPOP', target: 'SP1', interaction: "pd", edge_weight: 9.683485326 }
                    },
                    {
                        data: { id: 'MYPOP_FOXP1', source: 'MYPOP', target: 'FOXP1', interaction: "pd", edge_weight: 3.097349936 }
                    },
                    {
                        data: { id: 'ZYG11B_FOXP4', source: 'ZYG11B', target: 'FOXP4', interaction: "pd", edge_weight: 8.895231987 }
                    },
                    {
                        data: { id: 'ZYG11B_FOXP1', source: 'ZYG11B', target: 'FOXP1', interaction: "pd", edge_weight: 8.824598222 }
                    },
                    {
                        data: { id: 'ZYG11B_ARID3A', source: 'ZYG11B', target: 'ARID3A', interaction: "pd", edge_weight: 8.79308514 }
                    },
                    {
                        data: { id: 'ZYG11B_SP1', source: 'ZYG11B', target: 'SP1', interaction: "pd", edge_weight: 8.184813497 }
                    },
                    {
                        data: { id: 'CYP20A1_FOXP4', source: 'CYP20A1', target: 'FOXP4', interaction: "pd", edge_weight: 8.73650913 }
                    },
                    {
                        data: { id: 'CYP20A1_FOXP1', source: 'CYP20A1', target: 'FOXP1', interaction: "pd", edge_weight: 8.677059032 }
                    },
                    {
                        data: { id: 'CYP20A1_PAX4', source: 'CYP20A1', target: 'PAX4', interaction: "pd", edge_weight: 7.779290904 }
                    },
                    {
                        data: { id: 'CYP20A1_SP3', source: 'CYP20A1', target: 'SP3', interaction: "pd", edge_weight: 8.247073798 }
                    },
                    {
                        data: { id: 'ADO_FOXP4', source: 'ADO', target: 'BPTF', interaction: "pd", edge_weight: 8.723632296 }
                    },
                    {
                        data: { id: 'ADO_ZNF35', source: 'ADO', target: 'ZNF35', interaction: "pd", edge_weight: 8.122387456 }
                    },
                    {
                        data: { id: 'ADO_LSM8', source: 'ADO', target: 'LSM8', interaction: "pd", edge_weight: 7.779290904 }
                    },
                    {
                        data: { id: 'ADO_LRRC40', source: 'ADO', target: 'LRRC40', interaction: "pd", edge_weight: 8.247073798 }
                    },
                    {
                        data: { id: 'ADO_FUBP1', source: 'ADO', target: 'FUBP1', interaction: "pd", edge_weight: 8.247073798 }
                    },
                    {
                        data: { id: 'ADO_ZNHIT6', source: 'ADO', target: 'ZNHIT6', interaction: "pd", edge_weight: 8.247073798 }
                    },

                ]
            },

            style: [ // the stylesheet for the graph
                {
                    selector: 'node',
                    style: {
                        'background-color': (ele) => {
                            return ele.data("interaction") === "pd" ? "#1DA1F2" : "#D94A4A";
                        },
                        'label': 'data(id)',
                        'shape': 'diamond',
                        'text-wrap': 'wrap',
                        'text-halign': 'center',
                        'text-valign': 'center',
                        'height': 100,
                        'width': 100,
                        'border-color': '#000',
                        'border-width': 3,
                        'border-opacity': 0.8,
                        'color': 'white',
                        'font-weight': 'bold',

                    }
                },

                {
                    selector: 'edge',
                    style: {
                        'width': 'mapData(edge_weight, 7, 10, 1, 7)',
                        'line-color': "black",
                        'line-opacity': 0.5,
                        // 'curve-style': 'bezier'
                    }
                },
            ],
            layout:
            {
                name: 'cose',
            }
        });
    }

}