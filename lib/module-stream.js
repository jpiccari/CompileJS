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

var Transform = require('stream').Transform,
	util = require('util');

util.inherits(Walker, Transform);


function Walker(fn, options) {
	Transform.call(this, options);

	this._writableState.objectMode = true;
	this._readableState.objectMode = true;

	this._transform = function(chunk, encoding, done) {
		walk(chunk, fn);
		this.push(chunk);
		done();
	};
}


/**
 * Walks AST calling fn along the way.
 * @param {object} ast - The AST to walk
 * @param {function} fn - The function to call at each level of the AST
 */
function walk(ast, fn) {

	// TODO track scope

	fn(ast);

	Object.keys(ast).forEach(function(child) {
		child = ast[child];
		if (Object(child) === child) {
			walk(child, fn);
		}
	});
}


module.exports = {
	Walker: Walker
};
