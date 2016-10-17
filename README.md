# Python line profiler for Atom

![example](https://raw.githubusercontent.com/iddl/pprofile/master/gutter_example.png)

# Requirements

A [line_profiler fork](https://github.com/iddl/line_profiler) is needed to run this extension.
```
pip install https://github.com/iddl/line_profiler/zipball/master
```

# How to run
1) ALT+SHIFT+P to activate

This will show an editor with a `Run` button.

2) Use the `profile` function to run a profile on your code (see screenshot).

Note: you need to import code. The directory containing content opened in the active tab will be selected as cwd.

3) Stats will appear in the editor gutter
