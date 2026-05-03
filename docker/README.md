# Docker Assets

Thư mục `docker/` chứa các file hỗ trợ hạ tầng local.

Hiện tại gồm:

- `postgres/init/01-pgvector.sql`: init script tạo extension `vector`.

Khi chạy `docker compose up -d`, script init sẽ được Postgres thực thi trong lần khởi tạo đầu tiên của volume.
