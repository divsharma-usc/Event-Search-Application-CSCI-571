import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { debounceTime, tap, switchMap, finalize, distinctUntilChanged, filter } from 'rxjs/operators';

@Component({
    selector: 'event-search',
    templateUrl: './event-search.component.html',
    styleUrls: ['./event-search.component.css']
})
export class EventSearchComponent implements OnInit{

  segments: string[] = ['Default', 'Music', 'Sports', 'Arts & Theatre', 'Film', 'Miscellaneous'];
  default: string = 'Default';

  searchEventsForm = new FormGroup({
      keyword: new FormControl(''),
      distance: new FormControl(10),
      location: new FormControl(null),
      segment: new FormControl('')
  });

  filteredEvents: any;
  isLoading = false;
  errorMsg!: string;
  minLengthTerm = 2;
  selectedEvent: any = "";
  defaultSegment: any = "Default";

  constructor(
    private http: HttpClient
  ) { 
    this.searchEventsForm.controls['segment'].setValue(this.defaultSegment, {onlySelf: true});
  }


  onSelected() {
    this.searchEventsForm.patchValue({'keyword' : this.selectedEvent});
  }

  displayWith(value: any) {
    return value?.Title;
  }

  clearSelection() {
    this.selectedEvent = "";
    this.filteredEvents = [];
  }

  ngOnInit() {


    this.searchEventsForm.get('keyword')?.valueChanges
      .pipe(
        filter(res => {
          return res !== null && res.length >= this.minLengthTerm
        }),
        distinctUntilChanged(),
        debounceTime(1000),
        tap(() => {
          this.errorMsg = "";
          this.filteredEvents = [];
          this.isLoading = true;
        }),
        switchMap(value => this.http.get('http://localhost:3000/suggest?keyword=' + value)
          .pipe(
            finalize(() => {
              this.isLoading = false
            }),
          )
        )
      )
      .subscribe((data: any) => {
        if (data['events'] == undefined) {
          this.errorMsg = data['Error'];
          this.filteredEvents = [];
        } else {
          this.errorMsg = "";
          this.filteredEvents = data['events'];
        }
      });
  }


  //function to clear search
  clearSearchForm() {
    this.searchEventsForm.reset();
    this.searchEventsForm.controls['segment'].setValue(this.defaultSegment, {onlySelf: true});
  }
}