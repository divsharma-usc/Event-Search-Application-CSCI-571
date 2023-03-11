import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { debounceTime, tap, switchMap, finalize, distinctUntilChanged, filter } from 'rxjs/operators';

interface EventInformation {
  id: string;
	date: string;
  time: string;
	imageSrc: string;
	name: string;
  genre: string;
  venue: string;
}

interface EventDetails{
  eventName: string;
  eventDate: string;
  priceRange: string;
  artistOrTeam: string;
  venueName: string;
  genres: string;
  ticketStatus: string;
  buyTicketAt: string;
}

@Component({
    selector: 'event-search',
    templateUrl: './event-search.component.html',
    styleUrls: ['./event-search.component.css']
})

export class EventSearchComponent implements OnInit{

  segments: string[] = ['Default', 'Music', 'Sports', 'Arts & Theatre', 'Film', 'Miscellaneous'];
  default: string = 'Default';

  searchEventsForm = new FormGroup({
      keyword: new FormControl('', [Validators.required]),
      distance: new FormControl(10),
      location: new FormControl(null, [Validators.required]),
      segment: new FormControl(''),
      autoDetection: new FormControl(false)
  });

  filteredEvents: any;
  isLoading = false;
  errorMsg!: string;
  minLengthTerm = 2;
  selectedEvent: any = "";
  defaultSegment: any = "Default";
  eventsInformation: EventInformation[] = [];
  showTable: boolean = false;
  showDetails: boolean = false;
  eventDetails: any;

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
    this.showTable = false;
    this.selectedEvent = '';
    this.filteredEvents = [];
    this.searchEventsForm.reset();
    this.searchEventsForm.patchValue({'keyword' : ''});
    this.searchEventsForm.controls['segment'].setValue(this.defaultSegment, {onlySelf: true});
  }

  //function to submit form
  submitSearchForm(){

    //Check form Validity
    const keywordInput = (<HTMLInputElement>document.getElementById("keywordID"));
    const keywordValidityState = keywordInput.validity;

    if (keywordValidityState.valueMissing) {
      keywordInput.reportValidity();
      return
    }

    const locationInput = (<HTMLInputElement>document.getElementById("locationID"));
    const autoDetectInput = (<HTMLInputElement>document.getElementById("autoDetectID"));

    const locationValidityState = locationInput.validity;
    const autoDetectValue = autoDetectInput.checked;

    if(locationValidityState.valueMissing &&  !autoDetectValue){
      locationInput.reportValidity();
      return
    }

    if(autoDetectValue){
      const ipInfoUrl = "https://ipinfo.io/json?token=92e4bc4d0d35b9";
      this.http.get(ipInfoUrl)
      .subscribe((data: any) => {
          this.populateEventInformationTable(data.loc)
      });      
    }else{
      const location = this.searchEventsForm.get('location')?.value;
      const googleMapUrl = "https://maps.googleapis.com/maps/api/geocode/json?address="+ location +"&key=AIzaSyBaoCSxxIZsLw1C_Wxn7foPJaU7GtnhdDk";
      this.http.get(googleMapUrl)
      .subscribe((data: any) => {
          this.populateEventInformationTable(data.results[0].geometry.location.lat + ',' + data.results[0].geometry.location.lng);
      });
    }
  }

  populateEventInformationTable(geolocation: any){

    const keyword = this.searchEventsForm.get('keyword')?.value;
    const location = this.searchEventsForm.get('location')?.value;
    const segment = this.searchEventsForm.get('segment')?.value;
    const distance = this.searchEventsForm.get('distance')?.value;

    var url = 'https://proven-entropy-376123.wl.r.appspot.com/events?' + 'keyword=' + keyword + '&radius=' + distance + '&segment=' + segment + '&geoPoint=' + geolocation

    this.http.get(url)
    .subscribe((data: any)=>{
      console.log(data)
        this.eventsInformation = [];
        data.forEach((element: any) => {
          this.eventsInformation.push({
            id: element.id,
            date: element.localDate,
            time: element.localTime,
            imageSrc: element.image_url,
            name: element.name,
            genre: element.genre,
            venue: element.venue
          } as EventInformation);
          this.showTable = true;
        });
    });
  }

  showEventDetails(id: string){
    console.log(id);
    var url = 'https://localhost:3000/events/' + id;

    this.http.get(url)
    .subscribe((data: any) => {
      console.log(data)

      this.eventDetails = {
        eventName: data.name,
        eventDate: data.eventDate,
        priceRange: data.priceRange,
        artistOrTeam: data.artistOrTeam,
        venueName: data.venueName,
        genres: data.genres,
        ticketStatus: data.ticketStatus,
        buyTicketAt: data.buyTicketAt
      } as EventDetails;

      this.showTable = false;
      this.showDetails = true;
    });

  }

  back(){
    this.showDetails = false;
    this.showTable = true;
  }
}