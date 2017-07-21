var express = require('express');
//var https = require('https');
//var async = require('async');
var http = require('http');
var fs = require('fs');
//var request = require('request');
const bodyParser = require('body-parser');
const googletranslater = require('./recognize.js');
var knex = require('./dbsetup.js');
var app = express();
var nodemailer = require('nodemailer');

var transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'minutesofmeeting.alexa@gmail.com',
    pass: 'p@ssw0rdCloud'
  }
});
var resp = {
        "version": "1.0",
        "sessionAttributes": {
          "data": {
            "mid": 1,
            "command": "start"
          }
        },
      "response": {
        "outputSpeech": {
          "type": "PlainText",
          "text": "" 
        },
        "card": {
          "type": "Simple",
          "title": "card output",
          "content": "" 
         },
        "reprompt": {
          "outputSpeech": {
            "type": "PlainText",
            "text": "have a nice Day"
          }
        },
    
        "directives": [
        {
          "type": "Hint",
          "hint": {
            "type": "PlainText",
            "text": "mid = " 
          }
        }
      ],
        "shouldEndSession": true
      }
    };
var mailOptions = {
  from: 'yerasiprathyusha@gmail.com',
  to: 'yerasiprathyusha@gmail.com, y.prathyusha@globaledgesoft.com, dk.vinay@globaledgesoft.com', 
  //svajjaramatti@gmail.com, megharaj229@gmail.com',
  subject: 'Minutes of Meeting',
  text: ''
};

app.use(bodyParser.json());

app.get('/', (req, res) => {
  res.send('Inside my Index Page');
  console.log("Inside my Index Page");
});

app.post('/api/mom', (req, res) => {
  //console.log('********' +req.body.context.System.device);
  //res.send(req.body);
  if(req.body.request.intent.name == 'StartIntent'){
	knex('meetinginfo').insert({start_time:Date.now()})
    .then(function(id){
      resp.sessionAttributes.data.mid = id[0];
      resp.response.outputSpeech.text = "Started meeting with id " + id[0];
      resp.response.card.text = "Started meeting with id " + id[0];
    	console.log("Successfully created meeting record with Meeting Id =" + id);
      res.json(resp
    )
    }).catch(function(err){
      	res.status(500).json({
      		error:true,
      		data:{
        		message:err.message
      		}
      	})
    });
  
  }else if(req.body.request.intent.name == 'StopIntent'){
    knex('meetinginfo').where('id', '=', req.body.request.intent.slots.Mid.value).update({stop_time:Date.now(), audio_path:"https://s3-us-west-1.amazonaws.com/mom/audio_recording/" + '1'})
    .then(function(){
      resp.sessionAttributes.data.mid = req.body.request.intent.slots.Mid.value;
      resp.response.outputSpeech.text = "Successfully Stoped meeting with id " + req.body.request.intent.slots.Mid.value;
      resp.response.card.text = "Successfully toped meeting with id " + req.body.request.intent.slots.Mid.value;
      console.log("Successfully Stoped meeting record with Meeting Id =" + req.body.request.intent.slots.Mid.value);
      googletranslater.syncrecord('./resources/audio.raw', 'LINEAR16', 16000, 'en-US', req.body.request.intent.slots.Mid.value);
      res.json(resp)
    }).catch(function(err){
        res.status(500).json({
          error:true,
          data:{
            message:err.message
          }
        })
    });
  }else if(req.body.request.intent.name == 'MailIntent'){
    knex('meetinginfo').where({id:req.body.request.intent.slots.Mid.value}).select('transcript')
    .then(function(info){
      console.log("transcript = **" + info);
      mailOptions.text = "Dear,\n\n  Transcript for meeting with id=" + req.body.request.intent.slots.Mid.value + "\n\nThank you for attending the meeting";
      transporter.sendMail(mailOptions, function(error, info){
        if (error) {
          console.log(error);
        } else {
         console.log('Email sent: ' + info.response);
        }
      }); 
    });
  }
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
