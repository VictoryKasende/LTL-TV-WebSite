"""Structured JSON log formatter.

Output one JSON line per record — plays nicely with Loki / CloudWatch /
GCP Log Explorer / any log aggregator.
"""
from __future__ import annotations

import datetime as dt
import json
import logging


_LOG_RECORD_STANDARD_ATTRS = frozenset({
    'name', 'msg', 'args', 'levelname', 'levelno', 'pathname', 'filename',
    'module', 'exc_info', 'exc_text', 'stack_info', 'lineno', 'funcName',
    'created', 'msecs', 'relativeCreated', 'thread', 'threadName',
    'processName', 'process', 'message', 'taskName',
})


class JsonFormatter(logging.Formatter):
    def format(self, record: logging.LogRecord) -> str:
        payload = {
            'ts': dt.datetime.fromtimestamp(record.created, tz=dt.timezone.utc).isoformat(),
            'level': record.levelname,
            'logger': record.name,
            'message': record.getMessage(),
        }
        if record.exc_info:
            payload['exc'] = self.formatException(record.exc_info)
        # Pass through any ``extra=`` fields from callers.
        for key, value in record.__dict__.items():
            if key in _LOG_RECORD_STANDARD_ATTRS or key in payload:
                continue
            try:
                json.dumps(value)
                payload[key] = value
            except (TypeError, ValueError):
                payload[key] = repr(value)
        return json.dumps(payload, ensure_ascii=False)
