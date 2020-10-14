window.addEventListener('load', main);

/**
 * flip a card with given coordinate and uncover neightbours if no mines in area
 * 
 * @param {state} s 
 * @param {number} col 
 * @param {number} row 
 */
function flip(game, col, row)
{
   game.uncover(row, col);
}

/**
 * creates enough cards for largest board (9x9)
 * registers callbacks for cards
 * 
 * @param {state} s 
 */
function prepare_dom(s, timer)
{
   const grid = document.querySelector(".grid");
   const nCards = 24 * 20; // max grid size
   for (let i = 0; i < nCards; i++)
   {
      const card = document.createElement("div");
      card.className = "card";
      card.setAttribute("data-cardInd", i);
      card.addEventListener("click", () =>
      {
         card_click_cb(s, card, i, timer);
      });
      card.addEventListener("contextmenu", (evt) =>
      {
         evt.preventDefault();
         card_contextmenu_cb(s, card, i);
      })
      grid.appendChild(card);
   }
}

/**
 * updates DOM to reflect current state
 * - hides unnecessary cards by setting their display: none
 * - adds "flipped" class to cards that were flipped
 * 
 * @param {MSGame} game 
 */
function render(game)
{
   const grid = document.querySelector(".grid");
   grid.style.gridTemplateColumns = `repeat(${game.ncols}, 1fr)`;
   let currentState = game.getRendering();
   for (let i = 0; i < grid.children.length; i++)
   {
      const card = grid.children[i];
      const ind = Number(card.getAttribute("data-cardInd"));
      if (ind >= game.nrows * game.ncols)
      {
         card.style.display = "none";
      }
      else
      {
         card.style.display = "block";
         const col = ind % game.ncols;
         const row = Math.floor(ind / game.ncols);
         if (currentState[row][col] == "H")
         {
            card.classList.remove("flagged");
            card.classList.remove("uncoveredMine");
            card.classList.remove("uncovered");

            card.classList.add("hidden");
            card.textContent = "";
         }
         else if (currentState[row][col] == "F")
         {
            card.classList.remove("uncoveredMine");
            card.classList.remove("hidden");
            card.classList.remove("uncovered");

            card.classList.add("flagged");
            card.textContent = "";
         }
         else if (currentState[row][col] == "M")
         {
            card.classList.remove("flagged");
            card.classList.remove("hidden");
            card.classList.remove("uncovered");

            card.classList.add("uncoveredMine");
            card.textContent = "";
         }
         else
         {
            card.classList.remove("flagged");
            card.classList.remove("hidden");
            card.classList.remove("uncoveredMine");

            card.classList.add("uncovered");
            card.textContent = currentState[row][col];
         }
      }
   }
}

/**
 * callback for clicking a card
 * - toggle surrounding elements
 * - check for winning condition
 * @param {state} s 
 * @param {HTMLElement} card_div 
 * @param {number} ind 
 */
function card_click_cb(game, card_div, ind, timer)
{
   const col = ind % game.ncols;
   const row = Math.floor(ind / game.ncols);

   flip(game, col, row);
   render(game);
   // check if we won and activate overlay if we did
   if (game.getStatus().done && !game.getStatus().exploded)
   {
      clearInterval(timer.interval);
      timer.interval = 0;
      document.querySelector("#overlay").classList.toggle("active");
   }
   else if (game.getStatus().done)
   {
      console.log("Finishing timer. interval value: " + timer.interval);
      clearInterval(timer.interval);
      timer.interval = 0;
      document.querySelector("#overlayLose").classList.toggle("active");
   }
}

/**
 * callback for right clicking a card
 * - toggle surrounding elements
 * - check for winning condition
 * @param {state} game 
 * @param {HTMLElement} card_div 
 * @param {number} ind 
 */
function card_contextmenu_cb(game, card_div, ind)
{
   const col = ind % game.ncols;
   const row = Math.floor(ind / game.ncols);
   game.mark(row, col);
   render(game);
}

/**
 * callback for the top button
 * - set the state to the requested size
 * - generate a solvable state
 * - render the state
 * 
 * @param {MSGame} game 
 * @param {number} cols 
 * @param {number} rows 
 */
function button_cb(game, cols, rows, timer)
{
   let nMines = 0;
   switch (rows * cols)
   {
      case (8 * 10):
         nMines = 10;
         break;
      case (14 * 18):
         nMines = 40;
         break;
      case (20 * 24):
         nMines = 99;
         break;
   }
   game.init(rows, cols, nMines);
   render(game);

   timer.startTime = new Date().getTime();

   // Timer functions
   function updateTime()
   {
      let current = new Date().getTime();
      let deltaTime = current - timer.startTime;
      document.querySelectorAll(".timer").forEach(
         (e) =>
         {
            e.textContent = new Date(deltaTime).getSeconds();
         }
      )

      console.log("Value of Interval: " + timer.interval);
   }
   if (timer.interval)
   {
      clearInterval(timer.interval);
      timer.interval = 0;
   }
   timer.interval = setInterval(updateTime, 1);
}

function main()
{

   // create state object
   let game = new MSGame();
   let timer = {
      startTime: 0,
      interval: 0,
   }

   // get browser dimensions - not used in thise code
   let html = document.querySelector("html");
   console.log("Your render area:", html.clientWidth, "x", html.clientHeight)

   // register callbacks for buttons
   document.querySelectorAll(".menuButton").forEach((button) =>
   {
      [rows, cols] = button.getAttribute("data-size").split("x").map(s => Number(s));
      button.innerHTML = `${cols} &#x2715; ${rows}`
      button.addEventListener("click", button_cb.bind(null, game, cols, rows, timer));
   });

   // callback for overlay click - hide overlay and regenerate game
   document.querySelectorAll(".overlay").forEach((overlay) =>
   {
      overlay.addEventListener("click", () =>
      {
         if (overlay.classList.contains("active"))
         {
            overlay.classList.remove("active");
            game.init(game.getStatus().nrows, game.getStatus().ncols, game.getStatus().nmines);
            render(game);
         }
      });
   });

   // sound callback
   // let soundButton = document.querySelector("#sound");
   // soundButton.addEventListener("change", () =>
   // {
   //    clickSound.volume = soundButton.checked ? 0 : 1;
   // });


   // create enough cards for largest game and register click callbacks
   prepare_dom(game, timer);

   // simulate pressing 8x10 button to start new game
   button_cb(game, 8, 10, timer);
}
