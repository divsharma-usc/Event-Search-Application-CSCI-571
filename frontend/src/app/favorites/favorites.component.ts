import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'favorites',
  templateUrl: './favorites.component.html',
  styleUrls: ['./favorites.component.css']
})
export class FavoritesComponent implements OnInit{
  favorites: any = [];
  displayedColumns: string[] = ['#', 'date', 'name', 'category', 'venue', 'favorite'];


  ngOnInit() {
    var data: any = localStorage.getItem("favorites");
    data = JSON.parse(data);
    for(let key in data){
      var fav_to_enter = data[key]
      fav_to_enter['id'] = key
      this.favorites.push(fav_to_enter);
    }
  }

  deleteFav(id: any){
    console.log(id)
    var data: any = localStorage.getItem("favorites");
    data = JSON.parse(data);
    delete data[id];
    this.favorites = []
    localStorage.setItem("favorites", JSON.stringify(data));
    for(let key in data){
      var fav_to_enter = data[key]
      fav_to_enter['id'] = key
      this.favorites.push(fav_to_enter);
    }
  }
}
