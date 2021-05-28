var express = require('express');
var router = express.Router();
var bodyParser = require('body-parser');
router.use(bodyParser.urlencoded({ extended: true }));
router.use(bodyParser.json());
const rider = require('./rider');
var DriverController = require('./DriverController');

module.exports = router;

// CREATES A NEW RIDER
router.post('/', function (req, res) {

    //Rider input validation
    if(typeof(req.body.firstName) !== 'string') { return res.status(400).send("Your firstname input was not a valid input."); } 
    if(typeof(req.body.lastName) !== 'string') { return res.status(400).send("Your lastname input was not a valid input."); } 
    if(typeof(req.body.lat) !== 'string') { return res.status(400).send("Your location lat input was not a valid input."); } 
    if(typeof(req.body.lon) !== 'string') { return res.status(400).send("Your location lon input was not a valid input."); }

    rider.create({
            firstName : req.body.firstName,
            lastName : req.body.lastName,
            location : {
                lat : req.body.lat,
                lon : req.body.lon
            },
            destination : req.body.destination,
            assignedDriver: req.body.assignedDriver,
            averageRating : 0,
            numberOfRatings : 0
        },
        function (err, rider) {
            if (err) return res.status(500).send("There was a problem adding the information to the database.");
            res.status(200).send(rider);
        });
});

// OBJECT USED BY "GET DRIVERS WITHIN 10 MILES OF A SPECIFIED RIDER ID"
const filteredDataElement = {
    driverID : 0,
    location : '',
    distance : '',
    duration : ''
};

// RETURNS ALL THE RIDERS IN THE DATABASE
router.get('/', function (req, res) {
    rider.find({}, function (err, Riders) {
        if (err) return res.status(500).send("There was a problem finding the Riders.");
        res.status(200).send(Riders);
    });
});

// Returns a single rider from the database
router.get('/:id', function (req, res) {
    rider.findById(req.params.id, function (err, Riders) {
        if (err) return res.status(500).send("There was a problem finding the Rider.");
        if (!Riders) return res.status(404).send("No rider found.");
        res.status(200).send(Riders);
    });
});

// DELETES A RIDER FROM THE DATABASE
router.delete('/:id', function (req, res) {
    rider.findByIdAndRemove(req.params.id, function (err, Riders) {
        if (err) return res.status(500).send("There was a problem deleting the rider.");
        res.status(200).send("Rider "+ Riders._id +" was deleted.");
    });
});

//UPDATES A RIDER IN THE DATABASE
router.put('/:id', function (req, res) {
    rider.findByIdAndUpdate(req.params.id, req.body, {new: true}, function (err, Riders) {
        if (err) return res.status(500).send("There was a problem updating the rider.");
        res.status(200).send(Riders);
    });
});

//UPDATES A RIDERS LOCATION IN THE DATABASE
router.put('/:id/location', function (req, res) {
    rider.findByIdAndUpdate(req.params.id, req.body, {new: true}, function (err, Riders) {
        if (err) return res.status(500).send("There was a problem updating the rider.");
        res.status(200).send(Riders);
    });
});

//UPDATES A RIDERS DESTINATION IN THE DATABASE
router.put('/:id/destination', function (req, res) {
    rider.findByIdAndUpdate(req.params.id, req.body, {new: true}, function (err, Riders) {
        if (err) return res.status(500).send("There was a problem updating the rider.");
        res.status(200).send(Riders);
    });
});

//DELETE ALL RIDERS FROM DATABASE
router.purge('/', function (req, res) {
    rider.deleteMany({}, function (err, Riders) {
        if (err) return res.status(500).send("There was a problem deleting all drivers.");
        res.status(200).send("All riders deleted from database.");
    });
});

//GET DRIVERS WITHIN 10 MILES OF A SPECIFIED RIDER ID
var googleDist = require('google-distance');
googleDist.apiKey = '<PERSONAL GOOGLE DIST API KEY GOES HERE>';
router.get('/:id/nearbyDrivers', function (req, res) {
    rider.findById(req.params.id, function (err, Rider) {//To get distance from rider to drivers
        var driver = require('./driver');
        driver.find({available:true},function (err, Drivers){

            //Get the rider lat and lon into correct format
            var riderLatLon = Rider.location.lat+','+Rider.location.lon;

            //Array to be filled with drivers locations
            var driversLocation = [];

            //iterate over each object in Drivers and add their lat,lon to the drivers location array
            for(var Driver of Drivers) {
                //get driver lat lon into correct format
                var DriverLatLon = Driver.location.lat + ',' + Driver.location.lon;
                driversLocation.push(DriverLatLon);
            }

                googleDist.get(
                    {
                        origin: riderLatLon,
                        destinations: driversLocation,
                        units: 'imperial',
                    },
                    function (err, data) {
                        if (err) return res.status(500).send("There was a problem getting drivers in 10 miles.");

                        if (!err) {
                            //console.log(data);//debugging

                            //filter out all results over 10 miles
                            var filteredData = [];
                            var index = 0;
                            for (var element of data){
                                if(element.distanceValue < 16093){
                                    const newElement = Object.create(filteredDataElement);
                                    newElement.driverID = Drivers[index]._id;
                                    newElement.location = element.destination;
                                    newElement.distance = element.distance;
                                    newElement.duration = element.duration;
                                    filteredData.push(newElement);

                                }
                                index = index + 1;
                            }
                            res.status(200).send(filteredData);
                        }
                    });
        });
    });
});

//SELECT A DRIVER (IF THE DRIVER IS AVAILABLE) AND ASSIGN RIDER TO DRIVER
router.put('/:riderID/selectDriver/:driverID', function (req, res) {
    rider.findById(req.params.riderID,function (err, Rider) {
        var driver = require('./driver');
        var DriverController = require('./DriverController');
        driver.findById(req.params.driverID, function (err, Driver){

            if (Rider.assignedDriver == req.params.driverID){
                return res.status(400).send("You are already assigned to Driver " + Driver._id);
            }

            if (Driver.available == false) {
                return res.status(400).send("Driver " + Driver._id + " is not available");
            }

            Driver.available = false
            Driver.assignedRider = Rider._id
            Driver.save()

            Rider.assignedDriver = Driver._id
            Rider.save()

            if (err) return res.status(500).send("There was a problem selecting that driver.");
            res.status(200).send("Assigned to Driver: " + Driver._id);
        });

    });
});

//GET ASSIGNED DRIVER LOCATION, DISTANCE, AND DURATION FROM SPECIFIED RIDER ID
router.get('/:id/driverLocation', function (req, res) {
    rider.findById(req.params.id, function (err, Rider) {//To get distance from rider to drivers
        var driver = require('./driver');
        if (Rider.assignedDriver == null) {
            return res.status(400).send("Rider has no assigned driver");
        }
        driver.findById(Rider.assignedDriver,function (err, Driver){

            //Get the rider lat and lon into correct format
            var riderLatLon = Rider.location.lat+','+Rider.location.lon;

            var DriverLatLon = Driver.location.lat + ',' + Driver.location.lon;


            googleDist.get(
                {
                    origin: riderLatLon,
                    destination: DriverLatLon,
                    units: 'imperial',
                },
                function (err, data) {
                    if (err) return res.status(500).send("There was a problem getting assigned driver information.");

                    const newElement = Object.create(filteredDataElement);
                    newElement.driverID = Driver._id;
                    newElement.location = data.destination;
                    newElement.distance = data.distance;
                    newElement.duration = data.duration;

                    res.status(200).send(newElement);

                });
        });
    });
});

//GIVE ASSIGNED DRIVER A RATING THAT CHANGES THEIR AVERAGE RATING
router.put('/:riderID/rateDriver', function (req, res) {
    rider.findById(req.params.riderID,function (err, Rider) {
        if (err) return res.status(400).send("Invalid request (check id)");
        var driver = require('./driver');
        var DriverController = require('./DriverController');
        if (Rider.assignedDriver == null){
            return res.status(400).send("You are not assigned to a driver");
        }
        driver.findById(Rider.assignedDriver, function (err, Driver){
            if (err) return res.status(500).send("There was a problem rating that driver.");

            //rate the rider
            Driver.numberOfRatings += 1;
            Driver.averageRating = (req.body.rating + Driver.averageRating) / Driver.numberOfRatings;
            if(typeof(req.body.rating) !== 'number') { return res.status(400).send("Your driver rating was not a valid input."); } 
            if (req.body.rating > 5 || req.body.rating < 1) {
              return res.status(400).send("Your rating was out of the boundary. (1-5)");  
            } 
            Driver.save()

            //unassigned driver after rating
            Rider.assignedDriver = null;
            Rider.save();

            res.status(200).send("Rating of " + req.body.rating + " given to driver " + Driver._id);
        });

    });
});

module.exports = router;
