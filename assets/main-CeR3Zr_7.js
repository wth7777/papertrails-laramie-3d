import "./modulepreload-polyfill-DIeKMq_K.js";
import { C as QUALITY, E as Vector3, S as TILE_SIZE, T as Scene, _ as loadAssets, a as createDayNight, b as bus, c as createPost, d as createRenderer, f as createFollowCamera, g as createWFC, h as createWorld, i as createLife, l as createLights, m as createTraveller, n as createGame, o as createMusic, p as createControls, r as createAnimals, s as createPaperAudio, t as createViews, u as createMaterials, v as createLoop, w as MeshDepthMaterial, x as CONFIG, y as state } from "./laramie-LJpV5Srz.js";
// src/main.js
var hypot2 = (a, b) => Math.sqrt(a * a + b * b);
var params = new URLSearchParams(location.search);
var seedParam = parseInt(params.get("seed") ?? "", 10);
var seed = Number.isFinite(seedParam) ? seedParam : CONFIG.DEFAULT_SEED;
var quality = QUALITY[params.get("quality")] ? params.get("quality") : CONFIG.DEFAULT_QUALITY;
var muted = params.get("mute") === "1";
var showHint = params.get("hint") !== "0";
var enableDiag = params.get("diag") === "1";
var diagOverlay = null;
var diagLogs = [];
var MAX_DIAG_LOGS = 200;
var diagStep = 0;
function diagLog(...args) {
	const msg = args.map((a) => a && a.stack ? a.stack : String(a)).join(" ");
	const entry = {
		t: Date.now(),
		step: ++diagStep,
		msg
	};
	diagLogs.push(entry);
	if (diagLogs.length > MAX_DIAG_LOGS) diagLogs.shift();
	if (enableDiag) console.log("[DIAG]", ...args);
}
function diagError(...args) {
	const msg = args.map((a) => a && a.stack ? a.stack : String(a)).join(" ");
	const entry = {
		t: Date.now(),
		step: ++diagStep,
		msg,
		error: true
	};
	diagLogs.push(entry);
	if (diagLogs.length > MAX_DIAG_LOGS) diagLogs.shift();
	if (enableDiag) console.error("[DIAG]", ...args);
}
function createDiagOverlay() {
	if (!enableDiag) return;
	const el = document.createElement("div");
	el.id = "diag-overlay";
	el.style.cssText = "position:fixed;top:0;left:0;right:0;background:#0a0a0a;color:#0f0;font:11px/1.4 monospace;padding:8px;z-index:9999;max-height:50vh;overflow:auto;border-bottom:2px solid #0f0;font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;";
	el.innerHTML = "<b>DIAGNOSTIC MODE</b> — initializing...";
	document.body.appendChild(el);
	diagOverlay = el;
	setInterval(() => {
		if (!diagOverlay) return;
		const lines = diagLogs.slice(-80).map((e) => {
			return (e.error ? "✗ " : "✓ ") + e.msg;
		});
		diagOverlay.innerHTML = "<b>DIAGNOSTIC MODE</b> — frame: " + (window.loop?.frame ?? "—") + "<br>" + lines.join("<br>");
	}, 200);
}
window.addEventListener("error", (e) => {
	diagError("Uncaught error:", e.error?.stack || e.message || "Script error.", "at", e.filename ? `${e.filename}:${e.lineno}:${e.colno}` : ":0");
});
window.addEventListener("unhandledrejection", (e) => {
	const reason = e.reason;
	diagError("Unhandled rejection:", reason?.stack || reason?.message || String(reason));
});
state.seed = seed;
state.quality = quality;
async function boot() {
	createDiagOverlay();
	diagLog("boot() started");
	const canvas = document.getElementById("atlas");
	const hint = document.getElementById("hint");
	diagLog("canvas & hint elements:", !!canvas, !!hint);
	const scene = new Scene();
	diagLog("THREE.Scene created");
	const { renderer, setSize: setRendererSize } = createRenderer({
		canvas,
		quality
	});
	diagLog("renderer created");
	const materials = createMaterials({ quality });
	diagLog("materials created");
	const assets = await loadAssets({
		materials,
		renderer,
		quality
	});
	diagLog("assets loaded");
	materials.setTextures(assets.textures);
	diagLog("materials textures set");
	const lights = createLights({
		scene,
		quality
	});
	diagLog("lights created");
	const wfc = createWFC({ seed });
	diagLog("WFC created");
	const world = createWorld({
		scene,
		assets,
		wfc,
		materials,
		quality
	});
	diagLog("world created");
	const traveller = createTraveller({
		scene,
		assets,
		world,
		materials
	});
	diagLog("traveller created");
	const follow = createFollowCamera({ aspect: window.innerWidth / Math.max(1, window.innerHeight) });
	diagLog("follow camera created");
	const controls = createControls({
		domElement: canvas,
		camera: follow.camera,
		traveller
	});
	diagLog("controls created");
	const views = createViews({ follow });
	diagLog("views created");
	const post = createPost({
		renderer,
		scene,
		camera: follow.camera,
		quality
	});
	diagLog("post-processing created");
	const audio = createPaperAudio({ muted });
	diagLog("audio created");
	const music = createMusic({ audio });
	diagLog("music created");
	const daynight = createDayNight({
		scene,
		night: params.get("night") === "1"
	});
	diagLog("daynight created");
	const life = params.get("life") === "0" || CONFIG.life.enabled === false ? null : createLife({
		scene,
		assets,
		wfc,
		world,
		daynight,
		camera: follow.camera,
		quality,
		seed
	});
	diagLog("life created:", !!life);
	const animals = params.get("animals") === "0" || CONFIG.animals.enabled === false ? null : createAnimals({
		scene,
		renderer,
		world,
		wfc,
		traveller,
		daynight,
		assets,
		seed,
		quality
	});
	diagLog("animals created:", !!animals);
	const game = createGame({
		scene,
		renderer,
		world,
		wfc,
		traveller,
		follow,
		controls,
		lights,
		post,
		daynight,
		music,
		audio,
		life,
		assets,
		materials,
		seed,
		quality
	});
	diagLog("game created");
	follow.setAssistGate(game.modal);
	diagLog("assist gate set");
	window.addEventListener("keydown", (e) => {
		if (e.repeat || e.ctrlKey || e.metaKey || e.altKey) return;
		if (e.code === "KeyN") daynight.toggle();
		else if (e.code === "KeyV" && !game.modal()) views.next();
		else if (e.code === "KeyM") music.toggle();
	});
	const plainDepth = new MeshDepthMaterial();
	scene.traverse((o) => {
		if (o.isMesh && !o.isBatchedMesh && !o.isInstancedMesh && o.castShadow && !o.customDepthMaterial) o.customDepthMaterial = plainDepth;
	});
	const idle = {
		x: 0,
		z: 0
	};
	const _right = new Vector3();
	function update(dt) {
		try {
			state.time = loop.time;
			state.frame = loop.frame;
			const input = controls.getInput(dt) || idle;
			traveller.update(dt, game.modal() ? idle : input);
			const p = traveller.position;
			const t = state.traveller;
			t.x = p.x;
			t.y = p.y;
			t.z = p.z;
			t.dirX = traveller.moveDir.x;
			t.dirZ = traveller.moveDir.z;
			t.speed = traveller.speed;
			_right.setFromMatrixColumn(follow.camera.matrixWorld, 0);
			const rl = hypot2(_right.x, _right.z) || 1;
			state.listener.x = p.x;
			state.listener.z = p.z;
			state.listener.rightX = _right.x / rl;
			state.listener.rightZ = _right.z / rl;
			world.update(dt, p, traveller.moveDir);
			views.update(dt);
			follow.update(dt, traveller);
			daynight.update(dt);
			if (life) life.update(dt, p, follow.camera);
			if (animals) animals.update(dt);
			game.update(dt);
			lights.update(dt, traveller, follow.camera);
			materials.update(dt);
			if (enableDiag && loop.frame < 5) diagLog("update frame", loop.frame, "OK");
		} catch (e) {
			diagError("update threw:", e);
			throw e;
		}
	}
	function render(dt) {
		try {
			post.setFocus(follow.focusPoint);
			post.render(dt);
			game.atlasmap.render();
			if (enableDiag && loop.frame < 5) diagLog("render frame", loop.frame, "OK");
		} catch (e) {
			diagError("render threw:", e);
			throw e;
		}
	}
	const loop = createLoop({
		update,
		render
	});
	diagLog("loop created");
	function resize() {
		const w = Math.max(1, window.innerWidth);
		const h = Math.max(1, window.innerHeight);
		setRendererSize(w, h);
		follow.setAspect(w / h);
		post.setSize(w, h);
		bus.emit("resize", {
			width: w,
			height: h,
			dpr: renderer.getPixelRatio()
		});
	}
	window.addEventListener("resize", resize);
	if (showHint) {
		hint.classList.add("on");
		bus.once("input:first", () => hint.classList.remove("on"));
	} else hint.remove();
	function initialPosition() {
		const x = 0;
		const z = 0;
		if (world.isWalkable(x, z)) return [x, z];
		for (let r = .25; r <= TILE_SIZE * 3; r += .25) for (let i = 0; i < 16; i++) {
			const a = i / 16 * Math.PI * 2;
			const nx = x + Math.cos(a) * r;
			const nz = z + Math.sin(a) * r;
			if (world.isWalkable(nx, nz)) return [nx, nz];
		}
		return [x, z];
	}
	if (animals) await animals.ready;
	diagLog("animals ready");
	resize();
	diagLog("resize done");
	const [x, z] = initialPosition();
	diagLog("initial position:", x, z);
	traveller.teleport(x, z);
	diagLog("traveller teleported");
	controls.clearTarget();
	diagLog("controls cleared");
	update(0);
	diagLog("update(0) done");
	follow.snap(traveller);
	diagLog("follow snapped");
	_right.setFromMatrixColumn(follow.camera.matrixWorld, 0);
	const rl = hypot2(_right.x, _right.z) || 1;
	state.listener.rightX = _right.x / rl;
	state.listener.rightZ = _right.z / rl;
	diagLog("listener init done");
	if (world.faceCamera) world.faceCamera();
	diagLog("faceCamera done");
	if (life) life.update(0, traveller.position, follow.camera);
	diagLog("life update(0) done");
	lights.update(0, traveller, follow.camera);
	diagLog("lights update(0) done");
	render(0);
	diagLog("render(0) done — FIRST FRAME");
	window.__debug = {
		loop,
		game,
		traveller,
		world,
		wfc,
		renderer,
		scene,
		camera: follow.camera,
		assets,
		materials,
		post,
		follow,
		controls,
		views,
		lights,
		audio,
		music,
		daynight,
		life,
		animals,
		state
	};
	diagLog("__debug exposed");
	loop.start();
	diagLog("loop.start() called — ANIMATION LOOP STARTED");
}
boot().catch((err) => {
	diagError("[atlas] boot failed", err);
	console.error("[atlas] boot failed", err);
	throw err;
});
