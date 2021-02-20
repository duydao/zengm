import { idb } from "../db";
import { g } from "../util";
import orderBy from "lodash/orderBy";
import { DEFAULT_JERSEY } from "../../common";

const updateTeamInfo = async () => {
	const teams = (
		await idb.getCopies.teamsPlus({
			attrs: [
				"tid",
				"abbrev",
				"region",
				"name",
				"imgURL",
				"colors",
				"jersey",
				"did",
				"pop",
				"stadiumCapacity",
				"disabled",
			],
			seasonAttrs: ["pop", "stadiumCapacity"],
			season: g.get("season"),
			addDummySeason: true,
		})
	).map(t => {
		const pop = t.pop ?? t.seasonAttrs.pop;

		return {
			tid: t.tid,
			abbrev: t.abbrev,
			region: t.region,
			name: t.name,
			imgURL: t.imgURL,
			colors: t.colors,
			pop: parseFloat(pop.toFixed(6)),
			stadiumCapacity: t.stadiumCapacity ?? t.seasonAttrs.stadiumCapacity,
			jersey: t.jersey ?? DEFAULT_JERSEY,
			did: t.did,
			disabled: t.disabled,
		};
	});

	return {
		defaultStadiumCapacity: g.get("defaultStadiumCapacity"),
		confs: g.get("confs"),
		divs: g.get("divs"),
		godMode: g.get("godMode"),
		phase: g.get("phase"),
		teams: orderBy(teams, ["region", "name", "tid"]),
	};
};

export default updateTeamInfo;
