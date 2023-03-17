import { Component, Input, SimpleChange } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { NgbDayTemplateData } from '@ng-bootstrap/ng-bootstrap/datepicker/datepicker-view-model';

@Component({
  selector: 'app-gmap',
  templateUrl: './gmap.component.html',
  styleUrls: ['./gmap.component.css']
})
export class GmapComponent {
  @Input() mapOptions: any;
  @Input() marker: any;


	constructor(public activeModal: NgbActiveModal) {
  }

}
