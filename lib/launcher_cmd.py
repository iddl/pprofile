from line_profiler import LineProfiler; lp = LineProfiler()
# add function (add_function) or module (add_module) to profiler
lp.add_module(mymodule)
# call function
lp.runcall(myfunction, args, kwargs)
