const express = require('express')
const cors = require('cors')
const axios = require('axios');
const geohash = require('ngeohash');
const app = express();
const port = 3000;

const REMOTE_API_URI = "https://app.ticketmaster.com/discovery/v2";
const REMOTE_API_KEY = "Swp5VSdz4nQJk5B9NoeMAMG7r8jMviKo";
const UNDEFINED = "undefined";
const REMOTE_API_PAGE_SIZE = 20;

app.use(cors());

/****** API TO GIVE SUGGESTIONS *******/
app.get('/suggest', (req, res) => {
    const keyword = req.query["keyword"];
    const remote_api_url = REMOTE_API_URI + "/suggest?apikey=" + REMOTE_API_KEY + "&keyword=" + keyword;
    
    axios.get(remote_api_url)
    .then(function(response){
        response_data = response.data;
        events = response_data['_embedded']['events'].map((event) => { return event['name']});
        const response_to_send = {
            "events": events
        };
        res.send(response_to_send);
    }).catch(function(error){
        res.send({
            "status": 500,
            "message": "Internal Server Error"
        });
    });
    
});

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

    const segment_id = req.query["segment"];
    const radius = req.query["radius"];
    const keyword = req.query["keyword"];
    const geo_point = req.query["geoPoint"];

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

        res.send(response_to_send);
    })
    .catch(function(error){
        res.send({
            "status": 500,
            "message": "Internal Server Error"
        });
    });
});

/*******  API TO SEARCH EVENTS  *********/
app.get('/events/:eventId', (req, res) => {
    const event_id = req.params.eventId;
    const remote_api_url = REMOTE_API_URI + '/events/' + event_id + '.json?size=' + REMOTE_API_PAGE_SIZE + '&apikey=' + REMOTE_API_KEY;

    axios.get(remote_api_url)
    .then(function(response){
       
        var attractions = '';
        var genres = '';    

        response = response.data;
        try {
            for (let attraction of response['_embedded']['attractions']) {
                if (attraction['name'].toLowerCase() !== UNDEFINED && attraction['name'].length > 0) {
                    attractions += attraction['name'] + ' | '
                }
            }

            if(attractions.length>0){
                attractions = attractions.substring(0, attractions.length-3);
            }

        } catch (err) {}

        

        if ('classifications' in response) {
            for (let classification of response['classifications']) {
                try {
                    if (classification['segment']['name'] && classification['segment']['name'].toLowerCase() !== UNDEFINED) {
                        genre += classification['segment']['name'] + ' | ';
                    }
                } catch (err) {}
    
                try {
                    if (classification['genre']['name'] && classification['genre']['name'].toLowerCase() !== UNDEFINED) {
                        genres += classification['genre']['name'] + ' | ';
                    }
                } catch (err) {}
    
                try {
                    if (classification['subGenre']['name'] && classification['subGenre']['name'].toLowerCase() !== UNDEFINED) {
                        genres +=  classification['subGenre']['name'] + ' | ';
                    }
                } catch (err) {}
    
                try {
                    if (classification['type']['name'] && classification['type']['name'].toLowerCase() !== UNDEFINED) {
                        genres += classification['type']['name'] + ' | ';
                    }
                } catch (err) {}
    
                try {
                    if (classification['subType']['name'] && classification['subType']['name'].toLowerCase() !== UNDEFINED) {
                        genres += classification['subType']['name'] + ' | ';
                    }
                } catch (err) {}
    
                break;
            }

            if(genres.length>0){
                genres = genres.substring(0, genres.length-3);
            }

        }

        let standard_price = {};

        try {

            let standard_price_list = response['priceRanges'];
            
            if (standard_price_list.length > 0) {
                standard_price = standard_price_list[0];
            }

        } catch (err) {}

        console.log(response)
        console.log(standard_price)
    
        let local_date = '';
        let local_time = '';
        let date = '';
        let ticket_status = '';
        let seat_map_url = '';
        let name = '';
    
        try {
            name = response['name'];
            if (name.toLowerCase() === UNDEFINED) {
                name = "";
            }
        } catch (err) {}
    
        try {
            local_time = response['dates']['start']['localTime'];
            if (local_time.toLowerCase() === UNDEFINED) {
                local_time = "";
            }
        } catch (err) {}
    
        try {
            local_date = response['dates']['start']['localDate'];
            if (local_date.toLowerCase() === UNDEFINED) {
                local_date = "";
            }
        } catch (err) {}
    
        try {
            ticket_status = response['dates']['status']['code'];
            if (ticket_status.toLowerCase() === UNDEFINED) {
                ticket_status = "";
            }
        } catch (err) {}
    
        try {
            seat_map_url = response['seatmap']['staticUrl'];
            if (seat_map_url.toLowerCase() === UNDEFINED) {
                seat_map_url = "";
            }
        } catch (err) {}

        let min_price = String(standard_price['min'] || "");

        if (min_price.toLowerCase() === UNDEFINED) {
            min_price = "";
        }

        let max_price = String(standard_price['max'] || "");

        if (max_price.toLowerCase() === UNDEFINED) {
            max_price = "";
        }

        let currency = standard_price['currency'] || "";
        if (currency.toLowerCase() === UNDEFINED) {
            currency = "";
        }

        let price = '';

        if (min_price === "" && max_price !== "") {
            price = max_price + ' - ' + max_price;
        } else if (min_price !== "" && max_price === "") {
            price = min_price + ' - ' + min_price;
        } else if (min_price !== "" && max_price !== "") {
            price = min_price + ' - ' + max_price;
        }

        if (currency !== "" && price !== "") {
            price = price + " " + currency;
        }

        if (local_date !== "") {
            date += local_date;
        }

        let buy_ticket_at = response['url'] || "";

        if (buy_ticket_at.toLowerCase() === UNDEFINED) {
            buy_ticket_at = "";
        }

        venueName = null;
        try{
            let venues = response['_embedded']['venues'];
            if(venues.length > 0 && venues[0]['name'].toLowerCase() != UNDEFINED){
                venueName = venues[0]['name'];
            }
        }catch(error){}

        let response_to_send = {
            'name': name,
            'eventDate': date,
            'artistOrTeam': attractions,
            'genres': genres,
            'priceRange': price,
            'ticketStatus': ticket_status,
            'buyTicketAt': buy_ticket_at,
            'seatMap': seat_map_url,
            'venueName': venueName
        };

        res.send(response_to_send);
    }).catch(function(error){
        res.send("GOT ERROR");
    });

});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
});