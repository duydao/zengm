import orderBy from "lodash-es/orderBy";
import range from "lodash-es/range";
import { useEffect, useState } from "react";
import { isSport, PHASE } from "../../common";
import type { Player, RealTeamInfo, View } from "../../common/types";
import useTitleBar from "../hooks/useTitleBar";
import { toWorker } from "../util";
import { applyRealTeamInfos, MAX_SEASON, MIN_SEASON } from "./NewLeague";

const getRandomSeason = () => {
	return Math.floor(Math.random() * (1 + MAX_SEASON - MIN_SEASON)) + MIN_SEASON;
};

const SelectTeam = ({
	realTeamInfo,
}: {
	realTeamInfo: RealTeamInfo | undefined;
}) => {
	const [season, setSeason] = useState(getRandomSeason);
	const [loadingTeams, setLoadingTeams] = useState(true);
	const [tid, setTid] = useState(0);
	const [teams, setTeams] = useState<
		{
			abbrev: string;
			imgURL: string;
			region: string;
			name: string;
			tid: number;
			seasonInfo?: {
				won: number;
				lost: number;
				roundsWonText?: string;
			};
			players: Player[];
			ovr: number;
		}[]
	>([]);

	const loadTeams = async (season: number, randomTeam?: boolean) => {
		setLoadingTeams(true);

		const leagueInfo = await toWorker("main", "getLeagueInfo", {
			type: "real",
			season,
			phase: PHASE.PLAYOFFS,
			randomDebuts: false,
			realDraftRatings: "draft",
			realStats: "none",
			includeSeasonInfo: true,
		});
		const newTeams = orderBy(
			applyRealTeamInfos(leagueInfo.teams, realTeamInfo, season),
			["region", "name", "tid"],
		);

		const prevTeam = teams.find(t => t.tid === tid);
		let newTid;
		if (randomTeam) {
			const index = Math.floor(Math.random() * newTeams.length);
			newTid = newTeams[index].tid;
		} else {
			newTid =
				newTeams.find(t => t.abbrev === prevTeam?.abbrev)?.tid ??
				newTeams.find(t => t.region === prevTeam?.region)?.tid ??
				0;
		}

		setTeams(newTeams as any);
		setTid(newTid);
		setLoadingTeams(false);
	};

	useEffect(() => {
		loadTeams(season, true);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	const t = teams.find(t => t.tid === tid);
	console.log(t);

	return (
		<>
			<form>
				<div className="input-group">
					<select
						className="form-select"
						value={season}
						onChange={async event => {
							const value = parseInt(event.target.value);
							setSeason(value);
							await loadTeams(value);
						}}
						style={{
							maxWidth: 75,
						}}
					>
						{range(MAX_SEASON, MIN_SEASON - 1).map(i => (
							<option key={i} value={i}>
								{i}
							</option>
						))}
					</select>
					<select
						className="form-select"
						value={tid}
						onChange={event => {
							const value = parseInt(event.target.value);
							setTid(value);
						}}
						disabled={loadingTeams}
					>
						{teams.map(t => (
							<option key={t.tid} value={t.tid}>
								{t.region} {t.name}
							</option>
						))}
					</select>
					<button
						className="btn btn-light-bordered"
						type="button"
						disabled={loadingTeams}
						onClick={async () => {
							const randomSeason = getRandomSeason();
							setSeason(randomSeason);
							await loadTeams(randomSeason, true);
						}}
					>
						Random
					</button>
				</div>
			</form>

			<div className="d-flex my-2">
				<div
					style={{ width: 128, height: 128 }}
					className="d-flex align-items-center justify-content-center"
				>
					{t?.imgURL ? (
						<img className="mw-100 mh-100" src={t.imgURL} alt="Team logo" />
					) : null}
				</div>
				{t ? (
					<div className="ms-2" style={{ marginTop: 20 }}>
						<h2>{t.ovr} ovr</h2>
						{t.seasonInfo ? (
							<>
								<h2 className="mb-0">
									{t.seasonInfo.won}-{t.seasonInfo.lost}
								</h2>
								{t.seasonInfo.roundsWonText}
							</>
						) : null}
					</div>
				) : null}
			</div>
			<ul className="list-unstyled mb-0">
				{t?.players.slice(0, 10).map(p => (
					<li key={p.pid}>
						{p.firstName} {p.lastName} - {p.ratings.at(-1).ovr} ovr
					</li>
				))}
			</ul>
		</>
	);
};

const Exhibition = ({ realTeamInfo }: View<"exhibition">) => {
	if (!isSport("basketball")) {
		throw new Error("Not supported");
	}

	useTitleBar({
		title: "Exhibition Game",
		hideNewWindow: true,
	});

	return (
		<div className="row gx-5" style={{ maxWidth: 700 }}>
			<div className="col-12 col-sm-6">
				<h2>Home</h2>
				<SelectTeam realTeamInfo={realTeamInfo} />
			</div>
			<div className="col-12 col-sm-6 mt-3 mt-sm-0">
				<h2>Away</h2>
				<SelectTeam realTeamInfo={realTeamInfo} />
			</div>
		</div>
	);
};

export default Exhibition;
