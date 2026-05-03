# Postgres Init

Thư mục này chứa SQL scripts khởi tạo cho PostgreSQL container.

## Hiện tại

- `init/01-pgvector.sql`: bật extension `pgvector`.

## Lưu ý

- Scripts trong `/docker-entrypoint-initdb.d` chỉ chạy khi volume DB được tạo mới.
- Nếu muốn chạy lại scripts, cần xóa volume `postgres_data` rồi khởi động lại.
