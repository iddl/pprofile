import simplejson
import itertools
import marshal
import sys

def parse_entry(entry):
    stats = {}
    for k,v in entry.iteritems():
        module, line, fname = k
        timing = list(v[0:4])

        callees= None
        if len(v) > 4:
            callees = parse_entry(v[4])

        s_module = stats.get(module, {})
        s_line = s_module.get(line, [])
        s = {
            'timing'  : timing,
            'name' : fname
        }

        if callees:
            s['callees'] = callees

        s_line.append(s)

        s_module[line] = s_line
        stats[module] = s_module

    return stats

def main(filename):
    f = open(filename)
    stats = parse_entry(marshal.load(f))
    print(simplejson.dumps(stats))


if __name__ == "__main__":
   main(sys.argv[1])
