#!/usr/bin/bash
export CARDANO_NODE_SOCKET_PATH=/opt/cardano/cnode/sockets/node.socket
echo "Getting Epoch info"
rm ./results/epochInfo.json
cardano-cli query tip --mainnet >> ./results/epochInfo.json

echo "PORT $port" >&2

echo "Running leaderLogsScript for VENUS..." >&2
echo "Reading env..."  >&2
#source env.cfg
echo "Pool ID $pool_id" >&2



echo "Deleting old stakeSnapshot$pool_ticker.json" >&2
rm ./results/stakeSnapshot$pool_ticker.json
echo "Running cardano-cli query stake-snapshot..." >&2
cardano-cli query stake-snapshot --stake-pool-id $pool_id --mainnet >> ./results/stakeSnapshot$pool_ticker.json
# Hardcoded JSON file path
json_file="./results/stakeSnapshotVENUS.json"

rm ./results/activeStake.txt
jq -r '.total.stakeMark' "$json_file" >> ./results/activeStake.txt


# Extract the pool ID dynamically
pool_id=$(jq -r '.pools | keys[]' "$json_file")

# Extract the "stakeMark" value for the dynamic pool ID
POOL_STAKE=$(jq -r ".pools.\"$pool_id\".stakeMark" "$json_file")

# Extract the "stakeMark" value from the "total" object
ACTIVE_STAKE=$(jq -r '.total.stakeMark' "$json_file")


echo "POOL_STAKE: $POOL_STAKE"
echo "ACTIVE_STAKE: $ACTIVE_STAKE"

echo "Deleting old leaderlogs.json$pool_ticker" >&2
rm ./results/OLDleaderlogs$pool_ticker.json
cp ./results/leaderlogs$pool_ticker.json ./results/OLDleaderlogs$pool_ticker.json
rm ./results/leaderlogs$pool_ticker.json
echo "Running CNCLI leaderlog for $pool_id..." >&2
#Taskset is used to assign a task to 0-5 cores (delete taskset -c 0,1,2,3,4,5 if you want to use all cores )
taskset -c 0,1,2,3,4,5 cncli leaderlog   --consensus cpraos --pool-id $pool_id --pool-vrf-skey $vrf_key_location --byron-genesis $byron_genesis_location  --shelley-genesis $shelley_genesis_location  --active-stake $ACTIVE_STAKE --pool-stake $POOL_STAKE --ledger-set $search_type >> ./results/leaderlogs$pool_ticker.json
echo "CNCLI leaderlog FINISHED" >&2
echo "Starting image generation" >&2
sleep 1
curl localhost:$port/trigger?pool=$pool_ticker
sleep 1
echo "Bash script finished for VENUS"



##ERA
echo "Running leaderLogsScript for ERA..." >&2
echo "Deleting old stakeSnapshotERA.json" >&2
rm ./results/stakeSnapshotERA.json
echo "Running cardano-cli query stake-snapshot..." >&2
cardano-cli query stake-snapshot --stake-pool-id 13375a4a5470b564246a3251ea0ccfef046ee5bcaf3ed6de6315abc7 --mainnet >> ./results/stakeSnapshotERA.json


# Hardcoded JSON file path
json_file="./results/stakeSnapshotERA.json"

# Extract the pool ID dynamically
pool_id=$(jq -r '.pools | keys[]' "$json_file")

# Extract the "stakeMark" value for the dynamic pool ID
POOL_STAKE=$(jq -r ".pools.\"$pool_id\".stakeMark" "$json_file")

# Extract the "stakeMark" value from the "total" object
ACTIVE_STAKE=$(jq -r '.total.stakeMark' "$json_file")

echo "POOL_STAKE: $POOL_STAKE"
echo "ACTIVE_STAKE: $ACTIVE_STAKE"

echo "Deleting old leaderlogsERA.json" >&2
rm ./results/OLDleaderlogsERA.json
cp ./results/leaderlogsERA.json ./results/OLDleaderlogsERA.json
rm ./results/leaderlogsERA.json
echo "Running CNCLI leaderlog for ERA..." >&2
#Taskset is used to assign a task to 0-5 cores (delete taskset -c 0,1,2,3,4,5 if you want to use all cores )
taskset -c 0,1,2,3,4,5 cncli leaderlog  --consensus cpraos --pool-id 13375a4a5470b564246a3251ea0ccfef046ee5bcaf3ed6de6315abc7 --pool-vrf-skey /opt/cardano/cnode/priv/vrf/era/vrf.skey --byron-genesis $byron_genesis_location  --shelley-genesis $shelley_genesis_location  --active-stake $ACTIVE_STAKE --pool-stake $POOL_STAKE --ledger-set $search_type >> ./results/leaderlogsERA.json
echo "CNCLI leaderlog FINISHED" >&2
echo "Starting image generation" >&2
sleep 1
curl localhost:$port/trigger?pool=ERA
sleep 1
echo "Bash script finished for ERA"

##CPU
echo "Running leaderLogsScript for CPU..." >&2
echo "Deleting old stakeSnapshotCPU.json" >&2
rm ./results/stakeSnapshotCPU.json
echo "Running cardano-cli query stake-snapshot..." >&2
cardano-cli query stake-snapshot --stake-pool-id b45c1860e038baa0642b352ccf447ed5e14430342a11dd75bae52f39 --mainnet >> ./results/stakeSnapshotCPU.json

# Hardcoded JSON file path
json_file="./results/stakeSnapshotCPU.json"

# Extract the pool ID dynamically
pool_id=$(jq -r '.pools | keys[]' "$json_file")

# Extract the "stakeMark" value for the dynamic pool ID
POOL_STAKE=$(jq -r ".pools.\"$pool_id\".stakeMark" "$json_file")

# Extract the "stakeMark" value from the "total" object
ACTIVE_STAKE=$(jq -r '.total.stakeMark' "$json_file")

echo "POOL_STAKE: $POOL_STAKE"
echo "ACTIVE_STAKE: $ACTIVE_STAKE"


echo "Deleting old leaderlogsCPU.json" >&2
rm ./results/OLDleaderlogsCPU.json
cp ./results/leaderlogsCPU.json ./results/OLDleaderlogsCPU.json
rm ./results/leaderlogsCPU.json
echo "Running CNCLI leaderlog for CPU..." >&2
#Taskset is used to assign a task to 0-5 cores (delete taskset -c 0,1,2,3,4,5 if you want to use all cores )
taskset -c 0,1,2,3,4,5 cncli leaderlog  --consensus cpraos --pool-id b45c1860e038baa0642b352ccf447ed5e14430342a11dd75bae52f39 --pool-vrf-skey /opt/cardano/cnode/priv/vrf/cpu/vrf.skey --byron-genesis $byron_genesis_location  --shelley-genesis $shelley_genesis_location  --active-stake $ACTIVE_STAKE --pool-stake $POOL_STAKE --ledger-set $search_type >> ./results/leaderlogsCPU.json
echo "CNCLI leaderlog FINISHED" >&2
echo "Starting image generation" >&2
sleep 1
curl localhost:$port/trigger?pool=CPU
sleep 1
echo "Bash script finished for CPU"


##MINES
echo "Running leaderLogsScript for MINES..." >&2
echo "Deleting old stakeSnapshotMINES.json" >&2
rm ./results/stakeSnapshotMINES.json
echo "Running cardano-cli query stake-snapshot..." >&2
cardano-cli query stake-snapshot --stake-pool-id 3e5fcbaf750c0291cecb72384091724a1c2d35da10a71473e16c926f --mainnet >> ./results/stakeSnapshotMINES.json

# Hardcoded JSON file path
json_file="./results/stakeSnapshotMINES.json"

# Extract the pool ID dynamically
pool_id=$(jq -r '.pools | keys[]' "$json_file")

# Extract the "stakeMark" value for the dynamic pool ID
POOL_STAKE=$(jq -r ".pools.\"$pool_id\".stakeMark" "$json_file")

# Extract the "stakeMark" value from the "total" object
ACTIVE_STAKE=$(jq -r '.total.stakeMark' "$json_file")

echo "POOL_STAKE: $POOL_STAKE"
echo "ACTIVE_STAKE: $ACTIVE_STAKE"
echo "Deleting old leaderlogsMINES.json" >&2
rm ./results/OLDleaderlogsMINES.json
cp ./results/leaderlogsMINES.json ./results/OLDleaderlogsMINES.json
rm ./results/leaderlogsMINES.json
echo "Running CNCLI leaderlog for MINES..." >&2
#Taskset is used to assign a task to 0-5 cores (delete taskset -c 0,1,2,3,4,5 if you want to use all cores )
taskset -c 0,1,2,3,4,5 cncli leaderlog  --consensus cpraos --pool-id 3e5fcbaf750c0291cecb72384091724a1c2d35da10a71473e16c926f --pool-vrf-skey /opt/cardano/cnode/priv/vrf/mines/vrf.skey --byron-genesis $byron_genesis_location  --shelley-genesis $shelley_genesis_location  --active-stake $ACTIVE_STAKE --pool-stake $POOL_STAKE --ledger-set $search_type >> ./results/leaderlogsMINES.json
echo "CNCLI leaderlog FINISHED" >&2
echo "Starting image generation" >&2
sleep 1
curl localhost:$port/trigger?pool=MINES
sleep 1
echo "Bash script finished for MINES"




##CAHLI
echo "Running leaderLogsScript for CAHLI..." >&2
echo "Deleting old stakeSnapshotCAHLI.json" >&2
rm ./results/stakeSnapshotCAHLI.json
echo "Running cardano-cli query stake-snapshot..." >&2
cardano-cli query stake-snapshot --stake-pool-id 3ee7ce97d36822f511cac6bbd76b70350684f8bb4ced5366842a96c9 --mainnet >> ./results/stakeSnapshotCAHLI.json

# Hardcoded JSON file path
json_file="./results/stakeSnapshotCAHLI.json"

# Extract the pool ID dynamically
pool_id=$(jq -r '.pools | keys[]' "$json_file")

# Extract the "stakeMark" value for the dynamic pool ID
POOL_STAKE=$(jq -r ".pools.\"$pool_id\".stakeMark" "$json_file")

# Extract the "stakeMark" value from the "total" object
ACTIVE_STAKE=$(jq -r '.total.stakeMark' "$json_file")

echo "POOL_STAKE: $POOL_STAKE"
echo "ACTIVE_STAKE: $ACTIVE_STAKE"
echo "Deleting old leaderlogsCAHLI.json" >&2
rm ./results/OLDleaderlogsCAHLI.json
cp ./results/leaderlogsCAHLI.json ./results/OLDleaderlogsCAHLI.json
rm ./results/leaderlogsCAHLI.json
echo "Running CNCLI leaderlog for CAHLI..." >&2
#Taskset is used to assign a task to 0-5 cores (delete taskset -c 0,1,2,3,4,5 if you want to use all cores )
taskset -c 0,1,2,3,4,5 cncli leaderlog  --consensus cpraos --pool-id 3ee7ce97d36822f511cac6bbd76b70350684f8bb4ced5366842a96c9 --pool-vrf-skey /opt/cardano/cnode/priv/vrf/cahli/vrf.skey --byron-genesis $byron_genesis_location  --shelley-genesis $shelley_genesis_location  --active-stake $ACTIVE_STAKE --pool-stake $POOL_STAKE --ledger-set $search_type >> ./results/leaderlogsCAHLI.json
echo "CNCLI leaderlog FINISHED" >&2
echo "Starting image generation" >&2
sleep 1
curl localhost:$port/trigger?pool=CAHLI
sleep 1
echo "Bash script finished for CAHLI"





#echo "Script inished, restarting cnode.service to flush RAM"
#Restarting cardano-node to flush RAM
#sudo systemctl restart cnode.service
