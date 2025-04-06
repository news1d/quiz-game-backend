import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { SecurityDevicesRepository } from '../../infrastructure/security-devices.repository';

export class TerminateDeviceCommand {
  constructor(
    public userId: string,
    public deviceId: string,
  ) {}
}

@CommandHandler(TerminateDeviceCommand)
export class TerminateDeviceUseCase
  implements ICommandHandler<TerminateDeviceCommand>
{
  constructor(private securityDevicesRepository: SecurityDevicesRepository) {}

  async execute({ userId, deviceId }: TerminateDeviceCommand) {
    const device =
      await this.securityDevicesRepository.getDeviceByIdAndUserIdOrFails(
        userId,
        deviceId,
      );

    device.makeDeleted();
    await this.securityDevicesRepository.save(device);
  }
}
