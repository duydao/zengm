import { bySport, PHASE, PLAYER } from "../../common";
import type { Phase, Player, ViewInput } from "../../common/types";
import { orderBy } from "../../common/utils";
import { player, team } from "../core";
import { idb } from "../db";
import { g } from "../util";
import addFirstNameShort from "../util/addFirstNameShort";

export const addMood = async (players: Player[]) => {
	const moods: Awaited<ReturnType<(typeof player)["moodInfos"]>>[] = [];
	for (const p of players) {
		moods.push(await player.moodInfos(p));
	}

	return players.map((p, i) => ({
		...p,
		mood: moods[i],
	}));
};

export const freeAgentStats = bySport({
	baseball: ["gp", "keyStats", "war"],
	basketball: ["min", "pts", "trb", "ast", "per"],
	football: ["gp", "keyStats", "av"],
	hockey: ["gp", "keyStats", "ops", "dps", "ps"],
});

const isSeason = (
	season: number | "current",
	toCheck: {
		season: number;
		phase: Phase;
	},
) => {
	let freeAgencySeason;
	if (season === "current") {
		if (g.get("phase") >= PHASE.FREE_AGENCY) {
			freeAgencySeason = g.get("season");
		} else {
			freeAgencySeason = g.get("season") - 1;
		}
	} else {
		// Starting free agency in season, up until right before free agency in season + 1
		freeAgencySeason = season;
	}

	return (
		(toCheck.season === freeAgencySeason &&
			toCheck.phase >= PHASE.FREE_AGENCY) ||
		(toCheck.season === freeAgencySeason + 1 &&
			toCheck.phase < PHASE.FREE_AGENCY)
	);
};

const getPlayers = async (
	season: number | "current",
	type: "both" | "available" | "signed",
) => {
	let available: Player[] = [];
	let signed: Player[] = [];
	let user: Player[] = [];

	if (season === "current") {
		user = await idb.cache.players.indexGetAll(
			"playersByTid",
			g.get("userTid"),
		);

		if (type !== "signed") {
			available = await idb.cache.players.indexGetAll(
				"playersByTid",
				PLAYER.FREE_AGENT,
			);
		}

		if (type !== "available") {
			signed = await idb.cache.players.getAll();
		}
	} else {
		if (type !== "available") {
			signed = await idb.getCopies.players(
				{ activeSeason: season },
				"noCopyCache",
			);
		}
	}

	const processedSigned: (Player & {
		freeAgentType: "signed";
		freeAgentTransaction: Extract<
			NonNullable<Player["transactions"]>[number],
			{ type: "freeAgent" }
		>;
	})[] = [];
	for (const p of signed) {
		const freeAgentTransaction = p.transactions?.findLast(
			row => row.type === "freeAgent" && isSeason(season, row),
		);
		if (freeAgentTransaction) {
			processedSigned.push({
				...p,
				freeAgentType: "signed",

				// @ts-expect-error
				freeAgentTransaction,
			});
		}
	}

	return {
		freeAgents: await addMood([
			...available.map(p => {
				return {
					...p,
					freeAgentType: "available",
				};
			}),
			...processedSigned,
		]),
		user,
	};
};

const updateFreeAgents = async ({ season, type }: ViewInput<"freeAgents">) => {
	const userTid = g.get("userTid");

	const payroll = await team.getPayroll(userTid);
	const playersByType = await getPlayers(season, type);
	const capSpace = (g.get("salaryCap") - payroll) / 1000;

	let players = addFirstNameShort(
		await idb.getCopies.playersPlus(playersByType.freeAgents, {
			attrs: [
				"pid",
				"firstName",
				"lastName",
				"age",
				"contract",
				"injury",
				"watch",
				"jerseyNumber",
				"mood",
				"draft",

				// Added in getPlayers
				"freeAgentType",
				"freeAgentTransaction",
			],
			ratings: ["ovr", "pot", "skills", "pos"],
			stats: freeAgentStats,
			season: g.get("season"),
			showNoStats: true,
			showRookies: true,
			fuzz: true,
			oldStats: true,
		}),
	);

	// Apply contract
	for (const p of players) {
		if (p.freeAgentType === "available") {
			p.contract.amount = p.mood.user.contractAmount / 1000;
		} else {
			let event;
			if (p.freeAgentTransaction.eid !== undefined) {
				event = await idb.getCopy.events({ eid: p.freeAgentTransaction.eid });
			}
			if (event && event.type === "freeAgent" && event.contract) {
				p.contract = {
					amount: event.contract.amount / 1000,
					exp: event.contract.exp,
				};
			} else {
				p.contract = {
					amount: 0,
					exp: p.freeAgentTransaction.season,
				};
			}
		}
	}

	// Default sort, used for the compare players link
	players = orderBy(players, p => p.contract.amount, "desc");

	const userPlayers = await idb.getCopies.playersPlus(playersByType.user, {
		attrs: [],
		ratings: ["pos"],
		stats: [],
		season: g.get("season"),
		showNoStats: true,
		showRookies: true,
	});

	return {
		capSpace,
		challengeNoFreeAgents: g.get("challengeNoFreeAgents"),
		challengeNoRatings: g.get("challengeNoRatings"),
		godMode: g.get("godMode"),
		luxuryPayroll: g.get("luxuryPayroll") / 1000,
		salaryCapType: g.get("salaryCapType"),
		maxContract: g.get("maxContract"),
		minContract: g.get("minContract"),
		numRosterSpots: g.get("maxRosterSize") - userPlayers.length,
		spectator: g.get("spectator"),
		payroll: payroll / 1000,
		phase: g.get("phase"),
		players,
		season,
		stats: freeAgentStats,
		type,
		userPlayers,
	};
};

export default updateFreeAgents;
