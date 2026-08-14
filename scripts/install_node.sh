#!/usr/bin/env bash
set -e
export NVM_DIR="/home/abhiram_bency/.nvm"
source "$NVM_DIR/nvm.sh"
nvm install 20
nvm use 20
node --version
npm --version
