import { idb } from "../db";
import { g, helpers, processPlayersHallOfFame } from "../util";
import type { UpdateEvents, Player, ViewInput } from "../../common/types";
import { bySport } from "../../common";
import addFirstNameShort from "../util/addFirstNameShort";

const getRelationText = (generation: number, directLine: boolean) => {
	if (generation === 0) {
		return directLine ? "Self" : "Brother";
	}

	if (generation === 1) {
		return directLine ? "Father" : "Uncle";
	}

	if (generation === 2) {
		return directLine ? "Grandfather" : "Great Uncle";
	}

	if (generation === 3) {
		return directLine ? "Great Grandfather" : "2nd Great Uncle";
	}

	if (generation > 3) {
		if (directLine) {
			return `${helpers.ordinal(generation - 2)} Great Grandfather`;
		} else {
			return `${helpers.ordinal(generation - 1)} Great Uncle`;
		}
	}

	if (generation === -1) {
		return directLine ? "Son" : "Nephew";
	}

	if (generation === -2) {
		return directLine ? "Grandson" : "Great Nephew";
	}

	if (generation === -3) {
		return directLine ? "Great Grandson" : "2nd Great Nephew";
	}

	if (generation < -3) {
		if (directLine) {
			return `${helpers.ordinal(Math.abs(generation + 2))} Great Grandson`;
		} else {
			return `${helpers.ordinal(Math.abs(generation + 1))} Great Nephew`;
		}
	}

	return "???";
};

const updatePlayers = async (
	{ pid }: ViewInput<"relatives">,
	updateEvents: UpdateEvents,
	state: any,
) => {
	// In theory should update more frequently, but the list is potentially expensive to update and rarely changes
	if (updateEvents.includes("firstRun") || pid !== state.pid) {
		const stats = bySport({
			baseball: ["gp", "keyStats", "war"],
			basketball: [
				"gp",
				"min",
				"pts",
				"trb",
				"ast",
				"per",
				"ewa",
				"ws",
				"ws48",
			],
			football: ["gp", "keyStats", "av"],
			hockey: ["gp", "keyStats", "ops", "dps", "ps"],
		});

		let playersAll: Player[] = [];
		const generations: number[] = [];

		// Anyone who is directly a father or son of the initial player
		const fatherLinePids = new Set<number>();
		const sonLinePids = new Set<number>();

		if (typeof pid === "number") {
			const pidsSeen = new Set();
			fatherLinePids.add(pid);
			sonLinePids.add(pid);

			const addPlayers = async (
				infos: {
					pid: number;
					generation: number;
				}[],
			) => {
				const players = await idb.getCopies.players(
					{
						pids: infos.map(info => info.pid),
					},
					"noCopyCache",
				);

				const infosNext: typeof infos = [];

				for (const p of players) {
					if (pidsSeen.has(p.pid)) {
						continue;
					}

					const info = infos.find(info => info.pid === p.pid);
					if (!info) {
						continue;
					}

					playersAll.push(p);
					generations.push(info.generation);
					pidsSeen.add(p.pid);

					for (const relative of p.relatives) {
						if (pidsSeen.has(relative.pid)) {
							continue;
						}

						if (fatherLinePids.has(p.pid) && relative.type === "father") {
							console.log(
								`Direct relative from ${p.firstName} ${p.lastName} to`,
								relative,
							);
							fatherLinePids.add(relative.pid);
						}

						if (sonLinePids.has(p.pid) && relative.type === "son") {
							console.log(
								`Direct relative from ${p.firstName} ${p.lastName} to`,
								relative,
							);
							sonLinePids.add(relative.pid);
						}

						let generation = info.generation;
						if (relative.type === "son") {
							generation -= 1;
						} else if (relative.type === "father") {
							generation += 1;
						}

						infosNext.push({
							pid: relative.pid,
							generation,
						});
					}
				}

				if (infosNext.length > 0) {
					await addPlayers(infosNext);
				}
			};

			await addPlayers([
				{
					pid,
					generation: 0,
				},
			]);
			console.log(
				playersAll.map(p => p.pid),
				fatherLinePids,
				sonLinePids,
			);
		} else {
			playersAll = await idb.getCopies.players(
				{
					filter: p => p.relatives.length > 0,
				},
				"noCopyCache",
			);
		}

		const players = await idb.getCopies.playersPlus(playersAll, {
			attrs: [
				"pid",
				"firstName",
				"lastName",
				"draft",
				"retiredYear",
				"statsTids",
				"hof",
				"relatives",
				"numBrothers",
				"numFathers",
				"numSons",
				"college",
				"jerseyNumber",
			],
			ratings: ["ovr", "pos"],
			stats: ["season", "abbrev", "tid", ...stats],
			fuzz: true,
		});
		if (generations.length > 0) {
			for (let i = 0; i < players.length; i++) {
				if (generations[i] === undefined) {
					break;
				}
				const p = players[i];
				p.relationText = getRelationText(
					generations[i],
					fatherLinePids.has(p.pid) || sonLinePids.has(p.pid),
				);
			}
		}

		console.log(
			players.map(p => `${p.firstName} ${p.lastName} ||| ${p.generation}`),
		);

		return {
			challengeNoRatings: g.get("challengeNoRatings"),
			pid,
			players: addFirstNameShort(processPlayersHallOfFame(players)),
			stats,
			userTid: g.get("userTid"),
		};
	}
};

export default updatePlayers;
