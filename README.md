# CompileJS
CompileJS is an experimental JavaScript minifier built on the research of compilers
and the power of Node Streams.

This page will document the command line tool and current state of the project.
This is a work-in-progress and will remain so for a while.

## What does it do?
Currently? Nothing! Ok, that's not entirely true. It can convert JavaScript into
slightly differently formatted JavaScript. We don't expect any additional
functionality for quite some time. Check back in 6-12 months.

If you're really interested take look at `./bin/compilejs --help` and if you're
still not satisfied you can crack open the `lib/modules/` directory to get a sense
of the currently implemented optimization passes.