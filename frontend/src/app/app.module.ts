import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';

// Material Modules
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTableModule } from '@angular/material/table';
import { GoogleMapsModule } from '@angular/google-maps'
import { NgbCarouselConfig, NgbCarouselModule } from '@ng-bootstrap/ng-bootstrap';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { FavoritesComponent } from './favorites/favorites.component';
import { EventSearchComponent } from './event-search/event-search.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { GmapComponent } from './gmap/gmap.component';
import { NgCircleProgressModule } from 'ng-circle-progress';

@NgModule({
  declarations: [
    AppComponent,
    FavoritesComponent,
    EventSearchComponent,
    GmapComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    NgbModule,
    ReactiveFormsModule,
    BrowserAnimationsModule,
    HttpClientModule,
    MatInputModule,
    MatIconModule,
    MatButtonModule,
    MatAutocompleteModule,
    MatProgressSpinnerModule,
    MatTabsModule,
    MatTableModule,
    GoogleMapsModule,
    NgbCarouselModule,
    NgCircleProgressModule.forRoot({
      radius: 25,
      outerStrokeWidth: 8,
      innerStrokeColor: "#c20030",
      animationDuration: 300,
      showSubtitle: false,
      units: '',
      titleColor: '#FFFFFF',
      showInnerStroke: false,
      titleFontSize: '14',
      outerStrokeColor: '#c20030'
    })
  ],
  providers: [GmapComponent,
    NgbCarouselConfig],
  bootstrap: [AppComponent]
})
export class AppModule { }
