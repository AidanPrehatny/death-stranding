const express = require('express');
const path = require('path');
const cluster = require('cluster');
const numCPUs = require('os').cpus().length;
const paths = require('../config/paths');
const GoogleSpreadsheet = require('google-spreadsheet');
const async = require('async');
const processUrls = require('./utils');


const doc = process.env.NODE_ENV === "production" ?
  new GoogleSpreadsheet('1v2R7KnoheXKbceBzJyj9c5n5m2BM1ELNXg8A7xEY0gg')
  :
  new GoogleSpreadsheet('1KaFqCNbLuMRa2prpDzyBITS8Txk9AxZX7nPZzp3WHLE');
const PORT = process.env.PORT || 5000;

// const creds = require('../creds/ds-image-urls.json');
const creds = {
  client_email: process.env.CLIENT_EMAIL,
  private_key: JSON.parse(process.env.PRIVATE_KEY)[0]
};

const store = {
  sheet: null,
  lastUpdated: null,
  data: null,
  updating: false,
  watchers: []
};

function doneUpdating(data) {
  if (store.watchers.length > 0) {
    while (store.watchers.length != 0) {
      console.log("resolving");
      store.watchers.pop()(data);
    }
  }
  store.updating = false;
}

function fetchSheetData() {
  return new Promise((resolve, reject) => {
    // if (store.updating == true) {
    //   console.log("pushing resolve to watchers");
    //   store.watchers.push(resolve);
    //   return;
    // }
    // store.updating = true;
    async.series([
      /* step 0 */
      step => {
        doc.getInfo(function (err, info) {
          // console.log('Loaded doc: ' + info.title + ' by ' + info.author.email + " last updated: " + info.updated);
          if (store.lastUpdated == info.updated) {
            step('already up to date');
          } else {
            store.lastUpdated = info.updated;
            store.sheet = info.worksheets[0];
            step();
          }
          // console.log('sheet 1: ' + sheet.title + ' ' + sheet.rowCount + 'x' + sheet.colCount);          
        });
      },
      /* step 1 */
      step => {
        store.sheet.getRows({
          offset: 1,
        }, function (err, rows) {
          console.log('Read ' + rows.length + ' rows');
          // // the row is an object with keys set by the column headers          
          if (err)
            step(err);
          else
            step(null,
              rows.map(row => {
                return {
                  url: row.url,
                  command: row.command,
                  leadsto: row.leadsto,
                  fannames: row.fannames
                }
              }).filter(row => row.url != null && row.command != null)
            );
        });
      }
    ], (err, result) => {
      if (err) {
        console.log("sheet up to date: " + store.lastUpdated + " sending existing content.");
        reject(err);
        doneUpdating(store.data); // maybe send a reject instead of resolving with null
      } else {
        // result[1] is result of step 1
        processUrls(result[1], data => {
          if (data == null) {
            reject();
          } else {
            resolve(data);
            // resolve any additional requests that came in during the update
            doneUpdating(data);
          }
        });
      }
    });
  });
}

function authenticate(cb) {
  console.log("authenticating google sheet...");
  doc.useServiceAccountAuth(creds, cb);
}

const app = express();

// Priority serve any static files.
app.use(express.static(paths.appBuild));

// Answer API requests.
app.get('/data', function (req, res) {
  // console.log("RECEIVED REQUEST");
  res.set('Content-Type', 'application/json');
  // res.setHeader('Cache-Control', 'public, max-age=31557600'); // one year
  fetchSheetData()
    .then(data => {
      store.data = data;
      res.send(JSON.stringify({
        graph: store.data,
        updated: store.lastUpdated
      }));
    })
    .catch(err => {
      // send existing data
      res.send(JSON.stringify({
        items: store.data,
        updated: store.lastUpdated
      }));
    });
});

// All remaining requests return the React app, so it can handle routing.
app.get('*', function (request, response) {
  response.sendFile(path.resolve(paths.appBuild, 'index.html'));
});

authenticate(function () {
  fetchSheetData()
    .then(data => {
      store.data = data;
      console.log("loaded google sheet: ", store.sheet.url);
      app.listen(PORT, function () {
        console.error(`Server listening on port ${PORT}`);
      });
    })
    .catch(err => {
      console.debug(err);
      app.listen(PORT, function () {
        console.error(`Server listening on port ${PORT}`);
      });
    });
});
