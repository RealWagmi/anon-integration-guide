/** @type import('hardhat/config').HardhatUserConfig */
require('@nomiclabs/hardhat-ethers');

module.exports = {
    solidity: '0.8.28',
    localhost: {
        url: 'http://127.0.0.1:8545', // Hardhat Network
    },
};
