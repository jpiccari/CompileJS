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

var identifierPrefix = '__const_literal_$' + (Math.random() * Math.pow(2, 32)).toString(36),
	identifierCount = 0;


function symbolForLiteral(node) {
	return typeof node.value + node.value;
}


function insertVariable(node, name, value, raw) {
	var body = node.type !== 'Program' ? node.body.body : node.body,
		i;

	for (i = 0; i < body.length; i++) {
		if (body[i].type !== 'ExpressionStatement' ||
			body[i].expression.type !== 'Literal') {
			break;
		}
	}

	body.splice(i, 0, {
		type: 'VariableDeclaration',
		declarations: [
			{
				type: 'VariableDeclarator',
				id: {
					type: 'Identifier',
					name: name
				},
				init: {
					type: 'Literal',
					value: value,
					raw: raw
				}
			}
		],
		kind: 'var'
	});
}


function replaceNode(replacement, node) {
	if (!replacement || replacement === node) {
		return;
	}

	var key;

	for (key in node) {
		if (replacement[key]) {
			node[key] = replacement[key];
			delete replacement[key];
		} else {
			delete node[key];
		}
	}

	for (key in replacement) {
		node[key] = replacement[key];
	}

	return node;
}



function onEnterLiteral(literals, node, symbols) {
	var scope = symbols.getScope(),
		symbol;

	if (node.raw.length > 1) {
		symbol = symbolForLiteral(node);

		if (!literals[symbol]) {
			literals[symbol] = [node];
			literals[symbol].scope = scope;
		} else {
			literals[symbol].push(node);
			literals[symbol].scope = scope.getCommonParent(literals[symbol].scope);
		}
	}
}

function onEnterScope(scopes, node, symbols) {
	scopes[symbols.getScope().id] = node;
}

function onLeaveProgram(literals, scopes, node, symbols) {
	var scope,
		newNode,
		list,
		key,
		i;

	for (key in literals) {
		list = literals[key];

		/*
		 * Skip when...
		 * 1. There is less than 2 occurences of a literal
		 * 2. Replacing each instance with a variable increases the size
		 */
		if (list.length < 2 ||
			list.length * list[0].raw.length < list[0].raw.length + list.length + 2) {
			continue;
		}

		newNode = {
			type: 'Identifier',
			name: identifierPrefix + (++identifierCount)
		};

		insertVariable(scopes[list.scope.id], newNode.name, list[0].value, list[0].raw);

		for (i = 0; i < list.length; i++) {
			replaceNode(newNode, list[i]);
		}
	}
}


module.exports = function(eventEmitter) {
	var literals = {},
		scopes = {},
		_onEnterScope = onEnterScope.bind(0, scopes);

	eventEmitter.on('enter.Literal', onEnterLiteral.bind(0, literals));

	eventEmitter.on('enter.Program', _onEnterScope);
	eventEmitter.on('enter.FunctionDeclaration', _onEnterScope);
	eventEmitter.on('enter.FunctionExpression', _onEnterScope);

	eventEmitter.on('leave.Program', onLeaveProgram.bind(0, literals, scopes));
};