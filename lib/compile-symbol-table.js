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


var Scope = require('./compile-scope');


function SymbolTable() {
	// Setup global scope
	this.enterScope();
}


/**
 * Searches though symbolTable until a symbol which matches conditions defined
 * by fn() is found
 * @param {object} symbolTable - Instance of a SymbolTable to search through
 * @param {function} fn - Function to evaluate symbols
 * @returns {object} AST node of the first matching symbol
 */
function searchSymbols(symbolTable, fn) {
	var i, j;

	for (i = symbolTable.length; i--; ) {
		for (j = symbolTable[i].length; j--; ) {
			if (fn(symbolTable[i][j], i)) {
				return symbolTable[i][j];
			}
		}
	}
}

SymbolTable.prototype = {

	/**
	 * Increases the scope level
	 */
	enterScope: function() {
		Array.prototype.push.call(this, new Scope(this.getScope()));
	},


	/**
	 * Decreases the scope level, removing all symbols at the current level
	 * @returns {array} List of removed symbols
	 */
	leaveScope: function() {
		// Don't allow leaving the global scope
		if (this.length > 1) {
			return Array.prototype.pop.call(this);
		}
	},


	/**
	 * Gets the current scope
	 * @returns {number} Current scope
	 */
	getScope: function() {
		return this[this.length - 1];
	},


	/**
	 * Adds symbol to the current scope
	 * @param {string} symbol - Symbol name to be added
	 * @param {object} node - Reference to AST node representing the symbol
	 */
	addSymbol: function(symbol, node) {
		this.getScope().push({ symbol: symbol, node: node });
	},


	/**
	 * Adds symbol to the global scope
	 * @param {string} symbol - Symbol name to be added
	 * @param {object} node - Reference to AST node representing the symbol
	 */
	addGlobalSymbol: function(symbol, node) {
		this[0].push({ symbol: symbol, node: node });
	},


	/**
	 * Checks the existance of a symbol in the current scope
	 * @param {string} symbol - Symbol name to lookup
	 * @returns {boolean} Whether the symbol exists
	 */
	checkSymbol: function(symbol) {
		return this.getScope().some(function(item) {
			return item.symbol === symbol;
		});
	},


	/**
	 * Checks if the symbol is declared globally.
	 * @param {string} symbol - Symbol name to lookup
	 */
	isGlobalSymbol: function(symbol) {
		var scope;

		searchSymbols(this, function(reference, scopeLevel) {
			if (reference.symbol === symbol) {
				scope = scopeLevel
				return true;
			}
		});

		return scope === 0;
	},


	/**
	 * Finds a reference to symbol start at the current scope
	 * @param {string} symbol - Symbol name to lookup
	 * @returns {object} Reference to AST node representing the symbol
	 */
	findSymbol: function(symbol) {
		return searchSymbols(this, function(reference) {
			if (reference.symbol === symbol) {
				return true;
			}
		});
	}

};


module.exports = SymbolTable;