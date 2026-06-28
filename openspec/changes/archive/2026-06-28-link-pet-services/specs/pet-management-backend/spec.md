# Delta for pet-management-backend

## MODIFIED Requirements

### Requirement: Soft-Delete Pet (FR-6)

`DELETE /api/v1/pets/:id` — MUST first unlink all services linked to this pet via `IServiceRepository.unlinkAllByPetId(id)`, then set `deleted_at=NOW()`. Returns 204. Already-deleted returns 409. `IPetRepository` signature unchanged.

(Previously: no service cascade — only soft-deleted the pet row.)

#### Scenario: Soft-delete with service unlink

- GIVEN non-deleted pet id=7 linked to 3 services
- WHEN `DELETE /api/v1/pets/7` is called
- THEN all 3 services get petId=null, pet.deletedAt set to UTC now, 204

#### Scenario: Soft-delete with no linked services

- GIVEN non-deleted pet id=7 with no linked services
- WHEN `DELETE /api/v1/pets/7` is called
- THEN pet.deletedAt set, 204 (unlinkAllByPetId is no-op)

#### Scenario: Already deleted

- GIVEN pet id=7 with deletedAt not null
- WHEN `DELETE /api/v1/pets/7` is called
- THEN 409 `"Pet with id 7 is already deleted"` (no unlink, no cascade)
