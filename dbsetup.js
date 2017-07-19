var knex = require('knex')({
  client: 'sqlite3',
  connection: {
    filename: "./mydb.sqlite"
  },
  useNullAsDefault: true
});
module.exports = knex;
knex.schema.createTableIfNotExists('meetinginfo', function(table) {
  table.increments('id');
  table.integer('start_time').unsigned();
  table.integer('stop_time').unsigned();  
  table.string('audio_path');
  table.text('transcript');
}).catch(function(e) {
  console.error(e);
});















/*
sqlite3 = require('sqlite3').verbose();
var db = new sqlite3.Database('momserverdb.db');
var check;
db.serialize(function() {

  db.run("CREATE TABLE if not exists transcripts (mid TEXT PRIMARY KEY NOT NULL, start_time UNSIGNED INT, stop_time UNSIGNED INT, s3path TEXT, transcript LONGTEXT)");
 var stmt = db.prepare("INSERT INTO user_info VALUES (?)");
  for (var i = 0; i < 10; i++) {
      stmt.run("Ipsum " + i);
  }
  stmt.finalize();

  db.each("SELECT rowid AS id, info FROM user_info", function(err, row) {
      console.log(row.id + ": " + row.info);
  });

});
db.close();
*/
