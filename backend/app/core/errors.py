class BidBullError(Exception):
    def __init__(self, message: str, status_code: int = 400) -> None:
        super().__init__(message)
        self.message = message
        self.status_code = status_code


class BidTooLowError(BidBullError):
    def __init__(self, message: str) -> None:
        super().__init__(message=message, status_code=400)


class AuctionClosedError(BidBullError):
    def __init__(self, message: str = "Auction has already closed") -> None:
        super().__init__(message=message, status_code=410)


class AuctionNotActiveError(BidBullError):
    def __init__(self, message: str = "Auction is not currently active") -> None:
        super().__init__(message=message, status_code=400)


class ConcurrencyConflictError(BidBullError):
    def __init__(self, message: str = "Concurrent bid conflict, please retry") -> None:
        super().__init__(message=message, status_code=409)


class ItemNotFoundError(BidBullError):
    def __init__(self, message: str = "Auction item not found") -> None:
        super().__init__(message=message, status_code=404)


class UserAlreadyExistsError(BidBullError):
    def __init__(self, message: str = "Username or email already registered") -> None:
        super().__init__(message=message, status_code=409)


class AuthenticationFailedError(BidBullError):
    def __init__(self, message: str = "Invalid username or password") -> None:
        super().__init__(message=message, status_code=401)


class SelfBiddingProhibitedError(BidBullError):
    def __init__(self, message: str = "Sellers cannot bid on their own listings") -> None:
        super().__init__(message=message, status_code=400)
