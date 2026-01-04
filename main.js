const text = document.querySelector("textarea");
const fInput = document.getElementById("fInput")
const canvas = document.querySelector("canvas");
const ctx = canvas.getContext("2d");

var W = 5, res = window.innerHeight * 0.65;
const t = Math.floor(res * 3e-3), delay = 0;
var base = new Array(4).fill(true), grid;

function ResetGrid() {
	grid = Array.from({ length: W },
		(_, r) => Array.from({ length: W },
			(_, c) => new Cell(r, c, [...base])
		)
	);
}

// save an int array as maze file

async function SaveBinary(name, typename, arr) {
	try {
		var handle = await window.showSaveFilePicker({
			suggestedName: name,
			types: [{
				description: typename,
				accept: { "application/octet-stream": ["." + name.split('.')[1]] },
			}],
		});
	}
	catch { return };

	const stream = await handle.createWritable();
	const OCTET = "application/octet-stream;charset=ISO-8859-1";
	await stream.write(new Blob([new Uint8Array(arr)], { type: OCTET }));
	await stream.close();
}

// data structure

function Cell(row, col, walls) {
	this.x = col; this.y = row;
	this.walls = walls;

	this.visited = false;
	this.previous = -1;
	this.next = -1;
	this.isSolution = true;
	this.dir = [0, 0];
}

// render the maze on the canvas

function renderGrid(cx = -1, cy = -1) {
	canvas.width = canvas.height = res;
	//canvas.style.borderWidth = t/2;
	const step = canvas.height / W, cstep = Math.ceil(step);
	//canvas.style.display = "unset";

	for (let r = 0; r < W; r++) {
		for (let c = 0; c < W; c++) {
			ctx.fillStyle = grid[r][c].visited ? "white" : "black";
			if (cx == c && cy == r) ctx.fillStyle = "tomato";
			ctx.fillRect(Math.floor(c * step), Math.floor(r * step), cstep, cstep);
		}
	}

	ctx.fillStyle = "black";
	for (let r = 0; r < W; r++) {
		for (let c = 0; c < W; c++) {
			if (grid[r][c].walls[0]) ctx.fillRect(c * step - t, r * step, step + (2 * t), t);
			if (grid[r][c].walls[1]) ctx.fillRect(((c + 1) * step) - t, r * step, t, step);
			if (grid[r][c].walls[2]) ctx.fillRect(c * step - t, ((r + 1) * step) - t, step + (2 * t), t); //+(t*(c==W-1))
			if (grid[r][c].walls[3]) ctx.fillRect(c * step, r * step, t, step);


		}
	}
}

function DFSIteration(selected, data, counter, dir) {
	selected.visited = true;

	// generate a list of valid neighbors

	var neighbors = []; offsets = [[-1, 0], [0, 1], [1, 0], [0, -1]];
	for (let o = 0; o < 4; o++) {
		let newPos = [selected.x + offsets[o][1], selected.y + offsets[o][0]];
		neighbors.push((
			newPos[0] > -1 && newPos[0] < W &&
			newPos[1] > -1 && newPos[1] < W &&
			!grid[newPos[1]][newPos[0]].visited
		) ? grid[newPos[1]][newPos[0]] : -1);
	};

	// no valid moves, shift backward

	if ((neighbors[0] + neighbors[1] + neighbors[2] + neighbors[3]) == -4) {
		selected = selected.previous;
		return [counter, selected, dir];
	}

	// calculate the next direction

	var nextCell = -1;
	if (counter < data.length) {
		dir = ((dir + data[counter] % 4) + 4) % 4;
		nextCell = neighbors[dir];

		if (nextCell != -1) {
			console.log("Encoded Array Element!");
			counter++;
		}
	}

	// if next arr element invalid find random valid move
	// tell the deocoder that it is random and should not be used

	let attempt = 0;
	while (nextCell == -1) {
		dir = Math.round(Math.random() * 3);
		nextCell = neighbors[dir];
	}

	// remove the wall in between cells

	selected.next = nextCell; nextCell.previous = selected;
	var dirX = Math.sign(nextCell.x - selected.x);
	var dirY = Math.sign(nextCell.y - selected.y);

	if (dirX != 0) // horizontal walls gone
	{
		selected.walls[2 - dirX] = false;
		nextCell.walls[2 + dirX] = false;
	}

	if (dirY != 0) // vertical walls gone
	{
		selected.walls[1 + dirY] = false;
		nextCell.walls[1 - dirY] = false;
	}

	return [counter, nextCell, dir];
}

// Import Button

fInput.addEventListener('change', function () {
	const file = fInput.files[0];
	const reader = new FileReader();

	if (file.size > 1e5) return;
	const ext = file.name.split('.').pop();
	
	reader.onload = (e) =>
	{
		if (ext == 'txt') text.value = e.target.result.toString(2)
		else if (ext == 'maze')
		{
			var bytes = [], isW = true;
			for (const char of e.target.result)
			{
				if (isW)
				{
					W = char.charCodeAt();
					isW = false;
					console.log("Set Width:", W);
					continue;
				}

				let byte = char.charCodeAt().toString(2);
				byte.padStart('0', 8);
				bytes.push(byte.substr(0,4), byte.substr(4));
			};

			bytes.forEach((walls, idx) => 
			{
				let r = Math.floor(idx / W);
				let c = idx % W;
				grid[r][c].walls = walls.split('').map(x => (x == '1'));
			});

			renderGrid(-1, -1);
		}
	}

	reader.readAsBinaryString(file);
}, false);

// Export Button

document.getElementById("save").onclick = () => {
	var arr = [W], buffer = ''; // 1 byte for the width

	for (let r = 0; r < W; r++) 
	{
		for (let c = 0; c < W; c++) 
		{
			let data = grid[r][c].walls;
			buffer += data.map(x => x ? 1 : 0).join('');

			// if we have an uneven number pairs add a blank
			// the decoder can tell as the width won't match up

			buffer += (r == W - 1 && c == W - 1) ? '0000' : '';

			// byte accumulated, save it

			if (buffer.length == 8) {
				arr.push(parseInt(buffer, 2));
				buffer = '';
			}
		}
	}

	SaveBinary("passkey.maze", "Maze File", arr);
};

// Handle drag and drop files

text.addEventListener("dragenter", () => {
	text.style.borderStyle = 'dashed';
}, false);

text.addEventListener("dragleave", () => {
	text.style.borderStyle = 'solid';
}, false);

function droppedFile(e) {
	e.preventDefault();

	const file = e.dataTransfer.files[0];
	const reader = new FileReader();

	if (!file.type.startsWith('text') || file.size > 1e5) return;
	reader.onload = (e) => text.value = e.target.result;
	reader.readAsText(file);
}

// Generate maze from textarea value

function GenerateMaze(isAnimated) {
	// Convert the letters into 5 ternary digits (base 3)

	data = [];

	for (const char of text.value || "") {
		let trit5 = (char.charCodeAt() - 32).toString(3);

		if (trit5.length > 5) {
			alert("Invalid character detected!");
			return;
		}

		trit5 = "0".repeat(5 - trit5.length) + trit5;
		for (const trit of trit5) data.push(trit - 1)
	};

	ResetGrid();
	var start = [Math.floor(W / 2), Math.floor(W / 2)]
	var cursor = grid[start[1]][start[0]], counter = 0, dir = 0;

	while (true) {
		let output = DFSIteration(cursor, data, counter, dir);
		counter = output[0]; cursor = output[1]; dir = output[2];
		if (cursor.x == start[0] && cursor.y == start[1]) break;
	}
	renderGrid(-1, -1);
};

document.getElementById("convert").onclick = GenerateMaze;

// Generate a blank maze

GenerateMaze();

// var sampleData = [-1, 0, 1, -1, 0, 1];
// regularGenerate(sampleData);

function AnimateGeneration(data) {
	renderGrid(selected.x, selected.y);
	DFSIteration(data);

	if ((selected.x === start[0] && selected.y === start[1] && first === false)) {
		renderGrid(-1, -1);
		console.log("Made " + decisions + " decisions.");
		return;
	}

	first = false;
	setTimeout(AnimateGeneration, delay, data);
}

// if (delay > 0) { /*AnimateGeneration(sampleData)*/ }
// else {  };
