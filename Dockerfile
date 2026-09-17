# ---------------------------------------------------
# Etapa 1: Builder
# ---------------------------------------------------
FROM rust:1.82-bookworm AS builder

WORKDIR /usr/src/app

# Copiar dependencias y código fuente desde la carpeta backend
COPY backend/Cargo.toml backend/Cargo.lock ./
COPY backend/migrations ./migrations
COPY backend/src ./src

# Compilación optimizada para producción
RUN cargo build --release

# ---------------------------------------------------
# Etapa 2: Imagen Final Ultraliviana
# ---------------------------------------------------
FROM debian:bookworm-slim

# Instalar certificados CA para llamadas HTTPS seguras (Google OAuth)
RUN apt-get update && \
    apt-get install -y --no-install-recommends ca-certificates && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copiar binario compilado desde el builder
COPY --from=builder /usr/src/app/target/release/estuplani-backend /usr/local/bin/estuplani-backend

# Puerto por defecto
EXPOSE 3001

# Ejecutar el backend
CMD ["estuplani-backend"]
