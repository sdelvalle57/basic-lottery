pragma solidity ^0.4.17;

contract Lottery {
    
    address public manager;
    address[] public players;
    
    function Lottery() public {
        manager = msg.sender;
    }
    
    function enter() external payable {
        require(msg.value > 2 ether);
        players.push(msg.sender);
    }
    
    function _random() private view returns(uint) {
        return uint(keccak256(block.difficulty, now, players));
    }
    
    function pickWinner() external restricted {
        uint index = _random() % players.length;
        players[index].transfer(this.balance);
        players = new address[](0); //0 is initialize teh lenght of the array
    }
    
    modifier restricted(){
        require(msg.sender == manager);
        _;
    }
    
    function getPlayers() external view returns(address[]) {
        return players;
    }
}