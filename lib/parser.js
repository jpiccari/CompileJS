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

'use strict';

var Lexer = require('./lexer');

function parse(source) {
	var lexer = new Lexer(source),
		statements = [],
		eof = false,
		token;


	function next() {
		return (token = lexer.nextToken());
	}

	function is() {
		return token.toString() === arguments[0]
			&& (arguments[1] === undefined || token.value === arguments[1]);
	}

	function accept() {
		return is.apply(0, arguments)
			&& next();
	}

	function expect() {
		var result = accept.call(0, arguments);
		if(result) {
			return result;
		}
		/* TODO need better exception */
		throw 'Unexpected token';
	}

	function isSemicolonRequired() {
		return !is('}') && !is('eof') && !lexer.hasLineEnding();
	}

	function expectSemicolon() {
		/*
		 * This function should almost always be used when expecting a semicolon
		 * since it adds an additional check to see if the semicolon must be
		 * present or can be ommitted.
		 */
		if(isSemicolonRequired()) {
			expect(';');
		}
	}


	/*
	 * Productions
	 * Each production starts with an _
	 */

	function _statement() {
		var statement;

		switch(token) {
			case '{':
				return _block();

			case 'const':
			case 'let':
			case 'var':
				statement = _variableDeclarations();
				expectSemicolon();
				break;

			case ';':
				next();
				return /* TODO create empty statement AST */;

			case 'if':
				statement = _ifStatement();
				break;

			case 'do':
				statement = _doWhileStatement();
				break;

			case 'while':
				statement = _whileStatement();
				break;

			case 'for':
				statement = _forStatement();
				break;

			case 'continue':
				statement = _continueStatement();
				break;

			case 'break':
				statement = _breakStatement();
				break;

			case 'return':
				statement = _returnStatement();
				break;

			case 'with':
				statement = _withStatement();
				break;

			case 'switch':
				statement = _switchStatement();
				break;

			case 'throw':
				statement = _throwStatement();
				break;

			case 'try':
				/* TODO */
				break;

			case 'function':
				/* TODO */
				break;

			case 'debugger':
				statement = _debuggerStatement();
				break;

			default:
				statement = _expressionOrLabelledStatement();
		}

		return statement;
	}

	function _block() {
		var block,
			statement;
		expect('{');
		/* TODO initialize block AST */
		while(!is('}')) {
			statement = _statement();
			if(statement && !statement.isEmpty()) {
				block.addStatement(statement);
			}
		}
		expect('}');
		return block;
	}


	function _ifStatement() {
		var condition,
			thenStatement,
			elseStatement;

		expect('if');
		expect('(');
		condition = _expression();
		expect(')');

		thenStatement = _statement();

		if(accept('else')) {
			elseStatement = _statement();
		}
		else {
			/* TODO set elseStatement to new emptyStatement AST */
		}

		/* TODO return if AST */
	}

	function _doWhileStatement() {
		var condition,
			body;

		expect('do');
		body = _statement();

		expect('while');
		expect('(');
		condition = _expression();
		expect(')');

		accept(';');
		/* TODO return loop AST */
	}

	function _whileStatement() {
		var condition,
			body;

		expect('while');
		expect('(');
		condition = _expression();
		expect(')');

		body = _statement();
		/* TODO return loop AST */
	}

	function _continueStatement() {
		var label;

		expect('continue');
		if(!is(';') && isSemicolonRequired()) {
			label = _identifier();
		}
		/* TODO verify label is valid target */
		expectSemicolon();
		/* TODO return continue AST */
	}

	function _breakStatement() {
		var label;

		expect('break');
		if(!is(';') && isSemicolonRequired()) {
			label = _identifier();
		}
		/* TODO verify label is valid target */
		expectSemicolon();
		/* TODO return break AST */
	}

	function _returnStatement() {
		var result;

		expect('return');

		if(lexer.hasLineEnding() || !isSemicolonRequired()) {
			/* return; */
			expectSemicolon();
			/* TODO set result to return statment with undefined return value */
		}
		else {
			/* return expr; */
			/* TODO set result to return statment with returning _expression() */
			expectSemicolon();
		}

		/* TODO validate correct scoping */

		return result;
	}

	function _withStatement() {
		var expression,
			statment;
		expect('with');

		/* TODO validate scope and strict mode */

		expect('(');
		expression = _expression();
		expect(')');

		/* TODO record with scoping rules */
		statment = _statement();
		/* TODO close with scope */

		return /* TODO new with AST */;
	}

	function _caseClause() {
		var label;

		if(accept('case')) {
			label = _expression(true);
		}
		else {
			expect('default');
			/*
			 * TODO if default already occured
			 * then throw error
			 * else record occurence
			 */
		}

		expect(':');
		while(!is('case') && !is('default') && !is('}')) {
			/* TODO add _statement() to list of statements */
		}

		return /* TODO return case AST */;
	}

	function _switchStatement() {
		var expression,
			cases,
			clause;

		expect('switch');
		expect('(');
		expression = _expression();
		expect(')');

		/* TODO setup AST to hold cases */
		expect('{');
		while(!is('}')) {
			clause = _caseClause();
			/* TODO add clause to cases */
		}
		expect('}');

		return /* TODO return new switch AST */;
	}

	function _throwStatement() {
		var exception;

		expect('throw');
		if(lexer.hasLineEnding()) {
			/* TODO throw unexpected error */
		}

		exception = _expression();
		expectSemicolon();
		/* TODO return throw AST */
	}

	function _debuggerStatement() {
		expect('debuger');
		expectSemicolon();
		/* TODO return debugger AST */
	}


	function _expression(acceptIn) {
		var result;

		result = _assignmentExpression(acceptIn);
		while(accept(',')) {
			/* TODO result = binaryOp AST left is current resutl, new expr is right */
		}

		return result;
	}

	function _identifier() {
		expect('identifier');

		return /* TODO return symbol */;
	}


	while(!eof) {

	}
}

 module.exports = parse;