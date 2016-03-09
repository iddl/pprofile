import json
stats = lp.get_stats()
unit = stats.unit
results = {}
for function, timings in stats.timings.iteritems():
    module, line, fname = function
    results[module] = {}
    for sample in timings:
        linenumber, ncalls, timing = sample
        if not results[module].get(linenumber):
            results[module][linenumber] = []
        results[module][linenumber].append({
            'name' : '',
            'timing' : [ncalls, timing*unit, timing*unit*ncalls]
        })


jsondump = json.dumps(results)
print('@@@STATSDUMPSTART@@@' + jsondump + '@@@STATSDUMPEND@@@')
sys.stdout.flush()
exit()
