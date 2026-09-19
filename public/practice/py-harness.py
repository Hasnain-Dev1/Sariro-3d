# SARIRO — the Code Lab's Python test harness
# ============================================================================
# Runs a learner's Python against a challenge's tests and returns one JSON
# string. The SAME file runs in two places:
#   · in the browser, inside Pyodide, in a Web Worker (public/practice/py-runner.js)
#   · in CPython, from src/lib/practice/lab/packs.test.ts, which checks every
#     challenge's own solution passes — so what the tests check is what ships.
#
# run(code, mode, fn_name, tests_json):
#   mode 'function'  tests are {args, expected}: call fn_name(*args), compare
#   mode 'program'   tests are {stdout}: run the program, compare what it printed
# returns JSON: {ok: true, results: [{i, pass, got, error}], logs}
#            |  {ok: false, error, line, logs}

import io
import json
import math
import sys
import traceback


def _plain(v):
    """What a JSON test value would be: tuples are lists, dict keys are strings."""
    if isinstance(v, (list, tuple)):
        return [_plain(x) for x in v]
    if isinstance(v, dict):
        return {str(k): _plain(x) for k, x in v.items()}
    return v


def _eq(got, want):
    if isinstance(got, bool) or isinstance(want, bool):
        return isinstance(got, bool) and isinstance(want, bool) and got == want
    if isinstance(got, (int, float)) and isinstance(want, (int, float)):
        return math.isclose(got, want, rel_tol=1e-9, abs_tol=1e-9)
    if isinstance(got, list) and isinstance(want, list):
        return len(got) == len(want) and all(_eq(a, b) for a, b in zip(got, want))
    if isinstance(got, dict) and isinstance(want, dict):
        return set(got) == set(want) and all(_eq(got[k], want[k]) for k in got)
    return got == want


def _same_output(got, want):
    def norm(text):
        lines = [line.rstrip() for line in str(text).replace("\r", "").split("\n")]
        while lines and lines[-1] == "":
            lines.pop()
        return lines
    return norm(got) == norm(want)


def _line_of(tb):
    frames = [f for f in traceback.extract_tb(tb) if f.filename == "main.py"]
    return frames[-1].lineno if frames else None


def _describe(err):
    if isinstance(err, SyntaxError):
        return "SyntaxError: " + str(err.msg), err.lineno
    if isinstance(err, EOFError):
        return "EOFError: input() has nothing to read here — use the function's parameters instead", _line_of(err.__traceback__)
    text = str(err)
    return type(err).__name__ + (": " + text if text else ""), _line_of(err.__traceback__)


def run(code, mode, fn_name, tests_json):
    tests = json.loads(tests_json)
    out = io.StringIO()
    saved = (sys.stdout, sys.stderr, sys.stdin)
    sys.stdout = out
    sys.stderr = out
    sys.stdin = io.StringIO("")

    def logs():
        return out.getvalue().splitlines()[:200]

    try:
        try:
            compiled = compile(code, "main.py", "exec")
        except SyntaxError as err:
            message, line = _describe(err)
            return json.dumps({"ok": False, "error": message, "line": line, "logs": []})

        namespace = {"__name__": "__main__"}
        try:
            exec(compiled, namespace)
        except BaseException as err:  # SystemExit and KeyboardInterrupt too: a learner may call exit()
            message, line = _describe(err)
            return json.dumps({"ok": False, "error": message, "line": line, "logs": logs()})

        results = []
        if mode == "program":
            printed = out.getvalue()
            for i, t in enumerate(tests):
                results.append({"i": i, "pass": _same_output(printed, t["stdout"]), "got": printed})
        else:
            fn = namespace.get(fn_name)
            if not callable(fn):
                return json.dumps({"ok": False, "error": "There is no function called " + fn_name + " — keep its name exactly as given.", "logs": logs()})
            for i, t in enumerate(tests):
                try:
                    got = fn(*json.loads(json.dumps(t["args"])))
                    results.append({"i": i, "pass": _eq(_plain(got), t["expected"]), "got": repr(got)})
                except BaseException as err:
                    message, line = _describe(err)
                    results.append({"i": i, "pass": False, "error": message + (" (line %d)" % line if line else "")})
        return json.dumps({"ok": True, "results": results, "logs": logs()})
    finally:
        sys.stdout, sys.stderr, sys.stdin = saved
