import logging
import sys


def setup_logging(log_level: str = "INFO") -> None:
    root_logger = logging.getLogger()
    if root_logger.hasHandlers():
        root_logger.handlers.clear()

    formatter = logging.Formatter(
        fmt="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
        datefmt="%Y-%m-%dT%H:%M:%SZ"
    )

    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setFormatter(formatter)
    root_logger.addHandler(console_handler)

    level = getattr(logging, log_level.upper(), logging.INFO)
    root_logger.setLevel(level)

    logging.getLogger("uvicorn.access").setLevel(logging.WARNING)


def get_logger(module_name: str) -> logging.Logger:
    return logging.getLogger(module_name)
