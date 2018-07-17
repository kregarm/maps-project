# Maps project

## Description
This is a simple webapp that loads google maps, displays locations and markers. If the marker is reasonably near an urban area, a new api call is made to load and display the information about the urban area.

## Setup
No setup is needed. Just run the index.html page.

## External services
App uses two external apis - Google maps API and a Teleport Api, which displays information about the area such as cost of living, housing availability etc.

## Dependencies
Besides the APIs, app uses IcoMoon, Materialize CSS, Jquery and KnockoutJS.

## Instructions
On page load, the app displays the New York area and the first six markers, that are hardcoded. From there on you can use the input at the top of the sidebar to search for other locations. The markers will appear as soon as you select something from the dropdown (it also updates the list of locations). If you click on an entry in the list, a new API call is made which displays the location information if the marker is near an urban area. If it's not, nothing happens.
