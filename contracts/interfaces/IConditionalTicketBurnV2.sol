// SPDX-License-Identifier: MIT

pragma solidity >=0.6.2 ^0.8.0;

interface IConditionalTicketBurnV2 {
    enum TicketStatus {
        NONE, // nft does not exist
        ACTIVE_VALID, // nft can be moved
        LOCKED, // nft cannot be moved until the game/match is resovled
        REDEEMED, // nft cannot be moved forever as the user has redeemed the nft for the underlying data
        INVALIDATED // nft cannot be moved as the user has lost the underlying data
    }

    event TicketRedeemed(uint256 indexed tokenId, TicketInfo indexed info, string indexed encryptedPost);

    struct EventRoundInformation {
        uint256 roundId;
        uint256 startTime;
        uint256 endTime;
        uint256 ticketPrice;
        uint256 maxTickets;
        uint256 maxTicketsPerAddress;
    }

    struct TicketInfo {
        TicketStatus status;
        string ticketDescription;
        string ticketMeta1;
        string ticketMeta2;
        uint32 eventIndex;
        uint64 externalTokenId;
        uint64 eventRoundId;
        uint64 ticketPrice;
    }

    error NotMinter(address);

    error NotOwner(address);

    error TicketNotActive(uint256 tokenId);

    error TicketIsLocked(uint256 tokenId);

    error TicketDoesNotExist(uint256 tokenId);

    error TicketIsRedeemed(uint256 tokenId);

    error NotHandler(address);

    event MinterAdded(address indexed minter, bool value);

    event TicketInvalidated(uint256 indexed tokenId);

    event TicketMinted(uint256 indexed tokenId, address indexed to, TicketInfo indexed info);

    event EventRoundCreated(uint256 indexed eventId, EventRoundInformation indexed info);

    event HandlerSet(address indexed handler, bool value);

    // Functions

    function mintConditionalTicketSimple(
        address to,
        string memory encryptedPre,
        uint256 eventIndex
    ) external returns (uint256 tokenId_);

    function mintConditionalTicketNft(
        address to,
        string memory encryptedPre,
        TicketInfo memory ticketInfo
    ) external returns (uint256 tokenId_);

    function redeemConditionalTicket(uint256 tokenId, string memory encryptedPost) external;

    function invalidateConditionalTicket(uint256 tokenId) external;

    function redeemConditionalTicketByProtocol(uint256 tokenId, string memory encryptedPost) external;

    function createRandomEvent() external returns (uint256 eventId_);

    function createEventRound(
        uint256 startTime,
        uint256 endTime,
        uint256 ticketPrice,
        uint256 maxTickets,
        uint256 maxTicketsPerAddress
    ) external returns (uint256 eventId_);
}
