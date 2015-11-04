import pickle
import json

results = {}

with open('/home/ivan/tmp/stats.lprof', 'rb') as f:
    stats = pickle.load(f)
    unit = stats.unit
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

    print(json.dumps(results))
