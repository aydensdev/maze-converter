live-server --ignorePattern=".*\/passkey\.maze(\.crswap)?$"


we are able to store ~(W*W)/8 characters where W is maze width
in other words we need the width should = sqrt(8*char#)
for example


3 functions ->

Generate - generate a maze with encoded text
Decode   - import a .maze file and display the maze and its message



Generate a solvable maze* from given data by either:

	+ generating a gibberish maze from the data and then making it solvable using transforms
	+ replacing a generation algorithm's random decisions with our data and get a perfect maze
      estimate a very small maze size and progressively make it bigger until the data just fits
      (the second method is probably the easier and better choice)


Optionally, the maze can be compressed using the method below:

    - Obtain solution/longest path and try different seed-diffuses until it results in our maze
    - To decode, seed-diffuse the solution and backtrack to convert the maze into data

A* Heuristic Solver


//arr = [72, 101, 108, 108, 111, 44, 32, 87, 111, 114, 108, 100, 33];
//for (var i = 32; i < 128; i++) arr.push(i);

// for (let r = 0; r < W; r++)
// {
//     for (let c = 0; c < W; c++)
//     {
//         if (grid[r][c].previous == -1) continue;
//         if (grid[r][c].isSolution == false) continue;
//         var dirs = [grid[r][c].previous.x - grid[r][c].x, grid[r][c].previous.y - grid[r][c].y];
//         var dirX = dirs[0], dirY = dirs[1];

//         ctx.fillStyle = grid[r][c].visited ? "tomato" : "black";
//         let w =  dirX == 0 ? step*0.1 : dirX*step*1, h = dirY == 0 ? step*0.1 : dirY*step*1;

//         //if (dirY == -1 && grid[r][c])
//         ctx.fillRect (
//             Math.ceil((c+0.5)*step) - step * 0.05,
//             Math.ceil((r+0.5)*step) - step * 0.05,
//             w, h
//         )
//     }
// }
