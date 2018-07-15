var map;

var viewModel = {
    locations: ko.observableArray(/*[
        { title: 'Park Ave Penthouse', location: { lat: 40.7713024, lng: -73.9632393 } },
        { title: 'Chelsea Loft', location: { lat: 40.7444883, lng: -73.9949465 } },
        { title: 'Union Square Open Floor Plan', location: { lat: 40.7347062, lng: -73.9895759 } },
        { title: 'East Village Hip Studio', location: { lat: 40.7281777, lng: -73.984377 } },
        { title: 'TriBeCa Artsy Bachelor Pad', location: { lat: 40.7195264, lng: -74.0089934 } },
        { title: 'Chinatown Homey Space', location: { lat: 40.7180628, lng: -73.9961237 } }
    ]*/),
    addLocation: function (location) {
        viewModel.locations.push(location)
    }.bind(this),
    removeLocation: function () {
        viewModel.locations.removeAll()
    },
    markers: ko.observableArray(),
    removeMarkers: function () {
        viewModel.markers.removeAll()
    },
    showMarker: function (id) {
        controller.showListing(id)
    }
}
viewModel.locations.push()
ko.applyBindings(viewModel, document.getElementById("locations"))



function initMap() {
    // Constructor creates a new map - only center and zoom are required.
    map = new google.maps.Map(document.getElementById('map'), {
        center: { lat: 40.7413549, lng: -73.9980244 },
        zoom: 13,
        mapTypeControl: false
    });

    controller.addMarkers()

    var input = document.getElementById('pac-input');
    var searchBox = new google.maps.places.SearchBox(input);

    // Bias the SearchBox results towards current map's viewport.
    map.addListener('bounds_changed', function () {
        searchBox.setBounds(map.getBounds());
    });

    // Listen for the event fired when the user selects a prediction and retrieve
    // more details for that place.
    searchBox.addListener('places_changed', function () {
        var places = searchBox.getPlaces();

        if (places.length == 0) {
            return;
        }

        viewModel.removeLocation()
        viewModel.removeMarkers()

        // For each place, get the icon, name and location.
        var bounds = new google.maps.LatLngBounds();
        places.forEach(function (place, i) {
            if (!place.geometry) {
                console.log("Returned place contains no geometry");
                return;
            }
            // Create a marker for each place.
            viewModel.addLocation({
                title: place.name,
                location: place.geometry.location,
                address: place.formatted_address,
                id: i
            });

            controller.addMarkers()

            if (place.geometry.viewport) {
                // Only geocodes have viewport.
                bounds.union(place.geometry.viewport);
            } else {
                bounds.extend(place.geometry.location);
            }
        });
        map.fitBounds(bounds);
    });

}

function showError() {
    alert('something went wrong');
}
var controller = {
    // This function takes in a COLOR, and then creates a new marker
    // icon of that color. The icon will be 21 px wide by 34 high, have an origin
    // of 0, 0 and be anchored at 10, 34).
    makeMarkerIcon: function (markerColor) {
        var markerImage = new google.maps.MarkerImage(
            'http://chart.googleapis.com/chart?chst=d_map_spin&chld=1.15|0|' + markerColor +
            '|40|_|%E2%80%A2',
            new google.maps.Size(21, 34),
            new google.maps.Point(0, 0),
            new google.maps.Point(10, 34),
            new google.maps.Size(21, 34));
        return markerImage;
    },
    addMarkers: function () {
        var largeInfowindow = new google.maps.InfoWindow();
        // Style the markers a bit. This will be our listing marker icon.
        var defaultIcon = controller.makeMarkerIcon('0091ff');
        // Create a "highlighted location" marker color for when the user
        // mouses over the marker.
        var highlightedIcon = controller.makeMarkerIcon('FFFF24');
        // The following group uses the location array to create an array of markers on initialize.
        for (var i = 0; i < viewModel.locations().length; i++) {
            // Get the position from the location array.
            var position = viewModel.locations()[i].location;
            var title = viewModel.locations()[i].title;
            var address = viewModel.locations()[i].address;
            var id = viewModel.locations()[i].id;
            // Create a marker per location, and put into markers array.
            var marker = new google.maps.Marker({
                position: position,
                title: title,
                address: address,
                animation: google.maps.Animation.DROP,
                icon: defaultIcon,
                id: id
            });
            // Push the marker to our array of markers.
            viewModel.markers.push(marker);
            // Create an onclick event to open the large infowindow at each marker.
            marker.addListener('click', function () {
                controller.populateInfoWindow(this, largeInfowindow);
            });
            // Two event listeners - one for mouseover, one for mouseout,
            // to change the colors back and forth.
            marker.addListener('mouseover', function () {
                this.setIcon(highlightedIcon);
            });
            marker.addListener('mouseout', function () {
                this.setIcon(defaultIcon);
            });
        }
        document.getElementById('show-listings').addEventListener('click', controller.showListings);
        document.getElementById('hide-listings').addEventListener('click', controller.hideListings);
    },
    // This function will loop through the markers array and display them all.
    showListings: function () {
        var bounds = new google.maps.LatLngBounds();
        // Extend the boundaries of the map for each marker and display the marker
        for (var i = 0; i < viewModel.markers().length; i++) {
            viewModel.markers()[i].setMap(map);
            bounds.extend(viewModel.markers()[i].position);
        }
        map.fitBounds(bounds);
    },
    showListing: function (id) {
        controller.hideListings()
        var bounds = new google.maps.LatLngBounds();
        // Looks to match the marker based on ID
        //Extend the boundaries of the map for the matched marker
        for (var i = 0; i < viewModel.markers().length; i++) {
            if (viewModel.markers()[i].id === id) {
                viewModel.markers()[i].setMap(map);
                var markerLocation = viewModel.markers()[i].position
                controller.getCityInfo(markerLocation);
                bounds.extend(viewModel.markers()[i].position);
                break;
            }
        }
        map.fitBounds(bounds);
    },
    // This function will loop through the listings and hide them all.
    hideListings: function () {
        for (var i = 0; i < viewModel.markers().length; i++) {
            viewModel.markers()[i].setMap(null);
        }
    },
    // Tries to get the information about a location from a Teleport API, based on the latlon info from google
    getCityInfo: function (markerLocation) {
        //Converts marker location to string, removes the opening and closing brackets
        //and removes the space between in the "lat, lng" string
        markerLocation = markerLocation.toString().slice(1, -1).replace(/\s+/, "")

        url = 'https://api.teleport.org/api/locations/' + markerLocation + '/'
        $.ajax({
            url: url
        }).done(function (data) {

            //if urban area exists
            if (data._embedded["location:nearest-urban-areas"][0] != null) {
                //nearest urban area
                urbanAreaUrl = data._embedded["location:nearest-urban-areas"][0]['_links']["location:nearest-urban-area"]['href'] + 'scores'
                controller.getLocationScores(urbanAreaUrl)

                // if urban area is missing, but nearst city exists
            } else if (data._embedded["location:nearest-cities"][0] != null) {
                //else nearest city
                //console.log(data._embedded["location:nearest-cities"][0]['_links']["location:nearest-city"]['href'])

                // if there is no data available at all
            } else {
                return "no data available for this place"
            }

        }).fail(function () {
            showError()
        })

    },
    //
    getLocationScores: function (urbanAreaUrl) {
        $.ajax({
            url: urbanAreaUrl
        }).done(function (data) {
            controller.populateInfoBox(data)
        }).fail(function () {
            showError()
        })
    },
    populateInfoBox: function (data) {

        $('#info-box__summary').empty()
        $('#info-box__categories').empty()
        width = (window.innerWidth > 0) ? window.innerWidth : screen.width;

        if (width > 1024) {
            $('#info-box').css('display', 'block')
        }

        $('.listingsToggle').append('<input id="show-location-info" type="button" onclick="controller.showLocationInfo()" value="Location info">')
        $('#info-box__summary').append(data.summary)

        for (entry in data.categories) {
            percentage = data.categories[entry].score_out_of_10 * 10
            name = data.categories[entry].name
            color = data.categories[entry].color
            $('#info-box__categories').append('<div class="info-box__categories-entry"><p>' + name + '</p><progress max="100" value=' + percentage + ' id=' + entry + '></progress></div>')
        }

    },
    // This function populates the infowindow when the marker is clicked. We'll only allow
    // one infowindow which will open at the marker that is clicked, and populate based
    // on that markers position.
    populateInfoWindow: function (marker, infowindow) {
        // Check to make sure the infowindow is not already opened on this marker.
        if (infowindow.marker != marker) {
            // Clear the infowindow content to give the streetview time to load.
            infowindow.setContent('');
            infowindow.marker = marker;
            // Make sure the marker property is cleared if the infowindow is closed.
            infowindow.addListener('closeclick', function () {
                infowindow.marker = null;
            });
            var streetViewService = new google.maps.StreetViewService();
            var radius = 50;
            // In case the status is OK, which means the pano was found, compute the
            // position of the streetview image, then calculate the heading, then get a
            // panorama from that and set the options
            function getStreetView(data, status) {
                if (status == google.maps.StreetViewStatus.OK) {
                    var nearStreetViewLocation = data.location.latLng;
                    var heading = google.maps.geometry.spherical.computeHeading(
                        nearStreetViewLocation, marker.position);
                    infowindow.setContent('<div>' + marker.title + '</br>' + marker.address + '</div><div id="pano"></div>');
                    var panoramaOptions = {
                        position: nearStreetViewLocation,
                        pov: {
                            heading: heading,
                            pitch: 30
                        }
                    };
                    var panorama = new google.maps.StreetViewPanorama(
                        document.getElementById('pano'), panoramaOptions);
                } else {
                    infowindow.setContent('<div>' + marker.title + '</div>' +
                        '<div>No Street View Found</div>');
                }
            }
            // Use streetview service to get the closest streetview image within
            // 50 meters of the markers position
            streetViewService.getPanoramaByLocation(marker.position, radius, getStreetView);
            // Open the infowindow on the correct marker.
            infowindow.open(map, marker);
        }
    },
    sidebarToggle: function () {
        if ($(".sidebar").css("display") === "none") {
            width = (window.innerWidth > 0) ? window.innerWidth : screen.width;
            if (width < 1024) {
                if ($('#info-box').css("display") === 'block'){
                    controller.showLocationInfo()
                }
            }

            $(".sidebar").css({ "display": "block" });
            setToggle();
        } else {

            $(".sidebar").css({ "display": "none" });
            setToggle();
        }
    },
    showLocationInfo: function () {
        if ($('#info-box').css("display") === 'none') {

            width = (window.innerWidth > 0) ? window.innerWidth : screen.width;

            if (width < 1024) {
                controller.sidebarToggle()
            }

            $('#info-box').css({ "display": "block" })

        } else {

            $('#info-box').css({ "display": "none" })

        }
    }
}


function setToggle() {
    if ($(".sidebar").css("display") === "block") {
        var sidebarWidth = $(".sidebar").width();
        sidebarWidth = sidebarWidth.toString() + "px";
        $("#sidebar-toggle").css({ "left": sidebarWidth });
    } else {
        $("#sidebar-toggle").css({ "left": "0px" });
    }
}

setToggle();

/*$("#sidebar-toggle").click(() => {
    if ($(".sidebar").css("display") === "none") {
        $(".sidebar").css({ "display": "block" });
        setToggle();
    } else {
        $(".sidebar").css({ "display": "none" });
        setToggle();
    }
});*/

//http-server ~/Documents/udacity/maps-project  127.0.0.1

