---
name: data-pipeline
description: Build ETL/ELT pipelines — extraction from APIs, transformation with Pydantic models, loading to PostgreSQL, batch processing with Django management commands, streaming with async generators, data validation, checkpointing, and idempotent operations. Use when working with data ingestion, processing, or batch jobs.
---

# Data Pipeline Skill

Data processing patterns for the Python/Django AI service.

## When to Use
- Building ETL pipelines that extract, transform, and load data
- Creating Django management commands for batch processing
- Handling large datasets with chunking and pagination
- Adding data validation with Pydantic v2

## ETL Pipeline Base
```python
# services/ai-service/app/services/etl/base.py
from abc import ABC, abstractmethod
from pydantic import BaseModel
from typing import Generator, TypeVar, Generic

T = TypeVar("T", bound=BaseModel)

class ETLPipeline(ABC, Generic[T]):
    """Base ETL with batching and checkpointing."""
    def __init__(self, pipeline_name: str, batch_size: int = 100):
        self.pipeline_name = pipeline_name
        self.batch_size = batch_size

    @abstractmethod
    def extract(self) -> Generator[dict, None, None]: ...
    @abstractmethod
    def transform(self, raw: dict) -> T | None: ...
    @abstractmethod
    def load(self, records: list[T]) -> int: ...

    def run(self) -> dict:
        stats = {"extracted": 0, "transformed": 0, "loaded": 0, "errors": 0}
        batch: list[T] = []
        for raw in self.extract():
            stats["extracted"] += 1
            try:
                record = self.transform(raw)
                if record is None:
                    continue
                stats["transformed"] += 1
                batch.append(record)
            except Exception as e:
                stats["errors"] += 1
                logger.warning("Transform error: %s | id=%s", e, raw.get("id"))
                continue
            if len(batch) >= self.batch_size:
                stats["loaded"] += self.load(batch)
                self._save_checkpoint(stats)
                batch = []
        if batch:
            stats["loaded"] += self.load(batch)
        return stats
```

## Pydantic v2 Validation
```python
# services/ai-service/app/services/etl/models.py
from pydantic import BaseModel, Field, field_validator

class DocumentRecord(BaseModel):
    id: str
    title: str = Field(min_length=1, max_length=500)
    content: str = Field(min_length=1)
    source_url: str
    published_at: datetime

    @field_validator("source_url")
    @classmethod
    def validate_url(cls, v: str) -> str:
        if not v.startswith(("http://", "https://")):
            raise ValueError("source_url must be an HTTP(S) URL")
        return v
```

## API Extraction with Pagination
```python
# services/ai-service/app/services/etl/extractors.py
class PaginatedAPIExtractor:
    def __init__(self, base_url: str, api_key: str, page_size: int = 100):
        self.base_url, self.page_size = base_url, page_size
        self.headers = {"Authorization": f"Bearer {api_key}"}

    def extract(self) -> Generator[dict, None, None]:
        cursor: str | None = None
        while True:
            params = {"limit": self.page_size, **({"cursor": cursor} if cursor else {})}
            data = httpx.get(self.base_url, headers=self.headers,
                             params=params, timeout=30).raise_for_status().json()
            yield from data["items"]
            if not (cursor := data.get("next_cursor")):
                break
```

## Idempotent Loading (Upsert)
```python
# services/ai-service/app/services/etl/loaders.py
class IdempotentLoader:
    def load(self, records: list[DocumentRecord]) -> int:
        if not records:
            return 0
        values = [(r.id, r.title, r.content, r.source_url, r.published_at) for r in records]
        with connection.cursor() as cur:
            cur.executemany("""
                INSERT INTO documents (id, title, content, source_url, published_at)
                VALUES (%s, %s, %s, %s, %s)
                ON CONFLICT (id) DO UPDATE SET
                    title = EXCLUDED.title, content = EXCLUDED.content
            """, values)
        return len(records)
```

## Django Management Command
```python
# services/ai-service/app/management/commands/run_pipeline.py
class Command(BaseCommand):
    help = "Run the document ingestion ETL pipeline"
    def add_arguments(self, parser):
        parser.add_argument("--batch-size", type=int, default=100)
        parser.add_argument("--dry-run", action="store_true")
        parser.add_argument("--source", type=str, required=True, choices=["api", "csv", "s3"])
    def handle(self, *args, **options):
        stats = DocumentPipeline(batch_size=options["batch_size"],
            dry_run=options["dry_run"], source=options["source"]).run()
        self.stdout.write(self.style.SUCCESS(f"{stats['loaded']} loaded, {stats['errors']} errors"))
```

## Pipeline Monitoring
Use a decorator to log duration, record counts, and errors to `PipelineMetric`. Track `pipeline_name`, `duration_s`, `status` (success/failed), and `stats` or `error` fields. Alert on failures via logging or webhook.

## Anti-Patterns
- **No checkpointing** -- crashes lose all progress, must restart from zero
- **Loading one record at a time** -- use batch inserts (100-1000 per batch)
- **No idempotency** -- re-runs create duplicates; always use upsert
- **Unbounded memory** -- loading full dataset at once; use generators and chunking
- **Silent data drops** -- skipped records must be logged with IDs and reasons
- **No validation** -- raw data loaded directly; always validate with Pydantic first

## Checklist
- [ ] Extraction uses generators, never loads full dataset into memory
- [ ] All records validated with Pydantic before loading
- [ ] Batch size configurable (default 100), loading uses upsert (`ON CONFLICT`)
- [ ] Checkpoints saved after each batch for crash recovery
- [ ] Errors logged with record IDs, not silently swallowed
- [ ] Management command supports `--dry-run`
- [ ] Pipeline metrics (duration, counts, errors) tracked
- [ ] API extractors handle pagination; credentials from environment variables
