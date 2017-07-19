var express = require('express');
//var https = require('https');
var async = require('async')
var http = require('http');
var fs = require('fs');
var request = require('request');
const bodyParser = require('body-parser');
const googletranslater = require('./recognize.js');
var knex = require('./dbsetup.js');
var app = express();


//app.use(bodyParser.urlencoded({extended:true}));
//app.use(bodyParser.json());
app.use(bodyParser.json());

// This line is from the Node.js HTTPS documentation.


app.get('/', (req, res) => {
  res.send('Inside my Index Page');
  console.log("Inside my Index Page");
});

app.post('/api/mom', (req, res) => {
	knex('meetinginfo').insert({start_time:Date.now()})
    .then(function(id){
    	console.log("Successfully created meeting record with Meeting Id =" + id);
      res.json({
        "version": "1.0",
  			"sessionAttributes": {
    			"data": {
      			"mid": id[0],
      			"command": "start"
    			}
  			},
  		"response": {
    		"outputSpeech": {
      		"type": "PlainText",
      		"text": "Started meeting with id " + id[0]
    		},
        "card": {
          "type": "Simple",
          "title": "card output",
          "content": "Started meeting with id " + id[0]
         },
    		"reprompt": {
      		"outputSpeech": {
        		"type": "PlainText",
        		"text": "have a nice Day"
      		}
    		},
    "directives": [
      {
        "type": "Display.RenderTemplate",
        "template": {
          "type": "BodyTemplate1",
          "token": "mom",
          "title": "response from mom",
          
          "textContent": {
            "primaryText": {
              "type": "PlainText",
              "text": "You are going to have a good day today yersi."
            }
          }
        }
      }
    ],
    		"shouldEndSession": false
   		}
    })
    }).catch(function(err){
      	res.status(500).json({
      		error:true,
      		data:{
        		message:err.message
      		}
      	})
    });    
});

app.get('/api/mom/:mid', (req, res) => {
	knex('meetinginfo').where({id:req.params.mid}).select()
    .then(function(info){
      res.json({
 				info
      })
    }).catch(function(err){
      	res.status(500).json({
      		error:true,
      		data:{
        		message:err.message
      		}
      	})
    });    
});

app.get('/api/mom/', (req, res) => {
	res.json({
  "version": "1.0",
  "sessionAttributes": {
    "data": {
      "mid": "1",
      "command": "start"
    }
  },
  "response": {
    "outputSpeech": {
      "type": "PlainText",
      "text": "Started meeting with id 1"
    },
    "reprompt": {
      "outputSpeech": {
        "type": "PlainText",
        "text": "have a nice Day"
      }
    },
    "shouldEndSession": true
  }
	});
});

app.put('/api/mom', (req, res) => {
	knex('meetinginfo').where('id', '=', req.query.mid).update({stop_time:Date.now(), audio_path:"https://s3-us-west-1.amazonaws.com/mom/audio_recording/" + req.query.mid})
    .then(function(){
    	googletranslater.syncrecord('./resources/audio.raw', 'LINEAR16', 16000, 'en-US', req.query.mid);
      res.json({
        command : {
          action : 'stop',
          mid: req.query.mid
        },
        text: 'Successfully Stoped metting with id ' + req.query.mid
      })
    }).catch(function(err){
      	res.status(500).json({
      		error:true,
      		data:{
        		message:err.message
      		}
      	})
    });
});

app.get('/api/mom/stt', (req, res) => {
	googletranslater.syncrecord('./resources/audio.raw', 'LINEAR16', 16000, 'en-US', req.query.mid);
  knex('meetinginfo').where({id:req.query.mid}).select()
    .then(function(info){
      res.json({
 				info
      })
    }).catch(function(err){
      	res.status(500).json({
      		error:true,
      		data:{
        		message:err.message
      		}
      	})
    });
});


// Create an HTTP service.

http.createServer(app).listen(5000, function(){
	console.log('Server running on port 5000');
	  knex.schema.createTableIfNotExists('meetinginfo', function(table) {
	  table.increments('id');
	  table.integer('start_time').unsigned();
	  table.integer('stop_time').unsigned();  
	  table.string('audio_path');
	  table.text('transcript');
	}).catch(function(e) {
	  console.error(e);
	});
	console.log('Table created Successfully');
});

// Create an HTTPS service identical to the HTTP service.
// https.createServer(options, app).listen(4430);

app.listen(process.env.PORT || 5000);