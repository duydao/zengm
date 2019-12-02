const path = require("path");
const { Worker } = require("worker_threads"); // eslint-disable-line
const getSport = require("./getSport");

const watchJS = (addFile, updateStart, updateEnd) => {
	for (const name of ["ui", "worker"]) {
		const filename = `build/gen/${name}.js`;
		addFile(filename);

		// eslint-disable-next-line
		const worker = new Worker(path.join(__dirname, "watchJSWorker.js"), {
			workerData: {
				name,
				sport: getSport(),
			},
		});

		worker.on("message", message => {
			if (message.type === "start") {
				updateStart(filename);
			}
			if (message.type === "end") {
				updateEnd(filename);
			}
		});
	}
};

module.exports = watchJS;
