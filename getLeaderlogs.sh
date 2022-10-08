#!/usr/bin/bash
echo "Running leaderLogsScript..." >&2
echo "Reading env..."  >&2
#source env.cfg
echo "Pool ID $pool_id" >&2

echo "Deleting old stakeSnapshot.json" >&2
rm ./results/stakeSnapshot.json
echo "Running cardano-cli query stake-snapshot..." >&2
cardano-cli query stake-snapshot --stake-pool-id $pool_id --mainnet >> ./results/stakeSnapshot$pool_ticker.json

POOL_STAKE=$(jq .poolStakeMark ./results/stakeSnapshot.json)
echo "POOL_STAKE  $POOL_STAKE"
ACTIVE_STAKE=$(jq .activeStakeMark ./results/stakeSnapshot.json)
echo "ACTIVE STAKE  $ACTIVE_STAKE"

echo "Deleting old leaderlogs.json" >&2
rm ./results/leaderlogs.json
echo "Running CNCLI leaderlog for $pool_id..." >&2
#Taskset is used to assign a task to 0-5 cores (delete taskset -c 0,1,2,3,4,5 if you want to use all cores )
taskset -c 0,1,2,3,4,5 cncli leaderlog --pool-id $pool_id --pool-vrf-skey $vrf_key_location --byron-genesis $byron_genesis_location  --shelley-genesis $shelley_genesis_location  --active-stake $ACTIVE_STAKE --pool-stake $POOL_STAKE --ledger-set $search_type >> ./results/leaderlogs$pool_ticker.json
echo "CNCLI leaderlog FINISHED" >&2
echo "Starting image generation" >&2
sleep 1
curl localhost:8080/trigger?pool=$pool_ticker
sleep 5
echo "Bash script finished"
