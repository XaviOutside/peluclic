#!/usr/bin/env bash
# Seed script — inserts test data via the API
# Usage: bash scripts/seed.sh
set -euo pipefail

API="${API_URL:-http://localhost:3000/api/v1}"

echo "🌱 Seeding pfmaster..."

# ── Clients ──
echo "  → Clients..."
curl -sf -X POST "$API/clients" -H "Content-Type: application/json" \
  -d '{"name":"María García","email":"maria.g@example.com","phone":"+34 600 123 456"}' > /dev/null
curl -sf -X POST "$API/clients" -H "Content-Type: application/json" \
  -d '{"name":"Carlos Ruiz","email":"c.ruiz@example.com","phone":"+34 611 987 654"}' > /dev/null
curl -sf -X POST "$API/clients" -H "Content-Type: application/json" \
  -d '{"name":"Laura López","email":"laura.l@example.com","phone":"+34 622 345 678"}' > /dev/null
curl -sf -X POST "$API/clients" -H "Content-Type: application/json" \
  -d '{"name":"Javier Martínez","email":"javi.m@example.com","phone":"+34 633 111 222"}' > /dev/null
curl -sf -X POST "$API/clients" -H "Content-Type: application/json" \
  -d '{"name":"Ana Sánchez","email":"ana.s@example.com","phone":"+34 644 333 444"}' > /dev/null
curl -sf -X POST "$API/clients" -H "Content-Type: application/json" \
  -d '{"name":"Pedro Fernández","email":"pedro.f@example.com","phone":"+34 655 555 666"}' > /dev/null
curl -sf -X POST "$API/clients" -H "Content-Type: application/json" \
  -d '{"name":"Elena Torres","email":"elena.t@example.com","phone":"+34 666 777 888"}' > /dev/null
curl -sf -X POST "$API/clients" -H "Content-Type: application/json" \
  -d '{"name":"Diego Ramírez","email":"diego.r@example.com","phone":"+34 677 999 000"}' > /dev/null

# ── Pets ──
echo "  → Pets..."
curl -sf -X POST "$API/pets" -H "Content-Type: application/json" \
  -d '{"name":"Max","species":"Perro","breed":"Golden Retriever","clientId":1}' > /dev/null
curl -sf -X POST "$API/pets" -H "Content-Type: application/json" \
  -d '{"name":"Luna","species":"Gato","breed":"Siamés","clientId":1}' > /dev/null
curl -sf -X POST "$API/pets" -H "Content-Type: application/json" \
  -d '{"name":"Rocky","species":"Perro","breed":"Bulldog Francés","clientId":2}' > /dev/null
curl -sf -X POST "$API/pets" -H "Content-Type: application/json" \
  -d '{"name":"Bella","species":"Perro","breed":"Caniche","clientId":3}' > /dev/null
curl -sf -X POST "$API/pets" -H "Content-Type: application/json" \
  -d '{"name":"Coco","species":"Perro","breed":"Yorkshire","clientId":4}' > /dev/null
curl -sf -X POST "$API/pets" -H "Content-Type: application/json" \
  -d '{"name":"Nala","species":"Gato","breed":"Persa","clientId":5}' > /dev/null
curl -sf -X POST "$API/pets" -H "Content-Type: application/json" \
  -d '{"name":"Thor","species":"Perro","breed":"Pastor Alemán","clientId":6}' > /dev/null
curl -sf -X POST "$API/pets" -H "Content-Type: application/json" \
  -d '{"name":"Mía","species":"Gato","breed":"Bengalí","clientId":7}' > /dev/null
curl -sf -X POST "$API/pets" -H "Content-Type: application/json" \
  -d '{"name":"Toby","species":"Perro","breed":"Beagle","clientId":8}' > /dev/null
curl -sf -X POST "$API/pets" -H "Content-Type: application/json" \
  -d '{"name":"Kira","species":"Perro","breed":"Husky","clientId":8}' > /dev/null

# ── Services ──
echo "  → Services..."
curl -sf -X POST "$API/services" -H "Content-Type: application/json" \
  -d '{"name":"Baño completo","price":25}' > /dev/null
curl -sf -X POST "$API/services" -H "Content-Type: application/json" \
  -d '{"name":"Corte de pelo","price":35}' > /dev/null
curl -sf -X POST "$API/services" -H "Content-Type: application/json" \
  -d '{"name":"Corte de uñas","price":10}' > /dev/null
curl -sf -X POST "$API/services" -H "Content-Type: application/json" \
  -d '{"name":"Limpieza dental","price":45}' > /dev/null
curl -sf -X POST "$API/services" -H "Content-Type: application/json" \
  -d '{"name":"Peinado creativo","price":50}' > /dev/null
curl -sf -X POST "$API/services" -H "Content-Type: application/json" \
  -d '{"name":"Desparasitación","price":15}' > /dev/null

echo ""
echo "✅ Seed complete: 8 clients, 10 pets, 6 services"
