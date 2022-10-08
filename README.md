# leaderLogsNode

This is a small node.js server that queries cardano-cli and cncli for leaderlogs, saves the info in json and with that information creates png image with info about pool slot assignments.

The script assumes that `cncli.db` is in the root of this repository.

The rest is pretty straightforward

1. Create your `.env` file (based on `.env.sample`)
2. `npm i`
3. `node node.js`

The script will start querying cncli and cardano-cli, and it will make a schedule to do the same in 5 days
