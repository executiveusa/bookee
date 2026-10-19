VAR brave = 0
VAR gull_friend = false
VAR has_match = false

-> start

=== start ===
# chapter: Chapter 1 - The storm
Nina is staying with her grandmother at the old lighthouse on Cape Tern. Tonight the wind is so loud the windows hum.
Then the great lamp at the top goes dark. Every ship in the bay will be steering by it.
Her grandmother is asleep in the chair, and the stairs go up into the black.
* [Wake her grandmother]
    -> wake_gran
* [Climb the stairs alone]
    ~ brave += 1
    -> stairs
* [Look at the strange little door under the stairs]
    -> lantern_door

=== wake_gran ===
Nina shakes her shoulder. Her grandmother opens one eye, murmurs "Not yet, the tea is still hot," and falls asleep again.
Her hand is warm and does not wake. Nina notices a small brass key on the chain at her neck.
* [Take the key very gently]
    ~ has_match = true
    -> lantern_door
* [Leave her to sleep and climb the stairs]
    ~ brave += 1
    -> stairs

=== stairs ===
# chapter: Chapter 2 - Up
There are ninety-one steps. Nina counts the first forty, then loses count when something white swoops past the window and taps the glass three times.
It is a gull, and it is looking straight at her.
* [Open the window a crack]
    ~ gull_friend = true
    -> gull
* [Ignore it and keep climbing]
    -> top_dark

=== gull ===
The gull hops onto the sill, shakes out its feathers, and says in a voice like a rusty hinge, "Finally. Somebody who opens windows."
It tells her the lamp does not need oil. It needs a light from somewhere else, and the only place to find one is behind the door under the stairs.
* [Go back down to the little door]
    -> lantern_door
* [Ask the gull to fetch the light for her]
    -> gull_trade

=== gull_trade ===
"I could," says the gull, "but it costs a button, and you are wearing exactly one."
Nina looks down at her coat. It is her favorite coat, and the button is the shiny kind.
* [Give the button]
    -> ending_gull
* [Keep the button and go down yourself]
    -> lantern_door

=== top_dark ===
# chapter: Chapter 3 - The dark lamp
At the top, the great glass lens is cold and gray, like a huge eye with its eyelid shut. Far out on the water, a ship's horn sounds, once, long and low.
There is no light here to catch, and no time left to go back down.
* [Shout out the window as loud as she can]
    -> ending_shout
* [Take off her yellow raincoat and hold it to the lens]
    -> ending_coat

=== lantern_door ===
# chapter: Chapter 4 - The door
The door is the size of a cupboard. Behind it, a narrow tunnel runs down, and at the bottom something flickers the soft yellow of a candle.
{has_match: The brass key fits the lock without a sound.|The door is not locked, only stuck, and it opens with a pop like a cork.}
{gull_friend: Above her, the gull taps the window once, as if to say go on.}
* [Crawl down the tunnel]
    -> tunnel
* {brave >= 1} [Go in standing up, like she has done this before]
    -> tunnel_proud

=== tunnel ===
The tunnel smells of rain and old books. At the bottom is a round room, no bigger than a bathtub, and in it sits a lantern with a single blue flame.
A small voice from inside says, "I will give you a light, but you have to tell me the best thing that ever happened to you."
* [Tell the truth, even the embarrassing part]
    -> ending_keeper
* [Make something up that sounds impressive]
    -> fib

=== tunnel_proud ===
Nina keeps her head high, hits it on the ceiling, and says "ow" in a very dignified way.
The little voice laughs. "That will do," it says. "Brave people bump their heads. Take the lantern, but tell me the best thing that ever happened to you."
* [Tell the truth]
    -> ending_keeper
* [Say she would rather not say]
    -> ending_shy

=== fib ===
Nina says she once rode a whale across the sea. The flame turns slowly from blue to green, then to gray.
"A whale," says the voice, "would have said so first."
* [Say sorry, then tell the real story]
    -> ending_keeper
* [Run back up the tunnel]
    -> ending_sleep

=== ending_gull ===
# ending: The Button Bargain
The gull flies off with the button in its beak and returns before the next horn with a spark in its feet, bright as a firefly.
It drops the spark into the great lamp, and the whole bay turns gold. Ships slide past safely all night.
In the morning her grandmother finds a bare thread on Nina's coat and a gull on the roof, wearing a button like a crown.
-> END

=== ending_shout ===
# ending: The Loudest Girl
Nina shouts "Over here! Rocks! Turn left!" until her voice is a croak. The ship hears her over the wind and turns just in time.
She doesn't get the lamp lit. But the captain rows ashore at dawn with a thermos of cocoa and a medal that says Loudest Girl.
-> END

=== ending_coat ===
# ending: The Yellow Beacon
The yellow raincoat catches the last glow of the town lights and throws it across the lens like a small sunrise.
It is not the lamp. But a cold, bright smear of yellow is enough to see by, and Nina stands holding it up until her arms shake and the sky turns pink.
-> END

=== ending_keeper ===
# ending: The Lantern Keeper
Nina tells it about the day her grandmother taught her to whistle through a blade of grass, and how it took until sunset, and how neither of them minded.
The blue flame turns warm gold. The voice says, "Carry me up, keeper." She does, ninety-one steps, and the great lamp wakes with a sound like a long, happy sigh.
Every ship in the bay turns toward home. Her grandmother, awake now, is already pouring two cups of tea.
-> END

=== ending_shy ===
# ending: The Quiet Light
"Fair enough," says the voice. "Some stories are keepers, not tellers."
It gives her a lantern anyway, small and shy, with a flame the size of a bean. It is enough for one ship at a time, and Nina decides that is a fine place to begin.
-> END

=== ending_sleep ===
# ending: The Long Sleep
Nina scrambles up the tunnel, trips on the stairs, and falls asleep in her grandmother's lap before she can feel bad about it.
In the morning the sea is calm, the lamp is lit, and no one will tell her how. Her grandmother just winks, and the kettle starts to sing.
-> END
