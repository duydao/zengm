import type { Team } from "../common/types";

export class UserManager {
	constructor(private bbgm: any) {}

	async getTeam(): Promise<Team> {
		const id = this.bbgm.g.get("userTid");
		return await this.bbgm.idb.cache.teams.get(id);
	}
}
