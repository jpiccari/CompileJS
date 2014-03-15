# CompileJS
CompileJS is an experimental JavaScript minifier built on the research of compilers.

This page will document the command line tool and current state of the project.
This is a work-in-progress and will remain so for a while.

## Running the Lexer
The lexer currently works and is hooked up. You can have output the tokens and
semantic values (where applicable) by invoking CompileJS with the `-l` option.
	compilejs -l file
If you notice defects in the lexer create an issue with steps to reproduce the
issue. Maybe even have some code ready and submit a pull request!


## What about the parser?
Its in the works but is still a long ways out. For now enjoy the lexer.
