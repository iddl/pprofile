import json
import sys
from collections import defaultdict

stats = lp.get_stats()
unit = stats.unit
results = {}
for loc, timings in stats.timings.iteritems():
    module, line, fname = loc
    if not results.get(module):
        results[module] = defaultdict(list)
    for sample in timings:
        linenumber, ncalls, timing = sample
        results[module][linenumber].append({
            'timing' : [ncalls, timing*unit, timing*unit*ncalls]
        })

statsdump = json.dumps(results)
print('statsstart{0}statsend'.format(statsdump))
sys.stdout.flush()
exit()
