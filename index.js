#!/usr/bin/env node

'use strict';

var express = require('express'),
    bodyParser = require('body-parser'),
    os = require('os'),
    mjml2html = require('mjml'),
    program = require('commander');

program
    .usage('[options]')
    .parse(process.argv);

var app = express();

app.use(bodyParser.text({
    inflate: true,
    limit: '2048kb',
    type: '*/*'
}));

app.use(require('morgan')('combined'));

var opts = {
    keepComments: (process.env.MJML_KEEP_COMMENTS === 'true'),
    minify: (process.env.MJML_MINIFY === 'true'),
    validationLevel: (['soft', 'strict', 'skip'].includes(process.env.MJML_VALIDATION_LEVEL) ? process.env.MJML_VALIDATION_LEVEL : 'soft')
};

app.all('*', function (req, res) {
    // enable cors
    if (process.env.CORS) {
        res.header("Access-Control-Allow-Origin", process.env.CORS);
        res.header("Access-Control-Allow-Headers", "*");
        res.header("Access-Control-Allow-Methods", "POST");
        res.header("Access-Control-Max-Age", "-1");
    }

    // ensure content type is set
    if (!req.headers['content-type']) {
        res.status(500).send('Content-Type must be set, use text/plain if unsure');
        return;
    }

    try {
        var mjml = JSON.parse(req.body).mjml
        var result = mjml2html(mjml || '', opts);
        res.writeHead(200, {'Content-Type': 'application/json'});
        res.end(JSON.stringify({ "errors": [], "html" : result.html, "mjml" : mjml}));
    } catch (ex) {
        // print error details
        console.log(req.body || '')
        console.error(ex);
        console.log('')

        res.writeHead(400, {'Content-Type': 'application/json'});	    
        res.end(JSON.stringify({ "errors": ex.message}));
    }
});

const server = app.listen(3000);

var signals = {
  'SIGHUP': 1,
  'SIGINT': 2,
  'SIGTERM': 15
};

const shutdown = (signal, value) => {
  server.close(() => {
    console.log(`app stopped by ${signal} with value ${value}`);
    process.exit(128 + value);
  });
};

Object.keys(signals).forEach((signal) => {
  process.on(signal, () => {
    console.log(`process received a ${signal} signal`);
    shutdown(signal, signals[signal]);
  });
});

console.log('self: ' + os.hostname() + ':80');
console.log('cors: ' + process.env.CORS);
console.log('mjml keep comments: ' + opts.keepComments);
console.log('mjml validation level: ' + opts.validationLevel);
console.log('mjml minify: ' + opts.minify);
console.log('');
console.log('Try to mimic official API (https://mjml.io/api/documentation/)');
console.log('POST JSON, return JSON');
