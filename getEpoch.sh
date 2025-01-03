#!/usr/bin/bash
export CARDANO_NODE_SOCKET_PATH=/opt/cardano/cnode/sockets/node.socket
echo "Getting Epoch info"
rm ./results/epochInfo.json
cardano-cli query tip --mainnet >> ./results/epochInfo.json
echo "EpochInfo Gotten"
