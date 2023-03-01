const express = require('express')
const cors = require('cors')
const axios = require('axios');
const geohash = require('ngeohash');
const app = express();
const port = 3000;

const REMOTE_API_URI = 'https://app.ticketmaster.com/discovery/v2';
const REMOTE_API_KEY = 'Swp5VSdz4nQJk5B9NoeMAMG7r8jMviKo';
const UNDEFINED = "undefined";
const REMOTE_API_PAGE_SIZE = 20;

app.use(cors());

/*******  API TO SEARCH EVENTS  *********/
app.get('/events', (req, res) => {

    const segment_to_segment_id = {
        "music": "KZFzniwnSyZfZ7v7nJ",
        "sports": "KZFzniwnSyZfZ7v7nE",
        "arts": "KZFzniwnSyZfZ7v7na",
        "theatre": "KZFzniwnSyZfZ7v7na",
        "film": "KZFzniwnSyZfZ7v7nn",
        "miscellaneous": "KZFzniwnSyZfZ7v7n1"
    };

    const segment_id = req.params["segment"];
    const radius = req.params["radius"];
    const keyword = req.params["keyword"];
    const geo_point = req.params["geoPoint"];

    var remote_api_url = REMOTE_API_URI + "/events.json?apikey=" + REMOTE_API_KEY;

    var response_to_send = []

    if(segment_id != undefined && segment_id.length > 0){
        remote_api_url += "&segmentId=" + segment_to_segment_id[segment_id];
    }

    if(radius != undefined && radius.length > 0){
        remote_api_url += "&radius=" + radius;
        remote_api_url += "&unit=miles";
    }

    if(keyword != undefined && keyword.length > 0){
        remote_api_url += "&keyword=" + keyword;
    }

    if(geo_point != undefined && geo_point.length > 0){
        lat_long = geo_point.split(",");
        remote_api_url += "&geoPoint=" + geohash.encode(lat_long[0], lat_long[1])
    }

    axios.get(remote_api_url)
    .then(function(response){
        const events = response.data["_embedded"]["events"];
        for(var index = 0; index < events.length; index++){
            const event = events[index];
            var local_date = "";
            var local_time = "";
            var genre = "";
            var venue = "";
            var name = "";
            var event_id = "";
            var image_url = "";

            try{
                event_id = event['id'];
            }catch(error){}

            try{
                local_date = event['dates']['start']['localDate'];
            }catch(error){}
        
            try{
                local_time = event['dates']['start']['localTime'];
            }catch(error){}
            
            try{
                genre_list = event['classifications']
                if(genre_list.length > 0)
                    genre = genre_list[0]['segment']['name'];
            }catch(error){}
      

            try{
                venue_list = event['_embedded']['venues']
                if(venue_list.length > 0)
                    venue = venue_list[0]['name'];
            }catch(error){}
           
            try{
                image_url = event['images'][0]['url'];
            }catch(error){}
            
            try{
                name = event['name'];
            }catch(error){}

            if(local_date.toLowerCase() == UNDEFINED)
                local_date = "";

            if(local_time.toLowerCase() == UNDEFINED)
                local_time = "";

            if(genre.toLowerCase() == UNDEFINED)
                genre = "";

            if(venue.toLowerCase() == UNDEFINED)
                venue = "";

            if(name.toLowerCase() == UNDEFINED)
                name = "";

            if(image_url.toLowerCase() == UNDEFINED)
                image_url = "";

            if(event_id.toLowerCase() != UNDEFINED && event_id.length > 0){
                response_to_send.push({
                    'id': event_id,
                    'localDate': local_date,
                    'localTime': local_time,
                    'genre': genre,
                    'venue': venue,
                    'name': name,
                    'image_url': image_url
                });
            }
        }

        res.send(res.json(response_to_send));
    })
    .catch(function(error){
        console.log(error)
        res.send(res.json({
                "status": 500,
                "message": "Internal Server Error"
            }));
    });
});

/*******  API TO SEARCH EVENTS  *********/
app.get('/events/:eventId', (req, res) => {
    const event_id = req.params.eventId;
    const remote_api_url = REMOTE_API_URI + '/events/' + event_id + '.json?size=' + REMOTE_API_PAGE_SIZE + '&apikey=' + REMOTE_API_KEY;

    axios.get(remote_api_url)
    .then(function(response){
        res.send("GOT RESPONSE");
    }).catch(function(error){
        res.send("GOT ERROR");
    });

});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
});