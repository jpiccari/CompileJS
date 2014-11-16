/*
 * Copyright (c) 2014 Joshua Piccari, All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions
 * are met:
 * 1. Redistributions of source code must retain the above copyright
 *    notice, this list of conditions and the following disclaimer.
 * 2. Redistributions in binary form must reproduce the above copyright
 *    notice, this list of conditions and the following disclaimer in the
 *    documentation and/or other materials provided with the distribution.
 *
 * THIS SOFTWARE IS PROVIDED BY THE AUTHOR ``AS IS'' AND ANY EXPRESS OR
 * IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES
 * OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED.
 * IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY DIRECT, INDIRECT,
 * INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING,
 * BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED
 * AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY,
 * OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY
 * OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF
 * SUCH DAMAGE.
 */

/*jshint node:true */

'use strict';

var Stream = require('stream'),
	esprima = require('esprima'),
	escodegen = require('escodegen'),
	escodegenOptions = {
		parse: esprima.parse,
		format: {
			// compact: true
		}
	},

	CORE_MODULES = [
		'./modules/local-identifiers'
	].map(require);


function esprimaStream() {
	var stream = new Stream.Transform(),
		fileContents = '';

	stream._writableState.objectMode = false;
	stream._readableState.objectMode = true;

	stream._transform = function(chunk, encoding, done) {
		fileContents += chunk.toString();
		done();
	};

	stream._flush = function(done) {
		var program = esprima.parse(fileContents);

		if (program.type === 'Program') {
			program.body.forEach(function(statement) {
				stream.push(statement);
			});
		}

		done();
	};

	return stream;
}


function escodegenStream() {
	var stream = new Stream.Transform();

	stream._writableState.objectMode = true;
	stream._readableState.objectMode = false;

	stream._transform = function(chunk, encoding, done) {
		stream.push(escodegen.generate(
			{
				type: 'Program',
				body: [chunk]
			},
			escodegenOptions
		));
		done();
	};

	return stream;
}


function compile(options) {
	options = options || {};
	var stream = new Stream.PassThrough(),
		inletStream = esprimaStream(),
		outletStream = escodegenStream(),
		source = inletStream;

	CORE_MODULES.forEach(function(fn) {
		source = source.pipe(fn());
	});

	source.pipe(outletStream);

	stream.on('pipe', function(source) {
		source.unpipe(stream)
			.pipe(inletStream);
	});

	stream.pipe = outletStream.pipe.bind(outletStream);

	return stream;
}


module.exports = compile;
