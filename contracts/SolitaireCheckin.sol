// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract SolitaireCheckin {
    struct Player {
        uint256 totalPoints;
        uint256 streak;
        uint256 lastCheckinDay;
    }

    mapping(address => Player) public players;
    address public owner;
    mapping(address => bool) public operators;

    event CheckIn(address indexed player, uint256 day, uint256 streak, uint256 totalPoints);
    event RecordWin(address indexed player, uint256 score, uint256 newTotal);
    event OperatorUpdated(address indexed operator, bool enabled);

    modifier onlyOwner() {
        require(msg.sender == owner, "only owner");
        _;
    }

    modifier onlyOwnerOrOperator() {
        require(msg.sender == owner || operators[msg.sender], "not authorized");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    // ----------------------------------------------------------
    // 🔹 Yönetim
    // ----------------------------------------------------------
    function setOperator(address op, bool enabled) external onlyOwner {
        operators[op] = enabled;
        emit OperatorUpdated(op, enabled);
    }

    // ----------------------------------------------------------
    // 🔹 Admin/Operator fonksiyonları
    // ----------------------------------------------------------
    function checkInFor(address player, uint256 addPoints) external onlyOwnerOrOperator {
        _checkIn(player, addPoints);
    }

    function recordWinFor(address player, uint256 score) external onlyOwnerOrOperator {
        _recordWin(player, score);
    }

    // ----------------------------------------------------------
    // 🔹 Kullanıcı (self-call) fonksiyonları
    // ----------------------------------------------------------
    function checkIn(uint256 addPoints) external {
        _checkIn(msg.sender, addPoints);
    }

    function recordMyWin(uint256 score) external {
        _recordWin(msg.sender, score);
    }

    // ----------------------------------------------------------
    // 🔹 Internal mantık (tekrarsız)
    // ----------------------------------------------------------
    function _checkIn(address player, uint256 addPoints) internal {
        require(player != address(0), "bad player");
        Player storage p = players[player];
        uint256 today = block.timestamp / 1 days;
        require(p.lastCheckinDay < today, "already checked today");

        if (p.lastCheckinDay + 1 == today) p.streak += 1;
        else p.streak = 1;

        p.lastCheckinDay = today;
        p.totalPoints += addPoints;

        emit CheckIn(player, today, p.streak, p.totalPoints);
    }

    function _recordWin(address player, uint256 score) internal {
        require(player != address(0), "bad player");
        require(score > 0 && score < 5000, "invalid score");
        Player storage p = players[player];
        p.totalPoints += score;
        emit RecordWin(player, score, p.totalPoints);
    }

    // ----------------------------------------------------------
    // 🔹 View yardımcıları
    // ----------------------------------------------------------
    function getPlayer(address a) external view returns (Player memory) {
        return players[a];
    }

    function getMyStats() external view returns (Player memory) {
        return players[msg.sender];
    }
}
