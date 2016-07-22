# Python line profiler for atom

Able to run py code locally or by ssh channel.
Parses pstats and displays results in gutter.


# Requirements
* [Python line profiler](https://pypi.python.org/pypi/line_profiler/) -> `pip install line_profiler`

# How to run
1) ALT+SHIFT+P to activate

This will show a snippet similar to the following

```
from line_profiler import LineProfiler; lp = LineProfiler()
# add function (add_function) or module (add_module) to profiler
lp.add_module(mymodule)
# call function
lp.runcall(myfunction, args, kwargs)
```

2) Add the module in the profiler scope to record stats (`lp.add_module(modulename)`)

3) Run the function to profile (`lp.runcall(myfunction, args, kwargs)`)


Experimental
Use at your own risk.

![doggo](http://i.imgur.com/CTnn6hY.jpg)
