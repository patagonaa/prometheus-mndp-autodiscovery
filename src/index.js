const fs = require('fs');
const mndp = require('node-mndp');
const TARGET_FILE = process.env.TARGET_FILE || "/file_sd/targets.json";
const MAX_AGE = parseInt(process.env.MAX_AGE || "300"); // seconds

let nodes = {};

function updateFile() {
	let json = Object.values(nodes).map(node => {
		return {
			labels: {
				macAddress: node.macAddress,
				identity: node.identity == "MikroTik" ? node.macAddress : node.identity
			},
			targets: [node.ipAddress]
		}
	});
	console.info("Exporting ", json);
	fs.writeFileSync(TARGET_FILE, JSON.stringify(json, null, 2) + "\n");
}

function cleanUp() {
	let time = Date.now();
	let maxAgeTime = time - (MAX_AGE * 1000);

	for (let mac in nodes) {
		let node = nodes[mac];
		if (node.time < maxAgeTime) {
			console.info("Removing ", mac)
			delete nodes[mac];
		}
	}
	updateFile();
}


let discovery = new mndp.NodeMndp({
	port: 5678
});

discovery.on('deviceFound', (device) => {
	console.info('Got discovery packet: ', device);
	nodes[device.macAddress] = { ...device, time: Date.now() };
	updateFile();
})

discovery.start();

setInterval(cleanUp, 60 * 1000);
console.info('started.', { TARGET_FILE: TARGET_FILE, MAX_AGE: MAX_AGE });
