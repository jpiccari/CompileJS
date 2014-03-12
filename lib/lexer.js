'use strict';

function _Constructor(func) {
	if(typeof func === 'function') {
		return function() {
			var args = Array.prototype.splice.call(arguments, 0);
			if(this instanceof func) {
				return func.apply(this, args);
			}
			else {
				return new (func.bind.apply(func, [null].concat(args)))();
			}
		};
	}
}

var whitespace = /^[ \u00a0\n\r\t\f\u000b\u200b\u180e\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200a\u202f\u205f\u3000]*$/,
	lineending = /^(?:\r\n?|[\n\u2028\u2029])+$/,

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



module.exports = _Constructor(function Lexer(input) {
	var self = this,
		tokenOffset,
		tokenLine,
		tokenColumn;

	self.text = input;
	self.offset = 0;
	self.line = 1;
	self.column = 1;
	self.prevToken = null;

	self.nextToken = function() {
		var charCode;

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
				: new Token('keyword', name);
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
		return self.prevToken === null ? false
			: typeof self.prevToken === 'object' ? self.prevToken.type === test
			: self.prevToken === test;
	}

	var Token = _Constructor(function Token(type, value) {
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
					string += convertEscape(growWhileIs(escape, ch));
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
		while((ch = next())) {
			switch(ch) {
				case '\\':
					string += ch + next();
					continue;
				case '(':
					string += ch;
					captureGroup.push(ch);
					continue;
				case ')':
					string += ch;
					captureGroup.pop();
					continue;
				case '[':
					string += ch;
					characterClass = true;
					continue;
				case ']':
					string += ch;
					characterClass = false;
					continue;
				case '/':
					break;
				default:
					string += ch;
					continue;
			}
			break;
		}

		if(captureGroup || characterClass) {
			/* TODO unexpected */
		}

		return new Token('regex', new RegExp(string, growWhileIs(regexModifer)));
	}

	function isRegexAllowed() {
		var prev = self.prevToken;

		return prev === null || !is(prev.type ? beforeExpression : puncBeforeExpression, prev);
	}

	function convertEscape(sequence) {
		var ch = sequence.charCodeAt(1);
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
				return '\u000b';
			case 117:	// \u
			case 120:	// \x
				return String.fromCharCode(parseInt(sequence.substr(1), 16));
			default:
				return sequence.charAt(1);
		}
	}
});
