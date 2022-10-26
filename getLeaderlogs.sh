#!/usr/bin/bash
echo "Getting Epoch info"
rm ./results/epochInfo.json
cardano-cli query tip --mainnet >> ./results/epochInfo.json

echo "Running leaderLogsScript for VENUS..." >&2
echo "Reading env..."  >&2
#source env.cfg
echo "Pool ID $pool_id" >&2

rm ./results/activeStake.txt
jq '.activeStakeMark' ./results/stakeSnapshotVENUS.json >> ./results/activeStake.txt

echo "Deleting old stakeSnapshot$pool_ticker.json" >&2
rm ./results/stakeSnapshot$pool_ticker.json
echo "Running cardano-cli query stake-snapshot..." >&2
cardano-cli query stake-snapshot --stake-pool-id $pool_id --mainnet >> ./results/stakeSnapshot$pool_ticker.json

POOL_STAKE=$(jq .poolStakeMark ./results/stakeSnapshot$pool_ticker.json)
echo "POOL_STAKE  $POOL_STAKE"
ACTIVE_STAKE=$(jq .activeStakeMark ./results/stakeSnapshot$pool_ticker.json)
echo "ACTIVE STAKE  $ACTIVE_STAKE"

echo "Deleting old leaderlogs.json$pool_ticker" >&2
rm ./results/OLDleaderlogs$pool_ticker.json
cp ./results/leaderlogs$pool_ticker.json ./results/OLDleaderlogs$pool_ticker.json
rm ./results/leaderlogs$pool_ticker.json
echo "Running CNCLI leaderlog for $pool_id..." >&2
#Taskset is used to assign a task to 0-5 cores (delete taskset -c 0,1,2,3,4,5 if you want to use all cores )
taskset -c 0,1,2,3,4,5 cncli leaderlog --pool-id $pool_id --pool-vrf-skey $vrf_key_location --byron-genesis $byron_genesis_location  --shelley-genesis $shelley_genesis_location  --active-stake $ACTIVE_STAKE --pool-stake $POOL_STAKE --ledger-set $search_type >> ./results/leaderlogs$pool_ticker.json
echo "CNCLI leaderlog FINISHED" >&2
echo "Starting image generation" >&2
sleep 1
curl localhost:8080/trigger?pool=$pool_ticker
sleep 1
echo "Bash script finished for VENUS"



##ERA
echo "Running leaderLogsScript for ERA..." >&2
echo "Deleting old stakeSnapshotERA.json" >&2
rm ./results/stakeSnapshotERA.json
echo "Running cardano-cli query stake-snapshot..." >&2
cardano-cli query stake-snapshot --stake-pool-id 13375a4a5470b564246a3251ea0ccfef046ee5bcaf3ed6de6315abc7 --mainnet >> ./results/stakeSnapshotERA.json

POOL_STAKE=$(jq .poolStakeMark ./results/stakeSnapshotERA.json)
echo "POOL_STAKE  $POOL_STAKE"
ACTIVE_STAKE=$(jq .activeStakeMark ./results/stakeSnapshotERA.json)
echo "ACTIVE STAKE  $ACTIVE_STAKE"

echo "Deleting old leaderlogsERA.json" >&2
rm ./results/OLDleaderlogsERA.json
cp ./results/leaderlogsERA.json ./results/OLDleaderlogsERA.json
rm ./results/leaderlogsERA.json
echo "Running CNCLI leaderlog for ERA..." >&2
#Taskset is used to assign a task to 0-5 cores (delete taskset -c 0,1,2,3,4,5 if you want to use all cores )
taskset -c 0,1,2,3,4,5 cncli leaderlog --pool-id 13375a4a5470b564246a3251ea0ccfef046ee5bcaf3ed6de6315abc7 --pool-vrf-skey /opt/cardano/cnode/priv/vrf/era/vrf.skey --byron-genesis $byron_genesis_location  --shelley-genesis $shelley_genesis_location  --active-stake $ACTIVE_STAKE --pool-stake $POOL_STAKE --ledger-set $search_type >> ./results/leaderlogsERA.json
echo "CNCLI leaderlog FINISHED" >&2
echo "Starting image generation" >&2
sleep 1
curl localhost:8080/trigger?pool=ERA
sleep 1
echo "Bash script finished for ERA"

##CPU
echo "Running leaderLogsScript for CPU..." >&2
echo "Deleting old stakeSnapshotCPU.json" >&2
rm ./results/stakeSnapshotCPU.json
echo "Running cardano-cli query stake-snapshot..." >&2
cardano-cli query stake-snapshot --stake-pool-id b45c1860e038baa0642b352ccf447ed5e14430342a11dd75bae52f39 --mainnet >> ./results/stakeSnapshotCPU.json

POOL_STAKE=$(jq .poolStakeMark ./results/stakeSnapshotCPU.json)
echo "POOL_STAKE  $POOL_STAKE"
ACTIVE_STAKE=$(jq .activeStakeMark ./results/stakeSnapshotCPU.json)
echo "ACTIVE STAKE  $ACTIVE_STAKE"

echo "Deleting old leaderlogsCPU.json" >&2
rm ./results/OLDleaderlogsCPU.json
cp ./results/leaderlogsCPU.json ./results/OLDleaderlogsCPU.json
rm ./results/leaderlogsCPU.json
echo "Running CNCLI leaderlog for CPU..." >&2
#Taskset is used to assign a task to 0-5 cores (delete taskset -c 0,1,2,3,4,5 if you want to use all cores )
taskset -c 0,1,2,3,4,5 cncli leaderlog --pool-id b45c1860e038baa0642b352ccf447ed5e14430342a11dd75bae52f39 --pool-vrf-skey /opt/cardano/cnode/priv/vrf/cpu/vrf.skey --byron-genesis $byron_genesis_location  --shelley-genesis $shelley_genesis_location  --active-stake $ACTIVE_STAKE --pool-stake $POOL_STAKE --ledger-set $search_type >> ./results/leaderlogsCPU.json
echo "CNCLI leaderlog FINISHED" >&2
echo "Starting image generation" >&2
sleep 1
curl localhost:8080/trigger?pool=CPU
sleep 1
echo "Bash script finished for CPU"


##MINES
echo "Running leaderLogsScript for MINES..." >&2
echo "Deleting old stakeSnapshotMINES.json" >&2
rm ./results/stakeSnapshotMINES.json
echo "Running cardano-cli query stake-snapshot..." >&2
cardano-cli query stake-snapshot --stake-pool-id 3e5fcbaf750c0291cecb72384091724a1c2d35da10a71473e16c926f --mainnet >> ./results/stakeSnapshotMINES.json

POOL_STAKE=$(jq .poolStakeMark ./results/stakeSnapshotMINES.json)
echo "POOL_STAKE  $POOL_STAKE"
ACTIVE_STAKE=$(jq .activeStakeMark ./results/stakeSnapshotMINES.json)
echo "ACTIVE STAKE  $ACTIVE_STAKE"

echo "Deleting old leaderlogsMINES.json" >&2
rm ./results/OLDleaderlogsMINES.json
cp ./results/leaderlogsMINES.json ./results/OLDleaderlogsMINES.json
rm ./results/leaderlogsMINES.json
echo "Running CNCLI leaderlog for MINES..." >&2
#Taskset is used to assign a task to 0-5 cores (delete taskset -c 0,1,2,3,4,5 if you want to use all cores )
taskset -c 0,1,2,3,4,5 cncli leaderlog --pool-id 3e5fcbaf750c0291cecb72384091724a1c2d35da10a71473e16c926f --pool-vrf-skey /opt/cardano/cnode/priv/vrf/mines/vrf.skey --byron-genesis $byron_genesis_location  --shelley-genesis $shelley_genesis_location  --active-stake $ACTIVE_STAKE --pool-stake $POOL_STAKE --ledger-set $search_type >> ./results/leaderlogsMINES.json
echo "CNCLI leaderlog FINISHED" >&2
echo "Starting image generation" >&2
sleep 1
curl localhost:8080/trigger?pool=MINES
sleep 1
echo "Bash script finished for MINES"

#Restarting cardano-node to flush RAM
sudo systemctl restart cnode.service