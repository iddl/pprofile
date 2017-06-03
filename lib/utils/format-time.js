'use babel';

// 3p
import prettyMs from 'pretty-ms';

export default function format(timeMs) {
    if (timeMs > 1) {
        return prettyMs(timeMs, { compact: true });
    } else {
        // need a bit more precision when it's below
        // the 1 ms line
        return prettyMs(timeMs, {
            compact: true,
            msDecimalDigits: 3
        });
    }
}
