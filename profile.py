import cProfile

def do_cprofile(func):
    def profiled_func(*args, **kwargs):
        profile = cProfile.Profile()
        try:
            profile.enable()
            result = func(*args, **kwargs)
            profile.disable()
            return result
        finally:
            profile.print_stats()
    return profiled_func

def get_number():
    for x in xrange(5000000):
        yield x

@do_cprofile
def expensive_function():
    for x in get_number():
        i = x ^ x ^ x
    return 'some result!'

# perform profiling
result = expensive_function()
