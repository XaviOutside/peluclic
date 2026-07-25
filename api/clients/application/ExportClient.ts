import { Client } from '../domain/Client';
import { IClientRepository } from '../domain/IClientRepository';
import { ClientNotFoundError } from '../domain/ClientErrors';
import { IPetRepository } from '../../pets/domain/IPetRepository';
import { Pet } from '../../pets/domain/Pet';
import { IAppointmentRepository } from '../../appointments/domain/IAppointmentRepository';
import { Appointment } from '../../appointments/domain/Appointment';
import { IServiceRepository } from '../../services/domain/IServiceRepository';
import { Service } from '../../services/domain/Service';
import type { ExportResponseDto, ExportedPet, ExportedAppointment, ExportedService } from '../interface/dtos/ExportResponseDto';
import { toClientResponseDto } from '../interface/dtos/ClientResponseDto';

/**
 * Use case: export all non-deleted data for a given client (Art. 20 GDPR data portability).
 *
 * Cross-company isolation: compares the client's companyId with the request's companyId
 * and throws ClientNotFoundError on mismatch to avoid information disclosure.
 */
export class ExportClientUseCase {
  constructor(
    private readonly clientRepository: IClientRepository,
    private readonly petRepository: IPetRepository,
    private readonly appointmentRepository: IAppointmentRepository,
    private readonly serviceRepository: IServiceRepository,
  ) {}

  async execute(clientId: number, companyId: number): Promise<ExportResponseDto> {
    const client = await this.clientRepository.findById(clientId);

    if (!client || client.companyId !== companyId) {
      throw new ClientNotFoundError(clientId);
    }

    // Fetch all non-deleted pets for the client (page 1, large limit for full export)
    const petResult = await this.petRepository.findAllByClientId(clientId, 1, 100);
    const pets = petResult.data;

    // Fetch all non-deleted appointments for the client
    const appointments = await this.appointmentRepository.findByClientId(clientId);

    // Fetch all non-deleted services for the client's pets
    const petIds = pets.map((p) => p.id);
    const services = petIds.length > 0
      ? await this.serviceRepository.findByPetIds(petIds)
      : [];

    return this.assembleExport(client, pets, appointments, services);
  }

  private assembleExport(
    client: Client,
    pets: Pet[],
    appointments: Appointment[],
    services: Service[],
  ): ExportResponseDto {
    return {
      exportedAt: new Date().toISOString(),
      dataSubject: {
        client: toClientResponseDto(client),
        pets: pets.map(mapPetToExport),
        appointments: appointments.map(mapAppointmentToExport),
        services: services.map(mapServiceToExport),
      },
    };
  }
}

/** Maps a domain Pet to the export format */
function mapPetToExport(pet: Pet): ExportedPet {
  const SEX_LABELS: Record<number, ExportedPet['sex']> = {
    0: 'unknown',
    1: 'male',
    2: 'female',
  };

  return {
    id: pet.id,
    clientId: pet.client_id,
    name: pet.name,
    species: pet.species,
    breed: pet.breed,
    sex: SEX_LABELS[pet.sex] ?? 'unknown',
    dateOfBirth: pet.dateOfBirth ? pet.dateOfBirth.toISOString() : null,
    weightKg: pet.weightKg,
    notes: pet.notes,
    status: pet.status === 1 ? 'active' : 'inactive',
    createdAt: pet.createdAt.toISOString(),
    updatedAt: pet.updatedAt.toISOString(),
  };
}

/** Maps a domain Appointment to the export format */
function mapAppointmentToExport(appointment: Appointment): ExportedAppointment {
  const STATUS_LABELS: Record<number, ExportedAppointment['status']> = {
    0: 'pending',
    1: 'confirmed',
    2: 'completed',
    3: 'cancelled',
  };

  return {
    id: appointment.id,
    petId: appointment.petId,
    scheduledAt: appointment.scheduledAt.toISOString(),
    status: STATUS_LABELS[appointment.status] ?? 'pending',
    notes: appointment.notes,
    createdAt: appointment.createdAt.toISOString(),
    updatedAt: appointment.updatedAt.toISOString(),
  };
}

/** Maps a domain Service to the export format */
function mapServiceToExport(service: Service): ExportedService {
  return {
    id: service.id,
    name: service.name,
    description: service.description,
    durationMinutes: service.durationMinutes,
    price: service.price,
    petId: service.petId,
    status: service.status === 1 ? 'active' : 'inactive',
    createdAt: service.createdAt.toISOString(),
    updatedAt: service.updatedAt.toISOString(),
  };
}
