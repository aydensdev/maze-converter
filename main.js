const text = document.querySelector("textarea");
const notif = document.getElementById('notification');
const fInput = document.getElementById("fInput")
const canvas = document.querySelector("canvas");
const ctx = canvas.getContext("2d");

var W = 5, res = window.innerHeight * 0.65;
const t = Math.floor(res * 3e-3), delay = 0;
var base = new Array(4).fill(true), grid;

function ResetGrid() 
{
	grid = Array.from({ length: W },
		(_, r) => Array.from({ length: W },
			(_, c) => new Cell(r, c, [...base])
		)
	);
}

// save an int array as maze file

async function SaveBinary(name, typename, arr) 
{
	try 
	{
		var handle = await window.showSaveFilePicker({
			suggestedName: name,
			types: [{
				description: typename,
				accept: { "application/octet-stream": ["." + name.split('.')[1]] },
			}],
		});
		ShowNotif("💾 Exported Maze", "#256f25");
	}
	catch 
	{
		console.log("aborted saving.");
		return;
	};

	const stream = await handle.createWritable();
	const OCTET = "application/octet-stream;charset=ISO-8859-1";
	await stream.write(new Blob([new Uint8Array(arr)], { type: OCTET }));
	await stream.close();
}

// data structure

function Cell(row, col, walls) 
{
	this.x = col; this.y = row;
	this.walls = walls;

	this.visited = false;
	this.previous = -1;
	this.next = -1;
	this.isSolution = true;
	this.dir = [0, 0];
}

// render the maze on the canvas

function renderGrid(cx = -1, cy = -1) 
{
	canvas.width = canvas.height = res;
	const step = canvas.height / W, cstep = Math.ceil(step);

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

function DFSIteration(selected, data, counter, dir) 
{
	selected.visited = true;

	// generate a list of valid neighbors

	var neighbors = []; offsets = [[-1, 0], [0, 1], [1, 0], [0, -1]];
	for (let o = 0; o < 4; o++) 
	{
		let newPos = [selected.x + offsets[o][1], selected.y + offsets[o][0]];
		neighbors.push((
			newPos[0] > -1 && newPos[0] < W &&
			newPos[1] > -1 && newPos[1] < W &&
			!grid[newPos[1]][newPos[0]].visited
		) ? grid[newPos[1]][newPos[0]] : -1);
	};

	// no valid moves, shift backward

	if ((neighbors[0] + neighbors[1] + neighbors[2] + neighbors[3]) == -4) 
	{
		selected = selected.previous;
		return [counter, selected, dir];
	}

	// calculate the next direction

	var nextCell = -1;
	if (counter < data.length) 
	{
		dir = ((dir + data[counter] % 4) + 4) % 4;
		nextCell = neighbors[dir];
		if (nextCell != -1) counter++;
	}

	// if next arr element invalid find random valid move
	// tell the deocoder that it is random and should not be used

	let attempt = 0;
	while (nextCell == -1) 
	{
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

// Notification

function ShowNotif(message, color="#6f2525")
{
	if (notif.ACTIVE) return;
	notif.ACTIVE = true;
	notif.style.top = '3%';

	notif.style.color = color;
	notif.style.borderColor = color;
	notif.innerText = message;

	setTimeout(() => 
	{
		notif.ACTIVE = false;
		notif.style.top = '-5%';
	}, 3100);
}

// Import Button

function DecodeMaze (content)
{
	// extract the maze structure

	var bytes = [], isW = true;
	for (const char of content)
	{
		if (isW)
		{
			W = char.charCodeAt();
			isW = false;
			continue;
		}

		let byte = char.charCodeAt().toString(2);
		byte = "0".repeat(8 - byte.length) + byte;
		bytes.push(byte.substr(0,4));

		let t = byte.substr(4)
		if (t != '0000') bytes.push(t);
	};

	bytes.forEach((walls, idx) => 
	{
		let r = Math.floor(idx / W);
		let c = idx % W;
		grid[r][c].walls = walls.split('').map(x => (x == '1'));
	});

	// we now have a full maze, extract the text inside

	renderGrid(-1, -1);
}

fInput.addEventListener('change', () =>
{
	const file = fInput.files[0];
	const reader = new FileReader();

	if (file.size > 1e5) return;
	const ext = file.name.split('.').pop();

	reader.onload = (e) =>
	{
		switch (ext)
		{
			case 'txt':
				ShowNotif("📥 Imported Text", "#256f25");
				text.value = e.target.result.toString(2);
				break;
			case 'maze':
				ShowNotif("📥 Imported Maze", "#256f25");
				DecodeMaze(e.target.result);
				break;
			default:
				break;
		}
	}

	reader.readAsBinaryString(file);
}, false);

// Export Button

document.getElementById("save").onclick = () => 
{
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

function droppedFile(e) 
{
	text.style.borderStyle = 'solid';
	e.preventDefault();

	const file = e.dataTransfer.files[0];
	const reader = new FileReader();

	if (!file.type.startsWith('text') || file.size > 1e5)
	{
		ShowNotif("Invalid File Dropped.");
		return;
	}

	ShowNotif("📥 Imported File", "#256f25");

	reader.onload = (e) => text.value = e.target.result;
	reader.readAsText(file);
}

// Generate maze from textarea value

function GenerateMaze(isAnimated, retries=0) 
{
	data = [];

	// Convert the letters into 5 ternary digits (base 3)

	for (const char of text.value || "") 
	{
		let trit5 = (char.charCodeAt()-32).toString(3);

		if (trit5.length > 5) 
		{
			ShowNotif("Invalid character(s) detected.")
			return;
		}

		trit5 = (trit5=='-211') ? "11000" : trit5.padStart(5, '0');
		for (const trit of trit5) data.push(trit - 1)
	};

	//console.log("about to encode into maze:", data)

	ResetGrid();
	var start = [Math.floor(W / 2), Math.floor(W / 2)]
	var cursor = grid[start[1]][start[0]], successful = 0, dir = 0;

	while (true) 
	{
		let output = DFSIteration(cursor, data, successful, dir);
		successful = output[0]; cursor = output[1]; dir = output[2];
		if (cursor.x == start[0] && cursor.y == start[1]) break;
	}

	// change succesful to be a bool indicating whether an array element was encoded

	if (successful != data.length)
	{
		if (retries > 30) W++;
		GenerateMaze(false, retries+1);
		return;
	}

	if (successful>0) ShowNotif("🥳 Generated Maze", "#256f25")
	renderGrid(-1, -1);
};

document.getElementById("convert").onclick = () =>
{
	// Estimate how big the maze needs to be 
	if (text.value.length > 0) W = Math.ceil(Math.sqrt(text.value.length*8));
	GenerateMaze();
}

// Generate a blank maze

GenerateMaze();

// function AnimateGeneration(data) {
// 	renderGrid(selected.x, selected.y);
// 	DFSIteration(data);

// 	if ((selected.x === start[0] && selected.y === start[1] && first === false)) {
// 		renderGrid(-1, -1);
// 		console.log("Made " + decisions + " decisions.");
// 		return;
// 	}

// 	first = false;
// 	setTimeout(AnimateGeneration, delay, data);
// }

// if (delay > 0) { /*AnimateGeneration(sampleData)*/ }
// else {  };