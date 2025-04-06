import {
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  UseGuards,
} from '@nestjs/common';
import { DeviceViewDto } from './view-dto/devices.view-dto';
import { ApiCookieAuth, ApiParam } from '@nestjs/swagger';
import { RefreshTokenGuard } from '../guards/bearer/refresh-token-auth.guard';
import { ExtractUserFromRequest } from '../guards/decorators/param/extract-user-from-request.decorator';
import { UserContextDto } from '../guards/dto/user-context.dto';
import { ExtractDeviceFromCookie } from '../guards/decorators/param/extract-device-from-request.decorator';
import { DeviceContextDto } from '../guards/dto/device-context.dto';
import { CommandBus } from '@nestjs/cqrs';
import { TerminateAllOtherDevicesCommand } from '../application/usecases/terminate-all-other-devices.usecase';
import { TerminateDeviceCommand } from '../application/usecases/terminate-device.usecase';
import { SkipThrottle } from '@nestjs/throttler';
import { SecurityDevicesQueryRepository } from '../infrastructure/query/security-devices.query-repository';

@SkipThrottle()
@Controller('security/devices')
export class SecurityDevicesController {
  constructor(
    private securityDevicesQueryRepository: SecurityDevicesQueryRepository,
    private commandBus: CommandBus,
  ) {}

  @ApiCookieAuth('refreshToken')
  @UseGuards(RefreshTokenGuard)
  @Get()
  async getAllDevices(
    @ExtractUserFromRequest() user: UserContextDto,
  ): Promise<DeviceViewDto[]> {
    return this.securityDevicesQueryRepository.getAllDevices(user.id);
  }

  @ApiCookieAuth('refreshToken')
  @UseGuards(RefreshTokenGuard)
  @Delete()
  @HttpCode(HttpStatus.NO_CONTENT)
  async terminateAllOtherDevices(
    @ExtractUserFromRequest() user: UserContextDto,
    @ExtractDeviceFromCookie() device: DeviceContextDto,
  ): Promise<void> {
    return this.commandBus.execute(
      new TerminateAllOtherDevicesCommand(user.id, device.id),
    );
  }

  @ApiCookieAuth('refreshToken')
  @UseGuards(RefreshTokenGuard)
  @ApiParam({ name: 'id' })
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async terminateDeviceById(
    @ExtractUserFromRequest() user: UserContextDto,
    @Param('id') deviceId: string,
  ): Promise<void> {
    return this.commandBus.execute(
      new TerminateDeviceCommand(user.id, deviceId),
    );
  }
}
