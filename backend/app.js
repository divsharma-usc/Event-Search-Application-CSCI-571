const express = require('express')
const cors = require('cors')
const axios = require('axios');
const geohash = require('ngeohash');
var SpotifyWebApi = require('spotify-web-api-node');
const { json } = require('express');
var request = require('request');
const port = 3000;
var bodyParser = require('body-parser')
var app = express()

const PORT = process.env.PORT || 8080;

const CLIENT_ID = '';
const CLIENT_SECRET = '';

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }))

// parse application/json
app.use(bodyParser.json())

const REMOTE_API_URI = "https://app.ticketmaster.com/discovery/v2";
const REMOTE_API_KEY = "";
const UNDEFINED = "undefined";
const REMOTE_API_PAGE_SIZE = 20;

var spotifyApi = new SpotifyWebApi({
    clientId: CLIENT_ID,
    clientSecret: CLIENT_SECRET,
    redirectUri: 'http://mysite.com/callback/'
});

app.use(cors());

/****** API TO GIVE SUGGESTIONS *******/
app.get('/suggest', (req, res) => {
    const keyword = req.query["keyword"];
    const remote_api_url = REMOTE_API_URI + "/suggest?apikey=" + REMOTE_API_KEY + "&keyword=" + keyword;
    
    axios.get(remote_api_url)
    .then(function(response){
        response_data = response.data;
        events = response_data['_embedded']['attractions'].map((event) => { return event['name']});
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

    var segment_id = req.query["segment"];
    const radius = req.query["radius"];
    const keyword = req.query["keyword"];
    const geo_point = req.query["geoPoint"];

    var remote_api_url = REMOTE_API_URI + "/events.json?apikey=" + REMOTE_API_KEY;

    var response_to_send = []

    segment_id = segment_id.toLowerCase().trim();
  
    if(segment_id != undefined && segment_id.length > 0 && segment_to_segment_id[segment_id] != undefined){
        remote_api_url = remote_api_url + "&segmentId=" + segment_to_segment_id[segment_id];
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
            }catch(error){console.log(error);}

            try{
                local_date = event['dates']['start']['localDate'];
                var local_dates = local_date.split("-");
                local_date = local_dates.join("/");
            }catch(error){console.log(error);}
        
            try{
                local_time = event['dates']['start']['localTime'];
                var time_array = local_time.split(":");
                var hours = parseFloat(time_array[0]);
                if(hours < 12){
                    local_time = hours + ":" + time_array[1] + " AM";
                }else{
                    local_time = (hours%12) + ":" + time_array[1] + " PM";
                }
            }catch(error){console.log(error);}
            
            try{
                genre_list = event['classifications']
                if(genre_list.length > 0)
                    genre = genre_list[0]['segment']['name'];
            }catch(error){console.log(error);}

            try{
                venue_list = event['_embedded']['venues']
                if(venue_list.length > 0)
                    venue = venue_list[0]['name'];
            }catch(error){console.log(error);}
           
            try{
                image_url = event['images'][0]['url'];
            }catch(error){console.log(error);}
            
            try{
                name = event['name'];
            }catch(error){console.log(error);}

            if(local_date !=  undefined && local_date.toLowerCase() == UNDEFINED)
                local_date = "";

            if(local_time != undefined && local_time.toLowerCase() == UNDEFINED)
                local_time = "";

            if(genre != undefined && genre.toLowerCase() == UNDEFINED)
                genre = "";

            if(venue != undefined && venue.toLowerCase() == UNDEFINED)
                venue = "";

            if(name != undefined && name.toLowerCase() == UNDEFINED)
                name = "";

            if(name != undefined && image_url.toLowerCase() == UNDEFINED)
                image_url = "";

            if(event_id != undefined && event_id.toLowerCase() != UNDEFINED && event_id.length > 0){
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

        response_to_send.sort(function(x, y){
            x_timestamp = x.localDate;
            if(x.localTime != undefined && x.localTime.length>0){
                x_timestamp = x_timestamp + 'T' + x.localTime
            }

            y_timestamp = y.localDate;
            if(y.localTime != undefined && y.localTime.length>0){
                y_timestamp = y_timestamp + 'T' + y.localTime
            }

            return Date.parse(x_timestamp) - Date.parse(y_timestamp);
        })
        
        res.send(response_to_send);
    })
    .catch(function(error){
        console.log(error);
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
                        genres += classification['segment']['name'] + ' | ';
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
            }else{
                var time_array = local_time.split(":");
                var hours = parseFloat(time_array[0]);
                if(hours < 12){
                    local_time = hours + ":" + time_array[1] + " AM";
                }else{
                    local_time = (hours%12) + ":" + time_array[1] + " PM";
                }
            }
        } catch (err) {}
    
        try {
            local_date = response['dates']['start']['localDate'];
            if (local_date.toLowerCase() === UNDEFINED) {
                local_date = "";
            }else{
                var local_dates = local_date.split("-");
                var month = parseFloat(local_date[1]);
                if(month==1){
                    local_date = 'Jan';
                }else if(month==2){
                    local_date = 'Feb';
                }else if(month==3){
                    local_date = 'Mar';
                }else if(month==4){
                    local_date = 'Apr';
                }else if(month==5){
                    local_date = 'May';
                }else if(month==6){
                    local_date = 'Jun';
                }else if(month==7){
                    local_date = 'Jul';
                }else if(month==8){
                    local_date = 'Aug';
                }else if(month==9){
                    local_date = 'Sep';
                }else if(month==10){
                    local_date = 'Oct';
                }else if(month=11){
                    local_date = 'Nov';
                }else{
                    local_date = 'Dec';
                }
                local_date = local_date + " " + local_dates[2] + ", " + local_dates[0]
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
            price = price + " (" + currency + ")";
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
            'eventTime': local_time,
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


/*******  API TO GET Artists EVENTS  *********/
app.post('/spotify', (req, res) => {
    var artists = req.body['artists'];
    artists = artists.split("|");
   
    var client_id = CLIENT_ID;
    var client_secret = CLIENT_SECRET;
    var token = '';

    var authOptions = {
        url: 'https://accounts.spotify.com/api/token',
        headers: {
            'Authorization': 'Basic ' + (new Buffer(client_id + ':' + client_secret).toString('base64'))
        },
        form: {
            grant_type: 'client_credentials'
        },
        json: true
    };

    response_body = [];
    request.post(authOptions, async function(error, response, body) {
        if (!error && response.statusCode === 200) {
            token = body.access_token;

            if(token == undefined || token.length == 0){
                res.send({
                    "status": 500,
                    "message": "Internal Server Error"
                });
            }

            spotifyApi.setAccessToken(token);

            for(var index in artists){

                var artist = artists[index];

                await spotifyApi.searchArtists(artist)
                    .then(async function(data) {
                        try{
                            const art = data.body.artists.items[0];
                            if(art.name.trim().toLocaleLowerCase()==artists[index].trim().toLocaleLowerCase()){
                                await spotifyApi.getArtistAlbums(art.id, { limit: 3, offset: 0}).then(
                                    function(data) {     
                                        var albumImages;
                                        var albums;
                                        var artistImage;
                                        var followers;
                                        var spotifyLink;

                                        try{ 
                                            albums = data.body.items; 
                                            albumImages = albums.map(item => item.images[0]);
                                        }catch(err){}

                                        try{
                                            artistImage = art.images[0].url;
                                        }catch(err){}

                                        try{
                                            followers = art.followers.total;
                                        }catch(err){}

                                        try{
                                            spotifyLink = art.external_urls.spotify;
                                        }catch(err){}

                                        response_body.push({
                                            "name": art.name,
                                            "popularity": art.popularity,
                                            "followers": followers,
                                            "spotifyLink": spotifyLink,
                                            "artistImage": artistImage,
                                            "albumImages": albumImages
                                        });

                                    },
                                    function(err) {
                                        console.error(err);
                                    }
                                );
                            }
                        }catch(err){}
                    }, function(err) {
                        console.error(err);
                    }
                );
            }
            res.send(response_body);
        }
    });

});



/*******  API TO GET Venue Details  *********/
app.get('/venue', (req, res) => {
    var venue = req.query['venue'];
    const remote_api_url = REMOTE_API_URI + "/venues?apikey=" + REMOTE_API_KEY + "&keyword=" + venue;
    
    axios.get(remote_api_url)
    .then(function(response){
        response_data = response.data;

        var childRule = undefined;
        var openHours = undefined;
        var phoneNumber = undefined;
        var name = undefined;
        var generalRule = undefined;
        var longitude = undefined;
        var latitude = undefined;
        var address_array = [];

        const venue = response_data['_embedded']['venues'][0]

        try{
            name = venue['name']
        }catch(error){console.log(error)}

        try{
            if(venue['address'] != undefined && venue['address']['line1'] != undefined){
                address_array.push(venue['address']['line1']);
            }
        }catch(error){console.log(error)}

        try{
            if(venue['city'] != undefined && venue['city']['name'] != undefined){
                address_array.push(venue['city']['name']);
            }
        }catch(error){console.log(error)}

        try{
            if(venue['state'] != undefined && venue['state']['stateCode'] != undefined){
                address_array.push(venue['state']['stateCode']);
            }
        }catch(error){console.log(error)}

        const address = address_array.join(', ');
    
        try{
            phoneNumber = venue['boxOfficeInfo']['phoneNumberDetail'];
        }catch(error){console.log(error)}

        try{
            openHours = venue['boxOfficeInfo']['openHoursDetail'];
        }catch(error){console.log(error)}
        try{
            childRule = venue['generalInfo']['childRule'];
        }catch(error){console.log(error)}
        try{
            generalRule = venue['generalInfo']['generalRule'];
        }catch(error){console.log(error)}
        try{
            longitude = venue['location']['longitude'];
        }catch(error){console.log(error)}
        try{
            latitude = venue['location']['latitude'];
        }catch(error){console.log(error)}


        let response_to_send = {
            'name': name,
            'address': address,
            'phoneNumber': phoneNumber,
            'openHours': openHours,
            'generalRule': generalRule,
            'childRule': childRule,
            'longitude': longitude,
            'latitude': latitude
        };

        res.send(response_to_send);
    }).catch(function(error){
        console.log(error)
        res.send({
            "status": 500,
            "message": "Internal Server Error"
        });
    });
    
});




app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}`)
});
