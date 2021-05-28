var express = require('express');
var router = express.Router();
var bodyParser = require('body-parser');
router.use(bodyParser.urlencoded({ extended: true }));
router.use(bodyParser.json());
const driver = require('./driver');
module.exports = router;

// CREATES A NEW DRIVER
router.post('/', function (req, res) {

    //Driver input validation
    if(typeof(req.body.firstName) !== 'string') { return res.status(400).send("Your firstname input was not a valid input."); } 
    if(typeof(req.body.lastName) !== 'string') { return res.status(400).send("Your lastname input was not a valid input."); } 
    if(typeof(req.body.available) !== 'boolean') { return res.status(400).send("Your availability input was not a valid input."); } 
    if(typeof(req.body.lat) !== 'string') { return res.status(400).send("Your location lat input was not a valid input."); } 
    if(typeof(req.body.lon) !== 'string') { return res.status(400).send("Your location lon input was not a valid input."); }

    driver.create({
            firstName : req.body.firstName,
            lastName : req.body.lastName,
            location : {
                lat : req.body.lat,
                lon : req.body.lon
            },
            available : req.body.available,
            assignedRider: req.body.assignedRider,
            averageRating : 0,
            numberOfRatings : 0
        },
        function (err, driver) {
            if (err) return res.status(500).send("There was a problem adding the information to the database.");
            res.status(200).send(driver);
        });
});
// RETURNS ALL THE DRIVERS IN THE DATABASE
router.get('/', function (req, res) {
    driver.find({}, function (err, Drivers) {
        if (err) return res.status(500).send("There was a problem finding the Drivers.");
        res.status(200).send(Drivers);
    });
});

// Returns a single driver from the database
router.get('/:id', function (req, res) {
    driver.findById(req.params.id, function (err, Drivers) {
        if (err) return res.status(500).send("There was a problem finding the Driver.");

        if (!Drivers) return res.status(404).send("No driver found.");
        res.status(200).send(Drivers);
    });
});

// DELETES A DRIVER FROM THE DATABASE
router.delete('/:id', function (req, res) {
    driver.findByIdAndRemove(req.params.id, function (err, Drivers) {
        if (err) return res.status(500).send("There was a problem deleting the driver.");
        res.status(200).send("Driver "+ Drivers._id +" was deleted.");
    });
});

//UPDATES A DRIVER IN THE DATABASE
router.put('/:id', function (req, res) {
    driver.findByIdAndUpdate(req.params.id, req.body, {new: true}, function (err, Drivers) {
        if (err) return res.status(500).send("There was a problem updating the driver.");
        res.status(200).send(Drivers);
    });
});

//UPDATES A DRIVERS LOCATION IN THE DATABASE
router.put('/:id/location', function (req, res) {
    driver.findByIdAndUpdate(req.params.id, req.body, {new: true}, function (err, Drivers) {
        if (err) return res.status(500).send("There was a problem updating the driver.");
        res.status(200).send(Drivers);
    });
});

//UPDATES A DRIVERS OWN AVAILABILITY IN THE DATABASE
router.put('/:id/availbility', function (req, res) {
    driver.findByIdAndUpdate(req.params.id, req.body, {new: true}, function (err, Drivers) {
        if (err) return res.status(500).send("There was a problem updating the driver.");
        res.status(200).send(Drivers);
    });
});

//DELETE ALL DRIVERS FROM DATABASE
router.purge('/', function (req, res) {
    driver.deleteMany({}, function (err, Drivers) {
        if (err) return res.status(500).send("There was a problem deleting all drivers.");
        res.status(200).send("All drivers deleted from database.");
    });
});

//GET ASSIGNED RIDER LOCATION FROM SPECIFIED DRIVER ID
var googleDist = require('google-distance');
googleDist.apiKey = 'AIzaSyBM1qHkpR39FOH6cSmgTStF_oGfpqheMQc';
router.get('/:id/assignedRider/location', function (req, res) {
    driver.findById(req.params.id, function (err, Driver) {//To get distance from rider to drivers
        var rider = require('./rider');
        rider.findById(Driver.assignedRider,function (err, Rider){

            //Get the rider lat and lon into correct format
            var riderLatLon = Rider.location.lat+','+Rider.location.lon;

            googleDist.get(
                {
                    origin: riderLatLon,
                    destination: riderLatLon,
                    units: 'imperial',
                },
                function (err, data) {
                    if (err) return res.status(500).send("There was a problem getting the location of rider " + Rider._id);

                    //Return the rider's location from google dist
                    res.status(200).send(data.origin);
                });
        });
    });
});

//GET ASSIGNED RIDER DESTINATION FROM SPECIFIED DRIVER ID
router.get('/:id/assignedRider/destination', function (req, res) {
    driver.findById(req.params.id, function (err, Driver) {//To get distance from rider to drivers
        var rider = require('./rider');
        rider.findById(Driver.assignedRider,function (err, Rider){


            googleDist.get(
                {
                    origin: Rider.destination,
                    destination: Rider.destination,
                    units: 'imperial',
                },
                function (err, data) {
                    if (err) return res.status(500).send("There was a problem getting the location of rider " + Rider._id);

                    //Return the rider's location from google dist
                    res.status(200).send(data.destination);
                });
        });
    });
});

//GIVE ASSIGNED RIDER A RATING THAT CHANGES THEIR AVERAGE RATING
router.put('/:driverID/rateRider', function (req, res) {
    driver.findById(req.params.driverID,function (err, Driver) {
        if (err) return res.status(400).send("Invalid request (check id)");
        var rider = require('./rider');
        var RiderController = require('./RiderController');
        if (Driver.assignedRider == null){
            return res.status(400).send("You are not assigned to a rider");
        }
        rider.findById(Driver.assignedRider, function (err, Rider){
            if (err) return res.status(500).send("There was a problem rating that rider.");

            //rate the rider
            Rider.numberOfRatings += 1;
            Rider.averageRating = (req.body.rating + Rider.averageRating) / Rider.numberOfRatings;
            if(typeof(req.body.rating) !== 'number') { return res.status(400).send("Your rider rating was not a valid input."); } 
            if (req.body.rating > 5 || req.body.rating < 1) {
                return res.status(400).send("Your rating was out of the boundary. (1-5)");  
            } 
            Rider.save()

            //unassigned rider after rating and become available
            Driver.assignedRider = null;
            Driver.available = true;
            Driver.save();

            res.status(200).send("Rating of " + req.body.rating + " given to rider " + Rider._id);
        });

    });
});

//IMPORT FOR URL REQUESTS
const request = require('request');
//GET DIRECTIONS TO ASSIGNED RIDER DESTINATION FROM SPECIFIED DRIVER ID
router.get('/:id/assignedRider/destination/directions', function (req, res) {
    driver.findById(req.params.id, function (err, Driver) {//To get distance from rider to drivers
        if (err) return res.status(400).send("Invalid request (check id)");
        var rider = require('./rider');
        rider.findById(Driver.assignedRider,function (err, Rider){
            if (err) return res.status(400).send("Invalid request (no assigned rider)");

            //build the request url
            var url = "https://maps.googleapis.com/maps/api/directions/json?";
            url += "origin=";
            var DriverLatLon = Driver.location.lat + ',' + Driver.location.lon;
            url += DriverLatLon;
            url += "&destination="
            var temp = Rider.destination
            temp = temp.replace(/\s/g, '\+');
            url += temp;
            url += "&key=";
            url += key;

            request(url, { json: true }, (errr, resp, body) => {
                if (errr) return res.status(500).send("ERROR");

                else res.status(200).send(body.routes);

            });
        });
    });
});

//GET DIRECTIONS TO ASSIGNED RIDER LOCATION FROM SPECIFIED DRIVER ID
router.get('/:id/assignedRider/location/directions', function (req, res) {
    driver.findById(req.params.id, function (err, Driver) {//To get distance from rider to drivers
        if (err) return res.status(400).send("Invalid request (check id)");
        var rider = require('./rider');
        rider.findById(Driver.assignedRider,function (err, Rider){
            if (err) return res.status(400).send("Invalid request (no assigned rider)");

            //build the request url
            var url = "https://maps.googleapis.com/maps/api/directions/json?";
            url += "origin=";
            var DriverLatLon = Driver.location.lat + ',' + Driver.location.lon;
            url += DriverLatLon;
            url += "&destination="
            var RiderLatLon = Rider.location.lat+','+Rider.location.lon;
            url += RiderLatLon;
            url += "&key=";
            url += key;

            request(url, { json: true }, (errr, resp, body) => {
                if (errr) return res.status(500).send("ERROR");

                else res.status(200).send(body.routes);

            });
        });
    });
});

module.exports = router;