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


function NodeAST(type, location) {
	this.type = type;
	this.loc = location;
}

function ProgramAST(body) {
	NodeAST.call(this, 'Program');

	this.body = body;
}

function FunctionAST(identifier, parameters, defaults, rest, body, isGenerator, isExpression) {
	NodeAST.call(this, 'Function');

	this.id = identifier;
	this.params = parameters;
	this.defaults = defaults;
	this.rest = rest;
	this.body = body;
	this.generator = isGenerator;
	this.expression = isExpression;
}


/* Statements */

function StatementAST(type) {
	NodeAST.call(this, type);
}

function EmptyStatementAST() {
	StatementAST.call(this, 'EmptyStatement');
}

function BlockStatementAST(body) {
	StatementAST.call(this, 'BlockStatement');

	this.body = body;
}

function ExpressionStatementAST(expression) {
	StatementAST.call(this, 'ExpressionStatementAST');

	this.expression = expression;
}

function IfStatementAST(condition, consequent, alternate) {
	StatementAST.call(this, 'IfStatement');

	this.test = condition;
	this.consequent = consequent;
	this.alternate = alternate;
}

function LabeledStatementAST(identifier, body) {
	StatementAST.call(this, 'LabeledStatement');

	this.label = identifier;
	this.body = body;
}

function BreakStatementAST(label) {
	StatementAST.call(this, 'BreakStatement');

	this.label = label || null;
}

function ContinueStatementAST(label) {
	StatementAST.call(this, 'ContinueStatement');

	this.label = label || null;
}

function WithStatementAST(object, statement) {
	StatementAST.call(this, 'WithStatement');

	this.object = object;
	this.body = statement;
}

function SwitchStatementAST(discriminant, cases) {
	StatementAST.call(this, 'SwitchStatement');

	this.discriminant = discriminant;
	this.cases = cases;
}

function ReturnStatementAST(argument) {
	StatementAST.call(this, 'ReturnStatement');

	this.argument = argument || null;
}

function ThrowStatementAST(argument) {
	StatementAST.call(this, 'ThrowStatement');

	this.argument = argument;
}

function TryStatementAST(tryBlock, catchClause, finalBlock) {
	StatementAST.call(this, 'TryStatement');

	this.block = tryBlock;
	this.handler = catchClause || null;
	this.guardedHandlers = catchClause ? [catchClause] : [];
	this.finalizer = finalBlock || null;
}

function WhileStatementAST(test, body) {
	StatementAST.call(this, 'WhileStatement');

	this.test = test;
	this.body = body;
}

function DoWhileStatementAST() {
	WhileStatementAST.apply(this, arguments);
	this.type = 'DoWhileStatement';
}

function ForStatementAST(initializer, test, update, body) {
	StatementAST.call(this, 'ForStatement');

	this.init = initializer;
	this.test = test;
	this.update = update;
	this.body = body;
}

function ForInStatementAST(left, right, body) {
	StatementAST.call(this, 'ForInStatement');

	this.left = left;
	this.right = right;
	this.body = body;
}

function DebuggerStatementAST() {
	StatementAST.call(this, 'DebuggerStatement');
}


/*  Declarations */

function DeclarationAST(type) {
	StatementAST.call(this, type);
}

function FunctionDeclarationAST(identifier, parameters, defaults, rest, body, isGenerator, isExpression) {
	FunctionAST.apply(this, arguments);
	this.type = 'FunctionDeclaration';
}

function VariableDeclarationAST(kind, declarations) {
	DeclarationAST.call(this, 'VariableDeclaration');

	this.kind = kind;
	this.declarations = declarations;
}

function VariableDeclaratorAST(identifier, initialValue) {
	DeclarationAST.call(this, 'VariableDeclarator');

	this.id = identifier;
	this.init = initialValue || null;
}


/* Expressions */

function ExpressionAST(type) {
	NodeAST.call(this, type);
}

function ThisExpressionAST() {
	ExpressionAST.call(this, 'ThisExpression');
}

function ArrayExpressionAST(elements) {
	ExpressionAST.call(this, 'ArrayExpression');

	this.elements = elements || [];
}

function ObjectExpressionAST() {
	ExpressionAST.call(this, 'ObjectExpression');

	this.properties = Array.prototype.splice.call(arguments, 0);
}

function FunctionExpressionAST(identifier, parameters, defaults, rest, body, isGenerator, isExpression) {
	FunctionAST.apply(this, arguments);
	this.type = 'FunctionExpression';
}

function SequenceExpressionAST() {
	ExpressionAST.call(this, 'SequenceExpression');

	this.expressions = Array.prototype.splice.call(arguments, 0);
}

function UnaryExpressionAST(operator, argument, isPrefix) {
	ExpressionAST.call(this, 'UnaryExpression');

	this.operator = operator;
	this.argument = argument;
	this.prefix = !!isPrefix;
}

function BinaryExpressionAST(operator, left, right) {
	ExpressionAST.call(this, 'BinaryExpression');

	this.operator = operator;
	this.left = left;
	this.right = right;
}

function AssignmentExpressionAST() {
	BinaryExpressionAST.apply(this, arguments);
	this.type = 'AssignmentExpression';
}

function UpdateExpressionAST() {
	UnaryExpressionAST.apply(this, arguments);
	this.type = 'UpdateExpression';
}

function LogicalExpressionAST() {
	BinaryExpressionAST.apply(this, arguments);
	this.type = 'LogicalExpression';
}

function ConditionalExpressionAST(test, alternate, consequent) {
	ExpressionAST.call(this, 'ConditionalExpression');

	this.test = test;
	this.alternate = alternate;
	this.consequent = consequent;
}

function NewExpressionAST(callee, args) {
	ExpressionAST.call(this, 'NewExpression');

	this.callee = callee;
	this['arguments'] = args;
}

function CallExpressionAST() {
	NewExpressionAST.apply(this, arguments);
}

function MemberExpressionAST(object, property, isComputed) {
	ExpressionAST.call(this, 'MemberExpression');

	this.object = object;
	this.property = property;
	this.computed = !!isComputed;
}


/* Patterns */

function PatternAST(type) {
	NodeAST.call(this, type);
}

function ObjectPatternAST(properties) {
	PatternAST.call(this, 'ObjectExpression');

	this.properties = properties;
}

function ArrayPatternAST(elements) {
	PatternAST.call(this, 'ArrayPattern');

	this.elements = elements;
}


/* Clauses */

function SwitchCaseAST(statements, test) {
	NodeAST.call(this, 'SwitchCase');

	this.consequent = statements;
	this.test = test || null;
}

function CatchClauseAST(parameter, body, guard) {
	NodeAST.call(this, 'CatchClause');

	this.param = parameter;
	this.body = body;
	this.guard = guard || null;
}


/* Miscellaneous */

function IdentifierAST(identifier) {
	NodeAST.call(this, 'Identifier');

	this.name = identifier;
}

function LiteralAST(value) {
	NodeAST.call(this, 'Literal');

	this.value = value || null;
}



module.exports = {
	'Node': NodeAST,
	'Program': ProgramAST,
	'Function': FunctionAST,

	'Statement': StatementAST,
	'EmptyStatement': EmptyStatementAST,
	'BlockStatement': BlockStatementAST,
	'ExpressionStatement': ExpressionStatementAST,
	'IfStatement': IfStatementAST,
	'LabeledStatement': LabeledStatementAST,
	'BreakStatement': BreakStatementAST,
	'ContinueStatement': ContinueStatementAST,
	'WithStatement': WithStatementAST,
	'SwitchStatement': SwitchStatementAST,
	'ReturnStatement': ReturnStatementAST,
	'ThrowStatement': ThrowStatementAST,
	'TryStatement': TryStatementAST,
	'WhileStatement': WhileStatementAST,
	'DoWhileStatement': DoWhileStatementAST,
	'ForStatement': ForStatementAST,
	'ForInStatement': ForInStatementAST,
	'DebuggerStatement': DebuggerStatementAST,

	'Declaration': DeclarationAST,
	'FunctionDeclaration': FunctionDeclarationAST,
	'VariableDeclaration': VariableDeclarationAST,
	'VariableDeclarator': VariableDeclaratorAST,

	'Expression': ExpressionAST,
	'ThisExpression': ThisExpressionAST,
	'ArrayExpression': ArrayExpressionAST,
	'ObjectExpression': ObjectExpressionAST,
	'FunctionExpression': FunctionExpressionAST,
	'SequenceExpression': SequenceExpressionAST,
	'UnaryExpression': UnaryExpressionAST,
	'BinaryExpression': BinaryExpressionAST,
	'AssignmentExpression': AssignmentExpressionAST,
	'UpdateExpression': UpdateExpressionAST,
	'LogicalExpression': LogicalExpressionAST,
	'ConditionalExpression': ConditionalExpressionAST,
	'NewExpression': NewExpressionAST,
	'CallExpression': CallExpressionAST,
	'MemberExpression': MemberExpressionAST,

	'Pattern': PatternAST,
	'ObjectPattern': ObjectPatternAST,
	'ArrayPattern': ArrayPatternAST,

	'SwitchCase': SwitchCaseAST,
	'CatchClause': CatchClauseAST,

	'Identifier': IdentifierAST,
	'Literal': LiteralAST
};