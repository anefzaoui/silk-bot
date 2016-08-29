'use strict';

const log = require('silk-alog'),
  Camera = require('silk-camera').default,
  path = require('path'),
  request = require('request'),
  fs = require('fs'),
  urljoin = require('url-join');


let device = require('./device');
device.init();


var config = require('./config');
var fullUploadUrl = urljoin(config.uploadUrl, config.id, config.secret);
var busy, uploadBusy;

let camera = new Camera();
camera.init()
  .then(() => {
    log.info('camera initialized');
    camera.startRecording();
  }).catch(e => {
    log.info('Error: ' + e);
  });


camera.on('frame', (when, image) => {

  // If the previous file reading,
  // and the uploading process are still running
  // then skip this frame
  if (busy || uploadBusy) {
    log.info('busy status:' + busy);
    log.info('uploadBusy status:' + uploadBusy);

    return;
  }
  busy = true;
  uploadBusy = true;

  if (image.width() < 1 || image.height() < 1) {
    throw new Error('Image has no size');
  }

  // Define the image captured by the camera and save it.
  // Then inform us that image has been saved.
  const filename = '/data/camera_image.png';
  image.save(filename);
  log.info('Saved ' + filename);

  // Intiate reading the saved image.
  var imagePath = fs.createReadStream(filename);

  // On getting data, start uploading it to the server.
  imagePath.on('data', function(chunk) {
    log.info('On Data Event started.');
    // Sending the image in a HTTP POST request.
    var r = request.post(fullUploadUrl, function optionalCallback(err, httpResponse, body) {
      if (err) {
        return log.info('upload failed:', err);
      }
      log.info('Upload successful!  Server responded with:', body);
      uploadBusy = false;
    });
    var form = r.form();
    form.append('campicture', chunk);
    log.info('On Data Event ended.');
  });

  // If the stream reading is done start capturing another image.
  imagePath.on('end', function() {
    log.info('On End Event started.');
    imagePath.close();
    busy = false;
    log.info('On End Event ended.');
  });

});
