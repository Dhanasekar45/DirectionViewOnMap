// var myLatLng = { lat: 38.3460, lng: -0.4907 };
// var mapOptions = {
//     center: myLatLng,
//     zoom: 7,
//     mapTypeId: google.maps.MapTypeId.ROADMAP



// };

// var map = new google.maps.Map(document.getElementById("googleMap"), mapOptions);

// //create map
// var map = new google.maps.Map(document.getElementById('googleMap'), mapOptions);

// //create a DirectionsService object to use the route method and get a result for our request
// var directionsService = new google.maps.DirectionsService();

// //create a DirectionsRenderer object which we will use to display the route
// var directionsDisplay = new google.maps.DirectionsRenderer();

// //bind the DirectionsRenderer to the map
// directionsDisplay.setMap(map);

var map = L.map("map").setView([12.3342358, 78.4993862], 13);

var tileLayer = L.tileLayer(
  "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
  {
    maxZoom: 19,
  }
).addTo(map);

function getAddress() {
  let fromPin = document.getElementById("fromPincode").value;
  let toPin = document.getElementById("toPincode").value;

  console.log(fromPin);
  console.log(toPin);
  if (fromPin != "" && toPin != "") {
    //This api call for From Pincode
    axios.get("/getaddress/"+fromPin)
    .then((response)=>{
      console.log(response);
              //getting the field by using id
              dropdown1 = document.getElementById("dropdown1");

            //Inserting the dropdown options to that field
            dropdown1.innerHTML = response.data;
    })
    .catch((err)=>{
      console.error("Error fetching address from backend"+err);
    })
    
    //This api call for To Pincode
    axios.get("/getaddress/"+toPin)
    .then((response)=>{
      console.log(response);
              //getting the field by using id
              dropdown2 = document.getElementById("dropdown2");

            //Inserting the dropdown options to that field
            dropdown2.innerHTML = response.data;
    })
    .catch((err)=>{
      console.error("Error fetching address from backend"+err);
    })

  } else {
    alert("Please Fill the pincode fields");
  }
}



async function getDirection() {
  
  //removing map and recreate this is for when the address change need to show the current direction
  map.remove();
  map = L.map("map").setView([12.3342358, 78.4993862], 13);
  tileLayer = L.tileLayer(
    "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    {
      maxZoom: 19,
    }
  ).addTo(map);

  //Getting address values from the dropdown's
  let fromAddress = document.getElementById("dropdown1").value;
  let toAddress = document.getElementById("dropdown2").value;
 console.log("fromaddress : "+fromAddress);
  //creating payload for request body for api
  const payload = {
    fAddress:fromAddress,
    tAddress:toAddress
  }

  // //create request for google map
  // var request = {
  //     origin: fromAddress,
  //     destination: toAddress,
  //     travelMode: google.maps.TravelMode.DRIVING, //WALKING, BYCYCLING, TRANSIT
  //     unitSystem: google.maps.UnitSystem.IMPERIAL
  // }
  // //pass the request to the route method
  // directionsService.route(request, function (result, status) {
  //     if (status == google.maps.DirectionsStatus.OK) {

  //         //Get distance and time
  //         const output = document.querySelector('#output');
  //         output.innerHTML = "<div class='alert-info'>From: " + fromAddress + ".<br />To: " + toAddress + ".<br /> Driving distance <i class='fas fa-road'></i> : " + result.routes[0].legs[0].distance.text + ".<br />Duration <i class='fas fa-hourglass-start'></i> : " + result.routes[0].legs[0].duration.text + ".</div>";

  //         //display route
  //         directionsDisplay.setDirections(result);
  //     } else {
  //         //delete route from map
  //         directionsDisplay.setDirections({ routes: [] });
  //         //center map in London
  //         map.setCenter(myLatLng);

  //         //show error message
  //         output.innerHTML = "<div class='alert-danger'><i class='fas fa-exclamation-triangle'></i> Could not retrieve driving distance.</div>";
  //     }
  // });

  if(fromAddress != "" && toAddress != ""){

    console.log("payload : "+JSON.stringify(payload));
    //api call for get the direction
    axios.post("/getdirection",payload)
    .then((response)=>{

      console.log("Direction Response : "+JSON.stringify(response.data))

      let coordinates = response.data.coords;
      let distance = response.data.distance;
      //inserting the coordinates to the map
      const polyline = L.polyline(coordinates, { color: "blue" }).addTo(map);
      map.fitBounds(polyline.getBounds());

        //updating to the distance field
        document.getElementById("distance").value = distance / 1000;
    })
    .catch((err)=>{
      console.error("Error getting direction details from backend : "+err);
    })

  }else{
    alert("Please select address");
  }
}
