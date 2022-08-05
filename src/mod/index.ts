import { PlayerProgressManager } from "./playerProgressManager";
import { TeamManager } from "./teamManager";

export function initMods(bbgm: any) {
	return {
		playerProgressManager: new PlayerProgressManager(bbgm),
		teamManager: new TeamManager(bbgm),
	};
}
