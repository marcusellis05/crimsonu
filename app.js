
//--------------------------------------------------
// Express stuff
//--------------------------------------------------
var express = require('express');
var app = express();
app.use(express.bodyParser())

//--------------------------------------------------
// Mongo stuff
//--------------------------------------------------
var mongo = require('mongodb');

var Db = mongo.Db;
var Server = mongo.Server;

var dbname = 'fng_tracker';
var events_cname = 'events';
var fngs_cname = 'fngs';

var db_server = new Server('localhost', 27017, { auto_reconnect: true });
var db = new Db(dbname, db_server);
var ObjectID = db.bson_serializer.ObjectID;

//--------------------------------------------------
// URL token matchers
//--------------------------------------------------
app.param('event', function(req, res, next, id) {
    console.log('matched event id=[' + id + ']');
    var oid = new ObjectID(id);
    db.collection(events_cname, function(err, collection) {
        collection.findOne({_id: oid}, function(err, item) {
            if(err) next(err);

            console.log('matched event=' + JSON.stringify(item, null, 2));
            req.fng_event = item
            next();
        });
    });
});

app.param('fng', function(req, res, next, id) {
    console.log('matched FNG id=[' + id + ']');
    var oid = new ObjectID(id);
    db.collection(fngs_cname, function(err, collection) {
        collection.findOne({_id: oid}, function(err, item) {
            if(err) next(err);

            console.log('matched FNG=' + JSON.stringify(item, null, 2));
            req.fng_fng = item
            next();
        });
    });
});

//--------------------------------------------------
// Liveness route
//--------------------------------------------------
app.get('/', function(req,res) {
    res.send('Hello world!');
});

//--------------------------------------------------
// Event routes
//--------------------------------------------------
app.get('/fng/event', function(req, res) {
    console.log('requested list of events');
    db.collection(events_cname, function(err, collection) {
        collection.find({}).toArray(function(err, items) {
            console.log('matched event ' + JSON.stringify(items, null, 2));
            res.send(items)
        });
    });
});

app.post('/fng/event', function(req, res) {
    console.log('creating new event');
    db.collection(events_cname, function(err, collection) {
        if (! req.body) {
            var failure = {
                result: false,
                msg: "must provide event parameters"
            };
            res.send(400, failure);
        }

        var object = {
            name: 'FNG Event',
            description: 'Sample Event Description',
            date: new Date()
        };

        if (req.body.name) object.name = req.body.name;
        if (req.body.description) object.description = req.body.description;
        if (req.body.date) object.date = req.body.date;

        collection.insert(object, {safe: true}, function(err, result) {
            if (err) {
                var failure = {
                    result: false,
                    msg: "unable to create event",
                };
                res.send(400, failure);
                return;
            }

            console.log('created event ' + JSON.stringify(result, null, 2));
            res.send(result);
        });
    });
});

app.get('/fng/event/:event', function(req, res) {
    if (!req.fng_event) {
        var failure = {
            result: false,
            msg: "need to send valid event ID",
        };
        res.send(404, failure);
        return
    }

    console.log('retrieved event ' + JSON.stringify(req.fng_event, null, 2));
    res.send(req.fng_event);
});

app.post('/fng/event/:event', function(req, res) {
    if (!req.fng_event) {
        var failure = {
            result: false,
            msg: "need to send valid event ID",
        };
        res.send(404, failure);
        return
    }

    if (! req.body) {
        var failure = {
            result: false,
            msg: "must provide event parameters"
        };
        res.send(400, failure);
    }


    var oid = req.fng_event._id;

    var object = req.fng_event;
    if (req.body.name) object.name = req.body.name;
    if (req.body.description) object.description = req.body.description;
    if (req.body.date) object.date = req.body.date;

    console.log('updating fields ' + JSON.stringify(object, null, 2));

    db.collection(events_cname, function(err, collection) {
        collection.findAndModify({_id:oid}, [['_id', 1]], object, {new:true}, function(err, result) {
            if (err) {
                var failure = {
                    result: false,
                    msg: "unable to update event",
                };
                res.send(400, failure);
                return;
            }

            console.log('updated event ' + JSON.stringify(result, null, 2));
            res.send(result);
        });
    });
});

//--------------------------------------------------
// FNG routes
//--------------------------------------------------
app.get('/fng/fng', function(req, res) {
    console.log('requested list of FNGs');
    db.collection(fngs_cname, function(err, collection) {
        collection.find({}).toArray(function(err, items) {
            console.log('matched FNG ' + JSON.stringify(items, null, 2));
            res.send(items)
        });
    });
});

app.post('/fng/fng', function(req, res) {
    console.log('creating new FNG');
    db.collection(fngs_cname, function(err, collection) {
        if (! req.body) {
            var failure = {
                result: false,
                msg: "must provide FNG parameters"
            };
            res.send(400, failure);
        }

        var object = {
            first_name: 'First',
            last_name: 'Last',
            hire_date: new Date()
        };

        if (req.body.first_name) object.first_name = req.body.first_name;
        if (req.body.last_name) object.last_name = req.body.last_name;
        if (req.body.hire_date) object.hire_date = req.body.hire_date;

        collection.insert(object, {safe: true}, function(err, result) {
            if (err) {
                var failure = {
                    result: false,
                    msg: "unable to create FNG",
                };
                res.send(400, failure);
                return;
            }

            console.log('created FNG ' + JSON.stringify(result, null, 2));
            res.send(result);
        });
    });
});

app.get('/fng/fng/:fng', function(req, res) {
    if (!req.fng_fng) {
        var failure = {
            result: false,
            msg: "need to send valid FNG ID",
        };
        res.send(404, failure);
        return
    }

    console.log('retrieved FNG ' + JSON.stringify(req.fng_fng, null, 2));
    res.send(req.fng_fng);
});

app.post('/fng/fng/:fng', function(req, res) {
    if (!req.fng_fng) {
        var failure = {
            result: false,
            msg: "need to send valid FNG ID",
        };
        res.send(404, failure);
        return
    }

    if (! req.body) {
        var failure = {
            result: false,
            msg: "must provide FNG parameters"
        };
        res.send(400, failure);
    }


    var oid = req.fng_fng._id;

    var object = req.fng_fng;
    if (req.body.first_name) object.first_name = req.body.first_name;
    if (req.body.last_name) object.last_name = req.body.last_name;
    if (req.body.hire_date) object.hire_date = req.body.hire_date;

    console.log('updating fields ' + JSON.stringify(object, null, 2));

    db.collection(fngs_cname, function(err, collection) {
        collection.findAndModify({_id:oid}, [['_id', 1]], object, {new:true}, function(err, result) {
            if (err) {
                var failure = {
                    result: false,
                    msg: "unable to update FNG",
                };
                res.send(400, failure);
                return;
            }

            console.log('updated FNG ' + JSON.stringify(result, null, 2));
            res.send(result);
        });
    });
});

//--------------------------------------------------
// main
//--------------------------------------------------
db.open(function(err, db) {
    if (err) throw err;

    console.log('we are connected to mongodb');
    app.listen(8080);
    console.log('app listening on port 8080');
});

