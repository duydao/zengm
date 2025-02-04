import path from "node:path";
import { Worker } from "node:worker_threads";

const watchCSS = async (
	updateStart: (filename: string) => void,
	updateEnd: (filename: string) => void,
	updateError: (filename: string, error: Error) => void,
) => {
	const worker = new Worker(
		path.join(import.meta.dirname, "watchCSSWorker.ts"),
	);

	worker.on("message", message => {
		if (message.type === "start") {
			updateStart(message.filename);
		}
		if (message.type === "end") {
			updateEnd(message.filename);
		}
		if (message.type === "error") {
			updateError(message.filename, message.error);
		}
	});
};

export default watchCSS;
