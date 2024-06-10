/*
Copyright (c) 2017, ZOHO CORPORATION
License: MIT
*/
const portfinder = require('portfinder');
var fs = require('fs');
var path = require('path');
var express = require('express');
var bodyParser = require('body-parser');
var errorHandler = require('errorhandler');
var morgan = require('morgan');
var serveIndex = require('serve-index');
var https = require('https');
var chalk = require('chalk');
const axios = require('axios');

process.env.PWD = process.env.PWD || process.cwd();


var expressApp = express();
expressApp.use(express.json());

var portPromise = portfinder.getPortPromise({
  startPort: 5000,
  port: 5000,
  stopPort: 5009
});

portPromise.then((port) => {
  expressApp.set('port', port);
  expressApp.use(morgan('dev'));
  expressApp.use(bodyParser.json());
  expressApp.use(bodyParser.urlencoded({ extended: false }));
  expressApp.use(errorHandler());


  expressApp.use('/', function (req, res, next) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    let connectSrc = "";
    let manifest = fs.readFileSync(path.join(__dirname,"..","plugin-manifest.json")).toString();
    manifest = JSON.parse(manifest);
    if(manifest != null && manifest.cspDomains != null && manifest.cspDomains["connect-src"] != null) {
      let connectDomains = manifest.cspDomains["connect-src"];
      if(validateDomains(connectDomains)) {
        console.log(chalk.bold.red(connectDomains + " - found to be invalid URL(s) in connect-src"));
        next();
        return false;
    }
      connectSrc = connectDomains.join(" ");
    }
    res.setHeader('Content-Security-Policy', 'connect-src https://*.zohostatic.com https://*.sigmausercontent.com https://127.0.0.1:5000'+ connectSrc);
    next();
  });

  expressApp.get('/plugin-manifest.json', function (req, res) {
    res.sendfile('plugin-manifest.json');
  });

  expressApp.use('/app', express.static('app'));
  expressApp.use('/app', serveIndex('app'));


  expressApp.get('/', function (req, res) {
    res.redirect('/app');
  });

  

  var options = {
    key: fs.readFileSync('./key.pem'),
    cert: fs.readFileSync('./cert.pem')
  };

  https.createServer(options, expressApp).listen(port, function () {
    console.log(chalk.green('Zet running at ht' + 'tps://127.0.0.1:' + port));
    console.log(chalk.bold.cyan("Note: Please enable the host (https://127.0.0.1:"+port+") in a new tab and authorize the connection by clicking Advanced->Proceed to 127.0.0.1 (unsafe)."));
  }).on('error', function (err) {
    if (err.code === 'EADDRINUSE') {
      console.log(chalk.bold.red(port + " port is already in use"));
    }
  });

  function validateDomains(domainsList) {
    var invalidURLs = domainsList.filter(function (domain) {
        return ! isValidURL(domain);
    });

    return invalidURLs && invalidURLs.length > 0;
  }

  function isValidURL(url) {
  try {
      var parsedURL = new URL(url);
      if( parsedURL.protocol !== ('http'+':') && parsedURL.protocol !== ('https'+':') && parsedURL.protocol !== ('wss'+':')) {
          return false;
      }
  } catch(e) { return false; }

  return true;
  }
});

//Api for get the address from the pincode
expressApp.get('/getaddress/:code',(req,res)=>{
  //Call api for get the from pin addresses
  let {code} = req.params;
  if(code != ""){
  axios
  .get("https://api.postalpincode.in/pincode/" + code)
  .then((response) => {
    // console.log("response : " + JSON.stringify(response.data));

    //Getting the addresses from response
    let PostOffice = response.data[0].PostOffice;

    // console.log("fromAddressList : " + PostOffice);

    //Generating the dynamic dropdown value
    let optionsAsString =
      "<option value=''>Select Your Address</option>";
    for (var i = 0; i < PostOffice.length; i++) {
      optionsAsString +=
        "<option value='" +
        PostOffice[i].Name +
        "," +
        PostOffice[i].District +
        "," +
        PostOffice[i].State +
        "," +
        PostOffice[i].Country +
        "'>" +
        PostOffice[i].Name +
        "," +
        PostOffice[i].District +
        "," +
        PostOffice[i].State +
        "," +
        PostOffice[i].Country +
        "</option>";
    }

    res.send(optionsAsString);
  })
  .catch((error) => {
    console.error("Error fetching data:", error);
  });
 }
})

//api for get direction data 
expressApp.post('/getdirection',async(req,res)=>{
  console.log("inside api");
  console.log(req.body)
  //getting value from request
  let fromAddress = req.body.fAddress;
  let toAddress = req.body.tAddress; 
  console.log("From Address :"+fromAddress);
  console.log("To Address :"+toAddress);
  console.log("TEst 0")
  //store data to send response
  
  console.log("test 1");
  //validating the variable if empty don't need to run this code
  if(fromAddress != "" && toAddress != ""){

    try {
      console.log("test 2");
    //Getting coordinates using the address value
    let fromCordinate =await getLatAndLong(fromAddress);
    let toCordinate =await getLatAndLong(toAddress);
  
    //to get distance from the direction api
    let distance;
  
    //api url to get the direction
    const orsUrl = "https://api.openrouteservice.org/v2/directions/driving-car";
  
    //parameters for that api
    let api_key = "5b3ce3597851110001cf6248d0aee2fd3c354bf1988fc79f8fe01582";
    let start = fromCordinate.longtitude + "," + fromCordinate.latitute;
    let end = toCordinate.longtitude + "," + toCordinate.latitute;
      console.log("test 3");
    //api call
    await axios
      .get(orsUrl + "?api_key=" + api_key + "&start=" + start + "&end=" + end)
      .then(async (response) => {
        let data = {};
        console.log("Direction response : " + JSON.stringify(response.data));
        distance = await response.data.features[0].properties.segments[0].distance;
        console.log("Distance : " + distance);
        const route = await response.data.features[0].geometry.coordinates;
        console.log("Route VAlue : " + route);
        const coordinates = await route.map((coord) => [coord[1], coord[0]]);
        console.log("Cordinates : " + coordinates);
        data.coords=coordinates;
        data.distance=distance;

        console.log("Send Response Data : "+JSON.stringify(data));

        //sending data to front end
        res.send(data);
      })
      .catch((err) => console.error("Error fetching directions:",err));

      

    } catch (error) {
      console.log("Error at direction api : ");
    }
    }else{
      console.log("The request body is empty")
    }
})

//Function to find latitude and longtitude using address
async function getLatAndLong(address) {
  //api key it has limit
  api_key = "de7a6d09a6c848378cb8218172cc9ae4";

  let latituteVal;
  let longtitudeVal;
  if(address != ""){
  //api call for get latitude and langitude
  await axios
    .get(
      "https://api.opencagedata.com/geocode/v1/json?q=" +
        address +
        "&key=" +
        api_key
    )
    .then((response) => {
      console.log(
        "Response Location : " +
          JSON.stringify(response.data.results[0].geometry)
      );
      latituteVal = response.data.results[0].geometry.lat;
      longtitudeVal = response.data.results[0].geometry.lng;
    })
    .catch((error) => {
      console.error("Error getting latitude and longtitude data:");
    });
  //creating object of lat and long
  var data = {
    latitute: latituteVal,
    longtitude: longtitudeVal,
  };
  return data;
}else{
  // alert("Address is empty");
  return "";
}
  
}
