var express = require('express');
var router = express.Router();
var bodyParser = require('body-parser');
router.use(bodyParser.urlencoded({ extended: true }));
router.use(bodyParser.json());
const driver = require('./driver');
module.exports = router;

// CREATES A NEW DRIVER
router.post('/', function (req, res) {
    driver.create({
            firstName : req.body.firstName,
            lastName : req.body.lastName,
            id : req.body.id,
            location : {
                lat : req.body.lat,
                lon : req.body.lon
            },
            availiable : req.body.availiable,
            assignedRider: req.body.assignedRider
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
        res.status(200).send("Driver "+ Drivers.name +" was deleted.");
    });
});

//UPDATES A DRIVER IN THE DATABASE
router.put('/:id', function (req, res) {
    driver.findByIdAndUpdate(req.params.id, req.body, {new: true}, function (err, Drivers) {
        if (err) return res.status(500).send("There was a problem updating the driver.");
        res.status(200).send(Drivers);
    });
});


module.exports = router;