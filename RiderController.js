var express = require('express');
var router = express.Router();
var bodyParser = require('body-parser');
router.use(bodyParser.urlencoded({ extended: true }));
router.use(bodyParser.json());
const rider = require('./rider');
module.exports = router;

// CREATES A NEW RIDER
router.post('/', function (req, res) {
    rider.create({
            firstName : req.body.firstName,
            lastName : req.body.lastName,
            id : req.body.id,
            location : {
                lat : req.body.lat,
                lon : req.body.lon
            },
            destination : req.body.destination,
            assignedDriver: req.body.assignedDriver
        }, 
        function (err, rider) {
            if (err) return res.status(500).send("There was a problem adding the information to the database.");
            res.status(200).send(rider);
        });
});
// RETURNS ALL THE RIDERS IN THE DATABASE
router.get('/', function (req, res) {
    rider.find({}, function (err, Riders) {
        if (err) return res.status(500).send("There was a problem finding the Riders.");
        res.status(200).send(Riders);
    });
});

// Returns a single rider from the database
router.get('/:id', function (req, res) {
    Rider.findById(req.params.id, function (err, Riders) {
        if (err) return res.status(500).send("There was a problem finding the Rider.");
        if (!Riders) return res.status(404).send("No rider found.");
        res.status(200).send(Riders);
    });
});

// DELETES A RIDER FROM THE DATABASE
router.delete('/:id', function (req, res) {
    Rider.findByIdAndRemove(req.params.id, function (err, Riders) {
        if (err) return res.status(500).send("There was a problem deleting the rider.");
        res.status(200).send("Rider "+ Riders.name +" was deleted.");
    });
});

//UPDATES A RIDER IN THE DATABASE
router.put('/:id', function (req, res) {
    Rider.findByIdAndUpdate(req.params.id, req.body, {new: true}, function (err, Riders) {
        if (err) return res.status(500).send("There was a problem updating the rider.");
        res.status(200).send(Riders);
    });
});

module.exports = router;