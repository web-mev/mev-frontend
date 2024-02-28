import { Component, ChangeDetectionStrategy, Input, OnInit, ViewChild, ElementRef, HostListener } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError } from "rxjs/operators";
import { environment } from '@environments/environment';
import * as d3 from 'd3';
import d3Tip from 'd3-tip';
import { NotificationService } from '@core/core.module';
import html2canvas from 'html2canvas';
import { forkJoin } from 'rxjs';
import { BaseSpatialgeComponent } from '../base-spatialge/base-spatialge.component'

interface ScatterData {
    xValue: number;
    yValue: number;
    totalCounts: number;
}

@Component({
    selector: 'mev-spatialge-normalization',
    templateUrl: './spatialge-normalization.component.html',
    styleUrls: ['./spatialge-normalization.component.scss'],
    changeDetection: ChangeDetectionStrategy.Default
})
export class SpatialGENormalizationComponent extends BaseSpatialgeComponent implements OnInit {

    ngOnInit(): void {
        this.getDataNormalization()
        console.log("minimap: ", this.plotWidth, this.plotHeight)

        // this.selectionRectStyle = {
        //     // left: `${0}px`,
        //     top: `${0}px`,
        //     width: `${this.plotWidth/4}px` ,
        //     height: `${this.plotHeight/4}px`,
        //     border: '2px solid #1DA1F2',
        //     position: 'absolute',
        //     // pointerEvents: 'none'
        // };

        // console.log("rect: ", this.selectionRectStyle)
    }

    // boxZoom = false;
    // boxZoomLeftVal = '-10';
    // boxZoomTopVal = '50';
    // boxZoomContainerWidth = '200';
    // boxZoomContainerHeight = '300';
    // boxZoomLevel = 1


    // constructor(
    //     httpClient: HttpClient,
    //     notificationService: NotificationService,
    //     private elementRef: ElementRef
    // ) {
    //     // Pass the required arguments to the superclass constructor
    //     super(httpClient, notificationService);
    // }

    // isSelecting = false;
    // startX = 0;
    // startY = 0;
    // endX = 0;
    // endY = 0;
    // selectionRectStyle = {};

    // resetVariables(): void {
    //     this.startX = 0;
    //     this.startY = 0;
    //     this.endX = 0;
    //     this.endY = 0;
    // }

    // onMouseDown(event: MouseEvent) {
    //     this.resetVariables();

    //     this.isSelecting = true;
    //     this.startX = event.clientX;
    //     this.startY = event.clientY;
    //     this.selectionRectStyle = {};
    //     console.log("mouse down: ", event.clientX, event.clientY)

    //     // Attach the mousemove event listener when mouse button is pressed down
    //     document.addEventListener('mousemove', this.onMouseMove);
    // }

    // @HostListener('document:mouseup')
    // onMouseUp(event: MouseEvent) {
    //     if (this.isSelecting) {
    //         this.isSelecting = false;
    //         // Remove the mousemove event listener when mouse button is released
    //         document.removeEventListener('mousemove', this.onMouseMove);
    //     }
    // }

    // // Define the mousemove event listener separately
    // onMouseMove = (event: MouseEvent) => {
    //     if (this.isSelecting) {
    //         this.endX = event.clientX;
    //         this.endY = event.clientY;
    //         const left = Math.min(this.startX, this.endX) - this.plotWidth - this.legendWidth;
    //         const top = Math.min(this.startY, this.endY) - 189;
    //         console.log("top: ", top, this.startY, this.endY)
    //         const width = Math.abs(this.endX - this.startX);
    //         const height = Math.abs(this.endY - this.startY);
    //         this.selectionRectStyle = {
    //             left: `${left}px`,
    //             top: `${top}px`,
    //             width: `${width}px`,
    //             height: `${height}px`,
    //             border: '2px solid #1DA1F2',
    //             position: 'absolute',
    //             pointerEvents: 'none'
    //         };
    //     }
    // };

    setBoxZoom(){

    }
}