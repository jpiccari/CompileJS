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

var util = require('./util'),

	whitespace = /^[ \u00a0\n\r\t\f\u000b\u200b\u180e\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200a\u202f\u205f\u3000]*$/,
	lineending = /(?:\r\n?|[\n\u2028\u2029])+/,

	escape = /^(?:\\u[\da-fA-F]{4}|\\x[\da-fA-F]{2}|\\[^ux])$/,
	escapeUnicode = /^\u[\da-fA-F]{4}$/,

	comment = /^\/\/[^\r\n\u2080\u2029]*$/,
	commentEnd = /\*\/$/,

	literalToken = /^(?:null|true|false)$/,
	keyword = /^(?:break|case|catch|const|continue|debugger|default|delete|do|else|finally|for|function|if|in|instanceof|new|return|switch|throw|try|typeof|var|void|while|with)$/,
	operator = /^(?:in|instanceof|typeof|new|void|delete|\+\+|\-\-|\+|\-|\!|~|&|\||\^|\*|\/|%|>>|<<|>>>|<|>|<=|>=|==|===|\!=|\!==|\?|=|\+=|-=|\/=|\*=|%=|>>=|<<=|>>>=||=|^=|&=|&&|\|\|)$/,
	punc = /^[\[\]{}(),;:]$/,

	beforeExpression = /^(?:return|new|delete|throw|else|case|\-\-|\+\+)$/,
	puncBeforeExpression = /^[\[{(,.;:]$/,

	identifierStart = /^[_$a-zA-Z]+$/,
	identifier = /^[_$a-zA-Z\d]+$/i,
	regexModifer = /^[gimy]*$/,

	digit = /^\d+$/,
	dec = /^\.\d+$/,
	exp = /^[eE][+\-]?\d*$/,
	hex = /^0[xX][\da-zA-Z]+$/,
	oct = /^0[0-7]+$/;


module.exports = util.Constructor(function Lexer(input) {
	var self = this,
		hasLineEnding = false,
		tokenOffset,
		tokenLine,
		tokenColumn;

	self.text = input;
	self.offset = 0;
	self.line = 1;
	self.column = 1;
	self.prevToken = null;

	self.hasLineEnding = function() {
		return hasLineEnding || (hasLineEnding = growWhileIs(whitespace).test(lineending));
	};

	self.nextToken = function() {
		var charCode;

		hasLineEnding = false;
		/* Count and skip white space */
		growWhileIs(whitespace);

		/* Record current position of start of token */
		tokenOffset = self.offset;
		tokenLine = self.line;
		tokenColumn = self.column;

		charCode = peek(true);

		/* Check for EOF */
		if(!charCode) {
			return new Token('eof');
		}

		switch(charCode) {
			case 34:	// "
			case 39:	// '
				return handleString();
			case 46:	// .
				return next() && is(digit) ? handleDigit() : '.';
			case 47:	// /
				return handleSlash();
		}


		if(is(digit)) {
			return handleDigit();
		}

		if(is(punc)) {
			self.prevToken = next();
			return self.prevToken;
		}

		if(is(operator)) {
			return handleOperator();
		}

		if(charCode === 92 || is(identifierStart)) {
			var name = '',
				nextChar;

			while(1) {
				name += growWhileIs(identifier);
				if(is(escapeUnicode)) {
					name += convertEscape(growWhileIs(escapeUnicode));
					continue;
				}
				break;
			}

			return prevTokenIs('.') ? new Token('identifier', name)
				: is(literalToken, name) ? new Token(name)
				: !is(keyword, name) ? new Token('identifier', name)
				: is(operator, name) ? new Token('operator', name)
				: new Token(name);
		}

		console.log('ERROR: unrecognized character ' + next());
	};

	function peek(code) {
		return (code ? String.prototype.charCodeAt : String.prototype.charAt).call(self.text, self.offset) || null;
	}

	function next(code) {
		var character = (code ? String.prototype.charCodeAt : String.prototype.charAt).call(self.text, self.offset++);

		if(is(lineending, character)) {
			self.line++;
			self.column = 0;
		}
		else {
			self.column++;
		}

		return character || null;
	}

	function is(regex) {
		return regex.test(arguments[1] || peek());
	}

	function growWhileIs(regex) {
		var string = arguments[1] || '',
			nextChar;

		while((nextChar = peek()) && is(regex, string + nextChar)) {
			string += next();
		}

		return string;
	}

	function prevTokenIs(test) {
		return self.prevToken !== null
			&& typeof self.prevToken === 'object'
			? self.prevToken.type === test
			: self.prevToken === test;
	}

	var Token = util.Constructor(function Token(type, value) {
		this.type = type;
		if(value !== undefined) {
			this.value = value;
		}
		this.line = tokenLine;
		this.column = tokenColumn;
		this.offset = tokenOffset;

		this.toString = function() {
			return this.type;
		};

		self.prevToken = this;
	});

	function handleDigit() {
		var number = self.text.substring(tokenOffset, self.offset) + growWhileIs(digit),
			hasDecimal;

		if(is(oct, number)) {
			return new Token('number', parseInt(number, 8));
		}
		else {
			while(1) {
				switch(peek()) {
					case 'x':
					case 'X':
						if(number.length === 1) {
							return new Token('number', parseInt(growWhileIs(hex, number + next()), 16));
						}
						break;
					case '.':
						if(!hasDecimal) {
							number += next() + growWhileIs(digit);
							hasDecimal = true;
							continue;
						}
						break;
					case 'e':
					case 'E':
						number += growWhileIs(exp);
						break;
				}
				break;
			}
		}

		return new Token('number', parseFloat(number, 10));
	}

	function handleOperator() {
		var string = self.text.substring(tokenOffset, self.offset);
		return new Token('operator', growWhileIs(operator, string));
	}

	function handleString() {
		var quote = next(),
			string = '',
			ch;

		while((ch = next())) {
			if(ch === '\\') {
				if(is(oct)) {
					string += String.fromCharCode(parseInt(growWhileIs(oct), 8));
				}
				else {
					string += convertEscape();
				}
				continue;
			}
			else if(ch === quote) {
				break;
			}
			string += ch;
		}

		return new Token('string', string);
	}

	function handleSlash() {
		var ch = next(),
			captureGroup = [],
			characterClass,
			string;

		switch(peek()) {
			case '/':
				return new Token('comment', growWhileIs(comment, ch));
			case '*':
				string = ch;
				while(!is(commentEnd, string) && (ch = next())) {
					string += ch;
				}
				return new Token('comment', string);
		}

		if(!isRegexAllowed()) {
			return handleOperator();
		}

		/* Must be RegExp */
		string = '';
		while((ch = next()) !== '/' || characterClass) {
			string += ch;
			if(characterClass && ch !== ']') {
				continue;
			}
			switch(ch) {
				case '\\':
					string += next();
					break;
				case '(':
					captureGroup.push(1);
					break;
				case ')':
					captureGroup.pop();
					break;
				case '[':
					characterClass = true;
					break;
				case ']':
					characterClass = false;
					break;
			}
		}

		if(captureGroup.length || characterClass) {
			/* TODO throw better regex error */
			throw new SyntaxError('invalid regex');
		}

		return new Token('regex', new RegExp(string, growWhileIs(regexModifer)));
	}

	function isRegexAllowed() {
		var prev = self.prevToken;

		if(!prev) {
			return true;
		}

		return !prev.type
			? is(puncBeforeExpression, prev)
			: prev.type === 'operator' && !is(/^\-\-|\+\+$/, prev.value)
			|| is(beforeExpression, prev.type);
	}

	function convertEscape() {
		var sequence = peek() + next(),
			ch = sequence.charCodeAt(1);
		switch(ch) {
			case 10:	// \r
				return '';
			case 48:	// \0
			case 98:	// \b
			case 102:	// \f
			case 110:	// \n
			case 114:	// \r
			case 116:	// \t
				return sequence;
			case 118:	// \v
				return '\x0b';
			case 117:	// \u
				sequence += next() + next();
			case 120:	// \x
				sequence += next() + next();
				return String.fromCharCode(parseInt(sequence.substr(1), 16));
			default:
				return sequence.charAt(1);
		}
	}
});
