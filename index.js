'use strict';

const log = require('silk-alog'),
  Camera = require('silk-camera').default,
  path = require('path'),
  needle = require('needle'),
  fs = require('fs'),
  urljoin = require('url-join');


let device = require('./device');
device.init();


var config = require('./config');
var fullUploadUrl = urljoin(config.uploadUrl, config.id, config.secret);
var uploadBusy = false;

let camera = new Camera();
camera.init()
  .then(() => {
    log.info('camera initialized');
    camera.startRecording();
  }).catch(e => {
    log.info('Error: ' + e);
  });



camera.on('frame', (when, image) => {

  if (image.width() < 1 || image.height() < 1) {
    throw new Error('Image has no size');
  }

  if (!uploadBusy) {
    uploadBusy = true;
    log.info('uploadBusy beggining status: ' + uploadBusy);
    const filename = '/data/camera_image.png';
    image.save(filename);
    log.info('Saved ' + filename);

    var data = {
      name: 'campicture',
      image: {
        file: filename,
        content_type: 'image/png'
      }
    }

    /**
    var imageSendingData = {
      campicture: fs.createReadStream(filename)
    };
    log.info(imageSendingData);

    request.post({
      url: fullUploadUrl,
      formData: imageSendingData
    }, function optionalCallback(err, httpResponse, body) {
      if (err) {
        return log.info('upload failed:', err);
      }
      log.info('Upload successful!  Server responded with:', body);
      uploadBusy = false;
    });
    **/


    needle.post(fullUploadUrl, data, {
      multipart: true
    }, function(err, resp, body) {
      if (err) {
        return log.info('upload failed:', err);
      }
      log.info('Upload successful!  Server responded with:', body);
      uploadBusy = false;
    });



    log.info('uploadBusy ending status: ' + uploadBusy);
  }


});
