const axios = require('axios');
const cheerio = require('cheerio');
const FastPriorityQueue = require("fastpriorityqueue");

const POSTIMG_DOMAIN = "postimg.cc/";

function sortData(urls, callback) {
  // sort urlItems by lastModified
  try {
    let pqueue = new FastPriorityQueue(function (a, b) {
      let aTime = Date.parse(a.lastModified);
      let bTime = Date.parse(b.lastModified);
      return aTime < bTime;
    });
    for (let i = 0; i < urls.length; i++) {
      pqueue.add(urls[i]);
    }
    let newUrls = [];
    while (!pqueue.isEmpty()) {
      newUrls.push(pqueue.poll());
    }
    callback(newUrls);
  } catch (err) {
    console.error(err);
    callback(null);
  }
}

module.exports = function processUrls(urls, callback) {
  // const urls = urls.slice();
  let completed = 0;
  console.log("getting postimg information...");
  urls.forEach(async urlItem => {
    try {
      urlItem.command = urlItem.command.split(',');
      urlItem.id1 = urlItem.url.split("/image/")[1].replace("/", "");    
      const response = await axios.get(urlItem.url);
      const $ = cheerio.load(response.data);
      const staticImgSrc = $('#main-image').attr('src');
      const pathIndex = staticImgSrc.indexOf(POSTIMG_DOMAIN) + POSTIMG_DOMAIN.length;
      const parts = staticImgSrc.substring(pathIndex).split("/");
      urlItem.id2 = parts[0];
      urlItem.filename = parts[1];
      urlItem.width = parseInt($('#main-image').attr('width'));
      urlItem.height = parseInt($('#main-image').attr('height'));

      const imgResponse = await axios.get(staticImgSrc);
      const lastModified = imgResponse.headers["last-modified"];
      urlItem.lastModified = new Date(lastModified).toISOString();
      urlItem.lastModifiedUnix = Date.parse(lastModified);
      if (++completed == urls.length) {
        sortData(urls, callback);
      }
    } catch (error) {
      console.error(error);
      callback(null);
    }
  });
}
