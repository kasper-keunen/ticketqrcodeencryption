// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { ERC721 } from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";
import { IConditionalTicketBurn } from "./interfaces/IConditionalTicketBurn.sol";

contract ConditionalTicketBurn is IConditionalTicketBurn, Ownable, ERC721("CondititionalTicketSimpleBurn", "CTSB") {
    using EnumerableSet for EnumerableSet.UintSet;

    uint256 public tokenIdCounter;
    uint256 public eventIdCounter;

    // eventId => ticket tokenIds
    mapping(uint256 => EnumerableSet.UintSet) private eventTickets;

    // address => if is allowed to mint
    mapping(address => bool) public isMinter;

    // tokenId => IPFS hash
    mapping(uint256 => string) public encryptedDataPreRelease;

    mapping(address => bool) public isHandler;

    // tokenId => IPFS hash
    mapping(uint256 => string) public encryptedDataPostRelease;

    // eventId => event round information
    mapping(uint256 => EventRoundInformation) public eventRounds;

    // tokenId => ticket info
    mapping(uint256 => TicketInfo) public ticketInfoStorage;

    // enum TicketStatus {
    //     NONE, // nft does not exist
    //     ACTIVE_VALID, // nft can be moved
    //     LOCKED, // nft cannot be moved until the game/match is resovled
    //     REDEEMED, // nft cannot be moved forever as the user has redeemed the nft for the underlying data
    //     INVALIDATED // nft cannot be moved as the user has lost the underlying data
    // }

    // event TicketRedeemed(uint256 indexed tokenId, TicketInfo indexed info, string indexed encryptedPost);

    // event HandlerSet(address indexed handler, bool value);

    // struct EventRoundInformation {
    //     uint256 roundId;
    //     uint256 startTime;
    //     uint256 endTime;
    //     uint256 ticketPrice;
    //     uint256 maxTickets;
    //     uint256 maxTicketsPerAddress;
    // }

    // struct TicketInfo {
    //     TicketStatus status;
    //     string ticketDescription;
    //     string ticketMeta1;
    //     string ticketMeta2;
    //     uint32 eventIndex;
    //     uint64 externalTokenId;
    //     uint64 eventRoundId;
    //     uint64 ticketPrice;
    // }

    // error NotMinter(address);

    // error NotOwner(address);

    // error TicketNotActive(uint256 tokenId);

    // error TicketIsLocked(uint256 tokenId);

    // error TicketDoesNotExist(uint256 tokenId);

    // error TicketIsRedeemed(uint256 tokenId);

    // error NotHandler(address);

    // event MinterAdded(address indexed minter, bool value);

    // event TicketInvalidated(uint256 indexed tokenId);

    // event TicketMinted(uint256 indexed tokenId, address indexed to, TicketInfo indexed info);

    // event EventRoundCreated(uint256 indexed eventId, EventRoundInformation indexed info);

    constructor(address _owner) Ownable() {
        _transferOwnership(_owner);
    }

    modifier onlyHandler() {
        if (!isHandler[msg.sender]) revert NotHandler(msg.sender);
        _;
    }

    /**
     * @notice Adds a minter role (so the protocol dapp role)
     * @param minter The address of the minter
     * @param value The value of the minter
     */
    function addMinter(address minter, bool value) public onlyOwner {
        isMinter[minter] = value;
        emit MinterAdded(minter, value);
    }

    function _baseURI() internal view virtual override returns (string memory) {
        return "www.parlaytix.xyz/ticket/";
    }

    function _mintToken(uint256 _tokenId, address _recipient) internal returns (uint256) {
        _mint(_recipient, _tokenId);
        return _tokenId;
    }

    /**
     * @notice Mints a simple conditional ticket with random data
     * @param to The address of the recipient
     * @param encryptedPre The encrypted data of the ticket
     */
    function mintConditionalTicketSimple(
        address to,
        string memory encryptedPre,
        uint256 eventIndex
    ) public override returns (uint256 tokenId_) {
        tokenIdCounter++;
        tokenId_ = tokenIdCounter;
        _mintToken(tokenId_, to);
        TicketInfo memory ticketInfo_ = TicketInfo({
            status: TicketStatus.ACTIVE_VALID,
            ticketDescription: "Simple ticket",
            ticketMeta1: "Simple ticket",
            ticketMeta2: "Simple ticket",
            eventIndex: uint32(eventIndex),
            externalTokenId: 192391349,
            eventRoundId: 2,
            ticketPrice: 100000
        });
        encryptedDataPreRelease[tokenId_] = encryptedPre;
        ticketInfoStorage[tokenId_] = ticketInfo_;
        emit TicketMinted(tokenId_, to, ticketInfo_);
        return tokenId_;
    }

    /**
     * @notice Mints a conditional ticket
     * @param to The address of the recipient
     * @param encryptedPre The encrypted data of the ticket
     * @param ticketInfo The ticket information
     */
    function mintConditionalTicketNft(
        address to,
        string memory encryptedPre,
        TicketInfo memory ticketInfo
    ) public override returns (uint256 tokenId_) {
        tokenIdCounter++;
        tokenId_ = tokenIdCounter;
        _mintToken(tokenId_, to);
        encryptedDataPreRelease[tokenIdCounter] = encryptedPre;
        ticketInfoStorage[tokenIdCounter] = ticketInfo;
        eventTickets[ticketInfo.eventIndex].add(tokenIdCounter);
        emit TicketMinted(tokenIdCounter, to, ticketInfo);
        return tokenIdCounter;
    }

    function invalidateConditionalTicket(uint256 tokenId) public override {
        require(tokenId <= tokenIdCounter, "Token ID does not exist");
        ticketInfoStorage[tokenId].status = TicketStatus.INVALIDATED;
        _burn(tokenId);
        emit TicketInvalidated(tokenId);
    }

    /**
     * @notice Redeems a conditional ticket by the user
     * @param tokenId The token id of the ticket
     * @param encryptedPost The encrypted data of the ticket
     */
    function redeemConditionalTicket(uint256 tokenId, string memory encryptedPost) public override {
        require(tokenId <= tokenIdCounter, "Token ID does not exist");
        // check if caller is the owner of the token
        require(ownerOf(tokenId) == msg.sender, "Caller is not the owner of the token");
        TicketInfo memory ticketInfo_ = ticketInfoStorage[tokenId];
        ticketInfo_.status = TicketStatus.REDEEMED;
        ticketInfoStorage[tokenId] = ticketInfo_;
        encryptedDataPostRelease[tokenId] = encryptedPost;
        _burn(tokenId);
        emit TicketRedeemed(tokenId, ticketInfo_, encryptedPost);
    }

    function redeemConditionalTicketByProtocol(
        uint256 tokenId,
        string memory encryptedPost
    ) public override onlyHandler {
        require(tokenId <= tokenIdCounter, "Token ID does not exist");
        TicketInfo memory ticketInfo_ = ticketInfoStorage[tokenId];
        ticketInfo_.status = TicketStatus.REDEEMED;
        ticketInfoStorage[tokenId] = ticketInfo_;
        encryptedDataPostRelease[tokenId] = encryptedPost;
        _burn(tokenId);
        emit TicketRedeemed(tokenId, ticketInfo_, encryptedPost);
    }

    function createRandomEvent() public override returns (uint256 eventId_) {
        eventIdCounter++;
        eventId_ = eventIdCounter;
        EventRoundInformation memory info_ = EventRoundInformation({
            roundId: eventId_,
            startTime: block.timestamp,
            endTime: block.timestamp + 1000000,
            ticketPrice: 1000,
            maxTickets: 100,
            maxTicketsPerAddress: 100
        });
        eventRounds[eventId_] = info_;
        return eventId_;
    }

    /**
     * @notice Creates an event round by handler
     * @param startTime The start time of the event round
     * @param endTime The end time of the event round
     * @param ticketPrice The price of the ticket
     * @param maxTickets The maximum number of tickets that can be sold
     * @param maxTicketsPerAddress The maximum number of tickets that can be sold per address
     */
    function createEventRound(
        uint256 startTime,
        uint256 endTime,
        uint256 ticketPrice,
        uint256 maxTickets,
        uint256 maxTicketsPerAddress
    ) public override returns (uint256 eventId_) {
        eventIdCounter++;
        eventId_ = eventIdCounter;
        EventRoundInformation memory info_ = EventRoundInformation({
            roundId: eventId_,
            startTime: startTime,
            endTime: endTime,
            ticketPrice: ticketPrice,
            maxTickets: maxTickets,
            maxTicketsPerAddress: maxTicketsPerAddress
        });
        emit EventRoundCreated(eventId_, info_);
        eventRounds[eventId_] = info_;
        return eventId_;
    }

    function returnEventTickets(uint256 eventId, uint256 amount) public view returns (uint256[] memory array_) {
        array_ = new uint256[](amount);
        for (uint256 i = 0; i < amount; i++) {
            array_[i] = eventTickets[eventId].values()[i];
        }
        return array_;
    }

    function returnTicketInfo(uint256 tokenId) public view returns (TicketInfo memory) {
        return ticketInfoStorage[tokenId];
    }

    function returnEventRoundInfo(uint256 eventId) public view returns (EventRoundInformation memory) {
        return eventRounds[eventId];
    }

    function setIsHandler(address _address, bool _value) public onlyOwner {
        isHandler[_address] = _value;
        emit HandlerSet(_address, _value);
    }
}
