from line_profiler import LineProfiler
lp = LineProfiler()
lp.enable_profile_all()
profile = lp.runcall
