export function getUserTeamId(): number {
	return self.bbgm.g.get("userTid");
}

// Returns the value at a given percentile in a sorted numeric array.
// "Linear interpolation between closest ranks" method
export function percentile(arr: number[], p: number) {
	if (arr.length === 0) return 0;
	if (typeof p !== "number") throw new TypeError("p must be a number");
	if (p <= 0) return arr[0];
	if (p >= 1) return arr[arr.length - 1];

	arr.sort((a, b) => a - b);
	const index = (arr.length - 1) * p,
		lower = Math.floor(index),
		upper = lower + 1,
		weight = index % 1;

	if (upper >= arr.length) return arr[lower];
	return arr[lower] * (1 - weight) + arr[upper] * weight;
}

// Returns the percentile of the given value in a sorted numeric array.
// @ts-ignore
export function percentRank(array, n) {
	let L = 0;
	let S = 0;
	const N = array.length;
	array.sort();

	for (let i = 0; i < array.length; i++) {
		if (array[i] < n) {
			L += 1;
		} else if (array[i] === n) {
			S += 1;
		} else {
		}
	}

	const pct = (L + 0.5 * S) / N;
	return pct;
}
