import { IClientRepository } from '../domain/IClientRepository';
import { ClientNotFoundError } from '../domain/ClientErrors';
import { IPetRepository } from '../../pets/domain/IPetRepository';
import { IAppointmentRepository } from '../../appointments/domain/IAppointmentRepository';
import { IServiceRepository } from '../../services/domain/IServiceRepository';
import { APPOINTMENT_STATUS } from '../../appointments/domain/Appointment';
import { prisma } from '../../shared/infrastructure/prisma';

export class HardDeleteClientUseCase {
  constructor(
    private readonly clientRepository: IClientRepository,
    private readonly petRepository: IPetRepository,
    private readonly appointmentRepository: IAppointmentRepository,
    private readonly serviceRepository: IServiceRepository,
  ) {}

  async execute(id: number): Promise<void> {
    const client = await this.clientRepository.findByIdIncludeDeleted(id);

    if (!client) {
      throw new ClientNotFoundError(id);
    }

    const pets = await this.petRepository.findByClientIdIncludeDeleted(id);

    // Wrap all deletions in a single Prisma transaction for atomicity
    await prisma.$transaction(async (tx) => {
      // Cascade through pets: delete their appointments (except completed)
      // and services, then the pets themselves
      for (const pet of pets) {
        await this.appointmentRepository.hardDeleteByPetId(pet.id, [
          APPOINTMENT_STATUS.COMPLETED,
        ], tx);
        await this.serviceRepository.hardDeleteByPetId(pet.id, tx);
        await this.petRepository.hardDelete(pet.id, tx);
      }

      // Finally, hard-delete the client
      await this.clientRepository.hardDelete(id, tx);
    });
  }
}
