/*
 * Copyright (c) 2014, 2015 Joshua Piccari, All rights reserved.
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
	EventEmitter = require('events').EventEmitter,
	EsprimaStream = require('./compile-esprima-stream'),
	EscodegenStream = require('./compile-escodegen-stream'),
	SymbolTable = require('./compile-symbol-table'),
	CORE_MODULES = [
		'./modules/local-identifiers',
		// './modules/cached-literals'
	].map(require);


/**
 * Runs recursive descent on an AST, emitting events when entering/leaving nodes
 * @param {object} node - AST node to recurse over
 * @param {object} instance - CompileJS instance API
 * @returns Modified AST
 */
function walkTree(node, instance) {
	var key;

	if (Object(node) !== node) {
		return node;
	}

	instance.eventEmitter.emit('enter' + node.type, node, instance);

	for (key in node) {
		walkTree(node[key], instance);
	}

	instance.eventEmitter.emit('leave' + node.type, node, instance);

	return node;
}

module.exports = function() {
	var iStream = new EsprimaStream(),
		oStream = new EscodegenStream(),
		optimizations = new Stream.Transform({ objectMode: true }),
		instance = {
			eventEmitter: new EventEmitter(),
			symbolTable: new SymbolTable()
		};

	function enterScope(node) {
		if (node.id && node.id.name) {
			instance.symbolTable.addSymbol(node.id.name, node);
		}

		instance.symbolTable.enterScope();

		if (Array.isArray(node.params)) {
			node.params.forEach(function(param) {
				instance.symbolTable.addSymbol(param.name, param);
			});
		}
	}

	function leaveScope() {
		instance.symbolTable.leaveScope();
	}

	// Ensure we get first dibs on all events we intend to listen for
	instance.eventEmitter.on('enterProgram', enterScope);
	instance.eventEmitter.on('enterFunctionDeclaration', enterScope);
	instance.eventEmitter.on('enterFunctionExpression', enterScope);

	// Add local variables to symbol table
	instance.eventEmitter.on('enterVariableDeclarator', function(node) {
		instance.symbolTable.addSymbol(node.id.name, node);
	});

	// Add global variables to symbol table
	instance.eventEmitter.on('enterAssignmentExpression', function(node) {
		if (node.left.type === 'Identifier' &&
			!instance.symbolTable.checkSymbol(node.left.name)) {
			instance.symbolTable.addGlobalSymbol(node.left.name, node);
		}
	});

	// Initialize modules
	CORE_MODULES.forEach(function(fn) {
		fn(instance);
	});

	// These must be last so we don't remove a scope while its being processed
	instance.eventEmitter.on('leaveProgram', leaveScope);
	instance.eventEmitter.on('leaveFunctionDeclaration', leaveScope);
	instance.eventEmitter.on('leaveFunctionExpression', leaveScope);

	// Setup optimization stream to walk the AST as each chunk is passed in
	optimizations._transform = function(chunk, encoding, done) {
		optimizations.push(walkTree(chunk, instance));
		done();
	};

	iStream
		.pipe(optimizations)
		.pipe(oStream);

	/*
	 * Setup iStream.pipe() to instead call oStream.pipe(), this makes CompileJS
	 * appear as one single pipe and simplifies the usage for end-users.
	 */
	iStream.pipe = oStream.pipe.bind(oStream);

	return iStream;
};