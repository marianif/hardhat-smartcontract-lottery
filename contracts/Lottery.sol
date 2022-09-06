// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity 0.8.7;

// Enter the lottery (payin some amount)
// Pick a random winner (verifiably random)
// Winner to be selected every X minutes (completely automated)

// Chainlink Oracle => Randomness , Automated execution (Chainlink Keepers)
import "@chainlink/contracts/src/v0.8/interfaces/VRFCoordinatorV2Interface.sol";
import "@chainlink/contracts/src/v0.8/VRFConsumerBaseV2.sol";
import "@chainlink/contracts/src/v0.8/interfaces/KeeperCompatibleInterface.sol";

error Lottery__NotEnoughEthError();
error Lottery__TransactionFailed();
error Lottery__NotOpen();
error Lottery__UpkeedNotNeeded(uint256 currentBalance, uint256 numPlayers, uint256 lotteryState);

/**
 * @title a sample Lottery Contract
 * @author Federica Mariani
 * @notice This contract is for creating a random and veryfiable smart contract lottery
 * @dev This implements Chainlink VRF v2 and Chainlink Keepers
 */

contract Lottery is VRFConsumerBaseV2, KeeperCompatibleInterface {
    /* Types */

    enum LotteryState {
        OPEN,
        CALCULATING
    }
    /* State Variables */
    uint256 private immutable i_entranceFee;
    address payable[] private s_players;
    bytes32 private immutable i_gasLane;
    uint64 private immutable i_subscriptionId;
    uint32 private immutable i_callbackGasLimit;
    uint256 private immutable i_interval;
    uint16 private constant REQUEST_CONFIRMATIONS = 3;
    uint32 private constant NUM_WORDS = 1;
    VRFCoordinatorV2Interface private immutable i_vrfCoordinator;

    /* Lottery Variables */
    address payable private s_recentWinner;
    bool private s_upkeepNeeded;
    LotteryState private s_lotteryState;
    uint256 private s_lastTimestamp;

    /* Events */
    event LotteryEnter(address indexed player);
    event RequestedLotteryWinner(uint256 indexed requestId);
    event WinnerPicked(address indexed winner);

    constructor(
        address vrfCoordinatorV2,
        uint256 entranceFee,
        bytes32 gasLane,
        uint64 subscriptionId,
        uint32 callbackGasLimit,
        uint256 interval
    ) VRFConsumerBaseV2(vrfCoordinatorV2) {
        i_entranceFee = entranceFee;
        i_vrfCoordinator = VRFCoordinatorV2Interface(vrfCoordinatorV2);
        i_gasLane = gasLane;
        i_subscriptionId = subscriptionId;
        i_callbackGasLimit = callbackGasLimit;
        s_lotteryState = LotteryState.OPEN;
        s_lastTimestamp = block.timestamp;
        i_interval = interval;
    }

    function enterLottery() public payable {
        // expensive way
        //// require(msg.value < i_entranceFee, "Not enogh ETH!")

        // cheaper way with new error syntax
        if (msg.value < i_entranceFee) {
            revert Lottery__NotEnoughEthError();
        }

        // check if the lottwey is open
        if (s_lotteryState != LotteryState.OPEN) {
            revert Lottery__NotOpen();
        }
        // msg.sender is not a payable address itself
        // hence we turn it into a payable address w/ payable keyword
        s_players.push(payable(msg.sender));

        // Emit and event when we update a dynamic array or mapping
        // Events gets emitted in data storage outside of the smart-contract
        // Basically, events are more cost efficient
        emit LotteryEnter(msg.sender);
    }

    /**
     * @dev this is the function that the chainlink keeper nodes call
     * they look for the "upkeepNeede" to return true.
     * In order to be true:
     * 1. Our time interval must be passed
     * 2. the lottery should have at least one player and some ETH balance
     * 3. Our subscription is funded with LINK
     * 4. the lottery should should be in a "open" state
     */

    function checkUpkeep(
        bytes memory /* checkData */
    )
        public
        view
        override
        returns (
            bool upkeepNeeded,
            bytes memory /* performData */
        )
    {
        bool isOpen = (LotteryState.OPEN == s_lotteryState);
        bool timePassed = (block.timestamp - s_lastTimestamp) > i_interval;
        bool hasPlayers = s_players.length > 0;
        bool hasBalance = address(this).balance > 0;
        upkeepNeeded = (isOpen && timePassed && hasPlayers && hasBalance);
    }

    /**
     * @dev this function should trigger if checkUpkeep returns true
     *
     */

    function performUpkeep(
        bytes calldata /* performData*/
    ) external override {
        // request the random number
        // do something with it
        // 2 transaction process
        (bool upkeepNeeded, ) = checkUpkeep("");
        if (!upkeepNeeded) {
            revert Lottery__UpkeedNotNeeded(
                address(this).balance,
                s_players.length,
                uint256(s_lotteryState)
            );
        }

        s_lotteryState = LotteryState.CALCULATING;
        // returns a unique requestId
        uint256 requestId = i_vrfCoordinator.requestRandomWords(
            i_gasLane,
            i_subscriptionId,
            REQUEST_CONFIRMATIONS,
            i_callbackGasLimit,
            NUM_WORDS
        );

        emit RequestedLotteryWinner(requestId);
    }

    function fulfillRandomWords(
        uint256, /* requestId */
        uint256[] memory randomWords
    ) internal override {
        uint256 indexOfWinner = randomWords[0] % s_players.length;
        address payable recentWinner = s_players[indexOfWinner];
        s_recentWinner = recentWinner;
        s_lotteryState = LotteryState.OPEN;
        // reset players array after winner is chosen
        s_players = new address payable[](0);
        // update timestamp
        s_lastTimestamp = block.timestamp;
        // try send money to the winner
        (bool success, ) = recentWinner.call{value: address(this).balance}("");
        if (!success) {
            revert Lottery__TransactionFailed();
        }
        emit WinnerPicked(recentWinner);
    }

    function getEntranceFee() public view returns (uint256) {
        return i_entranceFee;
    }

    function getPlayer(uint256 index) public view returns (address) {
        return s_players[index];
    }

    function getRecentWinner() public view returns (address) {
        return s_recentWinner;
    }

    function getLotteryState() public view returns (LotteryState) {
        return s_lotteryState;
    }

    // since NUM_WORDS is a constant variable
    // it's actually stored in the bytecode, not in storage
    // therefore it can be a pure function
    function getNumWords() public pure returns (uint256) {
        return NUM_WORDS;
    }

    function getRequestConfirmations() public pure returns (uint256) {
        return REQUEST_CONFIRMATIONS;
    }

    function getNumberOfPlayers() public view returns (uint256) {
        return s_players.length;
    }

    function getLatestTimestamp() public view returns (uint256) {
        return s_lastTimestamp;
    }

    function getInterval() public view returns (uint256) {
        return i_interval;
    }
}
