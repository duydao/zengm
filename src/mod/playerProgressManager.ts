import type { MinimalPlayerRatings } from "../common/types";

export class PlayerProgressManager {
	constructor(private bbgm: any) {}

	async updateRating(
		ratings: MinimalPlayerRatings,
		key: keyof MinimalPlayerRatings,
		newRating: number,
		age: number,
		coachingRank: number,
	) {
		const oldRating = ratings[key];
		if (ratings.tid && ratings.pid && ratings.tid >= 0 && ratings.pid >= 0) {
			const player = await this.bbgm?.idb.cache.players.get(ratings.pid);
			const diff = newRating - oldRating;
			if (diff != 0) {
				//console.debug("PlayerID ", player.pid + ":", player.firstName, player.lastName, key, oldRating, newRating, (diff < 0 ? "-" : "+") + Math.abs(diff));
			}
		}
		return newRating;
	}
}
