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
	util = require('util'),
	SymbolTable = require('./symbol-table'),
	noop = function() {};


util.inherits(Parser, Transform);

function Parser(options) {
	Transform.call(this, { objectMode: true });

	this._enter = options.enter || noop;
	this._leave = options.leave || noop;
}

Parser.prototype._transform = function(chunk, encoding, done) {
	walkTree(chunk, this._enter, this._leave);
	this.push(chunk);
	done();
};


/**
 * Recursively walks an AST while tracking symbols
 * @param {object} node - AST node to recurse over
 * @param {function} enter - Function called entering nodes
 * @param {function} leave - Function called leaving nodes
 */
function walkTree(node, enter, leave, symbolTable) {
	if (Object(node) !== node) {
		return;
	}

	symbolTable = symbolTable || new SymbolTable();
	var shouldLeaveScope = false;


	switch (node.type) {
		case 'VariableDeclarator':
			symbolTable.addSymbol(node.id.name, node);
			break;

		case 'AssignmentExpression':
			if (node.left.type === 'Identifier' && !symbolTable.checkSymbol(node.left.name)) {
				symbolTable.addGlobalSymbol(node.left.name, node);
			}
			break;

		case 'FunctionDeclaration':
		case 'FunctionExpression':
			if (node.id && node.id.name) {
				symbolTable.addSymbol(node.id.name, node);
			}

			symbolTable.enterScope();
			node.params.forEach(function(param) {
				symbolTable.addSymbol(param.name, param);
			});

			shouldLeaveScope = true;
			break;
	}


	if (typeof enter === 'function') {
		enter(node, symbolTable);
	}

	Object.keys(node).forEach(function(key) {
		walkTree(node[key], enter, leave, symbolTable);
	});

	if (typeof leave === 'function') {
		leave(node, symbolTable);
	}


	if (shouldLeaveScope) {
		symbolTable.leaveScope();
	}
}


module.exports = {
	Parser: Parser
};