const assert = require('assert');
const Web3 = require('web3');
const web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545")); 
const { interface, bytecode } = require('../compile');

let accounts;
let lottery;

beforeEach(async () =>{
    accounts = await web3.eth.getAccounts();
    lottery = await new web3.eth.Contract(JSON.parse(interface))
        .deploy({data: bytecode})
        .send({from: accounts[0], gas: '1000000'});
});

describe('Lottery COntract', () =>{
    it('deploys a contract', ()=>{
        assert.ok(lottery.options.address);
    });
    it('allows one account to enter', async () =>{
        await lottery.methods.enter().send({
            from: accounts[0],
            value: web3.utils.toWei('3', 'ether')
        });
        const players = await lottery.methods.getPlayers().call({
            from: accounts[0]
        })
        assert.equal(accounts[0], players[0]);
        assert.equal(1, players.length);
    });

    it('allows multiple accounts to enter', async () =>{
        await lottery.methods.enter().send({
            from: accounts[0],
            value: web3.utils.toWei('3', 'ether')
        });
        await lottery.methods.enter().send({
            from: accounts[1],
            value: web3.utils.toWei('3', 'ether')
        });
        await lottery.methods.enter().send({
            from: accounts[2],
            value: web3.utils.toWei('3', 'ether')
        });
        const players = await lottery.methods.getPlayers().call({
            from: accounts[0]
        })
        assert.equal(accounts[0], players[0]);
        assert.equal(accounts[1], players[1]);
        assert.equal(accounts[2], players[2]);
        assert.equal(3, players.length);
    });

    it('requires a minimum amount of ether', async() =>{
        let e;
        try{
            await lottery.methods.enter().send({
                from: accounts[0], 
                value: web3.utils.toWei('1', 'ether')
            });
        } catch(err) {
            e = err;
        }
        assert(e);
    });

    it('only manager can call pickWinner', async() =>{
        try{
            await lottery.methods.pickWinner().send({
                from: accounts[1]
            })
        }catch(err){
            assert(err);
            return;
        }
        assert(false);
    });

    it('sends money to the winner and resets the players array, checks the contract final balance', async() =>{
        await lottery.methods.enter().send({
            from: accounts[0], 
            value: web3.utils.toWei('4', 'ether')
        });
        const initialBalance = await web3.eth.getBalance(accounts[0]);
        await lottery.methods.pickWinner().send({
            from: accounts[0]
        });
        const finalBalance = await web3.eth.getBalance(accounts[0]);
        const difference = finalBalance - initialBalance;
        console.log(difference);
        assert(difference > web3.utils.toWei('3.9'), 'ether');
        const players = await lottery.methods.getPlayers().call();
        assert.equal(0, players.length);
        const contractBalance = await web3.eth.getBalance(lottery.options.address);
        assert.equal(0, contractBalance);
    })

    
});