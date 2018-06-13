var _U2 = null
export function randn(): number {
    var U1, U2 = _U2, W, mult;
    if (U2) {
        _U2 = null // deactivate for next time
        return U2
    }

    do {
        U1 = -1 + Math.random() * 2;
        U2 = -1 + Math.random() * 2;
        W = U1 * U1 + U2 * U2;
    } while (W >= 1 || W === 0);

    mult = Math.sqrt(-2 * Math.log(W) / W);
    _U2 = U2 * mult;

    return U1 * mult;
}