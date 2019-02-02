# Snake3D

The classic game of snake in 3D.

To play, navigate to: https://jtgill92.github.io/Snake3D/ (Note: user input is not working in Edge at the moment)

Improvements

This program could be improved most notably by improving the AI. The AI I put in place is not completely random; it is a random algorithm modified such that when the snake is close to a wall the probability of it turning away is higher than it turning towards the wall. Still, this could be much improved. One idea I have is to make the AI snake chase the player or go for the egg depending on which one is closer.

Also, I discovered one small bug that I didn’t have time to fix. Since the respawn locations are fixed, if you time it just right you can cause the AI snake to spawn inside yours and hilarity ensues. I’m not sure if this is a bug or feature at this point.

Differences in browser implementations are causing the user input to not be reqgistered in the Edge browser. This can be resolved by using browser agnostic API calls for user input.
