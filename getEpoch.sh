#!/usr/bin/bash
echo "Getting Epoch info"
rm ./results/epochInfo.json
cardano-cli query tip --mainnet >> ./results/epochInfo.json
echo "EpochInfo Gotten"
