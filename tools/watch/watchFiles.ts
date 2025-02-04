import { watch } from "chokidar";
import { copyFiles, genRev, reset, setTimestamps } from "../lib/buildFuncs.ts";

// Would be better to only copy individual files on update, but this is fast enough

const watchFiles = async (
	updateStart: (filename: string) => void,
	updateEnd: (filename: string) => void,
	updateError: (filename: string, error: Error) => void,
) => {
	const outFilename = "static files";

	const buildWatchFiles = async () => {
		try {
			updateStart(outFilename);

			await copyFiles(true);

			const rev = genRev();
			setTimestamps(rev, true);
			//minifyIndexHTML();

			updateEnd(outFilename);
		} catch (error) {
			updateError(outFilename, error);
		}
	};

	await reset();
	await buildWatchFiles();

	const watcher = watch(["public", "data", "node_modules/flag-icons"], {});
	watcher.on("change", buildWatchFiles);
};

export default watchFiles;
