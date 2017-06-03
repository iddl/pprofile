import json
import sys
from collections import defaultdict

# test whether startup script ran
try:
    lp
except NameError:
    exit()

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
            'timing': [unit, timing, ncalls]
        })

statsdump = json.dumps(results)
print('statsstart{0}statsend'.format(statsdump))
sys.stdout.flush()
exit()
