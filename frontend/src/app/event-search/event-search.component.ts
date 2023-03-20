import { Component, ViewChild, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { debounceTime, tap, switchMap, finalize, distinctUntilChanged, filter } from 'rxjs/operators';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { GmapComponent } from '../gmap/gmap.component';
import { NgbCarouselConfig, NgbCarousel } from '@ng-bootstrap/ng-bootstrap';

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
  venue: string;
  genres: string;
  ticketStatus: string;
  buyTicketAt: string;
  seatMap: string;
  id: string;
}

interface VenueDetails{
  name: string;
  address: string;
  phoneNumber: string;
  openHours: string;
  generalRule: string;
  childRule: string;
}

@Component({
    selector: 'event-search',
    templateUrl: './event-search.component.html',
    styleUrls: ['./event-search.component.css']
})

export class EventSearchComponent implements OnInit{

  remoteHost: string = "https://backend-dot-proven-entropy-376123.wl.r.appspot.com/";
  //remoteHost: string = "http://localhost:8080/";
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
  venueDetails: any;
  readMoreChildRule: boolean = true;
  readMoreGeneralRule: boolean = true;
  readMoreOpenHours: boolean = true;
  showReadChildRule: boolean = false;
  showReadGeneralRule: boolean = false;
  showOpenHours: boolean = false;
  mapOptions: any;
  marker: any;
  artists: any = [];
  disableLocation: boolean = false;

  constructor(
    private http: HttpClient,
    private modalService: NgbModal
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
        switchMap(value => this.http.get(this.remoteHost + 'suggest?keyword=' + value)
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
    this.showDetails = false;
    this.selectedEvent = '';
    this.filteredEvents = [];
    this.searchEventsForm.reset();
    this.searchEventsForm.patchValue({'keyword' : ''});
    this.searchEventsForm.controls['segment'].setValue(this.defaultSegment, {onlySelf: true});
  }

  toggleDisableLocation(){
    if(this.disableLocation){
      this.searchEventsForm.controls['location'].enable();
    }else{
      this.searchEventsForm.controls['location'].setValue(null, {onlySelf: true});
      this.searchEventsForm.controls['location'].disable();
    }
    this.disableLocation = !this.disableLocation
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
    var  distance = this.searchEventsForm.get('distance')?.value;

    if(distance==null){
      distance=10;
    }

    var url =  this.remoteHost +'events?' + 'keyword=' + keyword + '&radius=' + distance + '&segment=' + segment + '&geoPoint=' + geolocation
    this.http.get(url)
    .subscribe((data: any)=>{
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
    var url = this.remoteHost + 'events/' + id;

    this.http.get(url)
    .subscribe((data: any) => {

      this.eventDetails = {
        eventName: data.name,
        eventDate: data.eventDate,
        priceRange: data.priceRange,
        artistOrTeam: data.artistOrTeam,
        venue: data.venueName,
        genres: data.genres,
        ticketStatus: data.ticketStatus,
        buyTicketAt: data.buyTicketAt,
        seatMap: data.seatMap,
        id: id
      } as EventDetails;

      this.showTable = false;
      this.showDetails = true;


      var venue_url = this.remoteHost + 'venue?venue=' + this.eventDetails.venue;
      this.http.get(venue_url)
      .subscribe((data: any) => {
        this.venueDetails = {
          name: data.name,
          address: data.address,
          phoneNumber: data.phoneNumber,
          openHours: data.openHours,
          generalRule: data.generalRule,
          childRule: data.childRule
        } as VenueDetails;
        this.mapOptions = {
          center: { lat: parseFloat(data.latitude), lng: parseFloat(data.longitude)},
          zoom: 14
        };
        this.marker = { position: { lat: parseFloat(data.latitude), lng: parseFloat(data.longitude)} };
      });


      var artists_url = this.remoteHost + 'spotify';
      this.http.post(artists_url, {"artists": data.artistOrTeam})
      .subscribe((data: any)=>{
        this.artists = data
      });
    });
  }

  back(){
    this.showDetails = false;
    this.showTable = true;
  }

  addOrRemoveFromFavorites(id: any, date: any, genres: any, venue: any, name: any){
    const data: any = localStorage.getItem("favorites");
    let favorites = JSON.parse(data);
    if(favorites && id in favorites){
      delete favorites[id]; 
    }else if(favorites!=undefined || favorites!=null){
        favorites[id] = {
            "date": date,
            "genres": genres,
            "venue": venue,
            "name": name
          };
    }else{
      favorites = {};
      favorites[id] = {
        "date": date,
        "genres": genres,
        "venue": venue,
        "name": name
      };
    }
    localStorage.setItem("favorites", JSON.stringify(favorites));
  }

  isIdInFavorites(id: any){
    const data: any = localStorage.getItem("favorites");
    let favorites = JSON.parse(data);
    if(favorites && id in favorites){
      return true
    }else{
      return false;
    }
  }

  isIdNotInFavorites(id: any){
    const data: any = localStorage.getItem("favorites");
    let favorites = JSON.parse(data);
    if(favorites && id in favorites){
      return false
    }else{
      return true;
    }
  }

  togleReadMoreOpenHours(){
    this.readMoreOpenHours = !this.readMoreOpenHours;
  }
  toggleReadMoreChildRule(){
    this.readMoreChildRule = !this.readMoreChildRule;
  }
  toggleReadMoreGeneralRule(){
    this.readMoreGeneralRule= !this.readMoreGeneralRule;
  }

  open() {
		const modalRef = this.modalService.open(GmapComponent);
		modalRef.componentInstance.mapOptions = this.mapOptions;
    modalRef.componentInstance.marker = this.marker;
	}

  getTwitterURL(text: any, url: any){
    return "https://twitter.com/intent/tweet?source=tweetbutton&url= " + url + "&text=Check " + text + "on Ticketmaster.";
  }

  getFBURL(url: any){
    return "https://www.facebook.com/sharer/sharer.php?u=" + url + ";src=sdkpreparse"
  }
}