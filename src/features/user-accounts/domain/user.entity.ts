import { CreateUserDomainDto } from './dto/create-user.domain.dto';
import { DeletionStatus } from '../../../core/dto/deletion-status';
import {
  Column,
  Entity,
  Index,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Device } from './device.entity';
import { UserMeta } from './user-meta.entity';
import { BaseEntity } from '../../../core/entities/base.entity';
import { Player } from '../../quiz-game/players/domain/player.entity';

@Entity()
export class User extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Index()
  @Column({ unique: true })
  login: string;

  @Index()
  @Column({ unique: true })
  email: string;

  @Column()
  passwordHash: string;

  @Column({
    type: 'enum',
    enum: DeletionStatus,
    default: DeletionStatus.NotDeleted,
  })
  deletionStatus: DeletionStatus;

  @OneToOne(() => UserMeta, (userMeta) => userMeta.user, {
    cascade: true,
    eager: true,
  })
  userMeta: UserMeta;

  @OneToMany(() => Device, (device) => device.user)
  devices: Device[];

  @OneToMany(() => Player, (player) => player.user)
  players: Player[];

  static createInstance(dto: CreateUserDomainDto): User {
    const user = new this();
    user.email = dto.email;
    user.passwordHash = dto.passwordHash;
    user.login = dto.login;

    user.userMeta = UserMeta.createInstance(user);

    return user;
  }

  makeDeleted() {
    if (this.deletionStatus !== DeletionStatus.NotDeleted) {
      throw new Error('User already deleted');
    }
    this.deletionStatus = DeletionStatus.PermanentDeleted;
  }

  updatePasswordHash(passwordHash: string) {
    this.passwordHash = passwordHash;
  }

  setEmailConfirmationCode(code: string) {
    if (!this.userMeta) {
      throw new Error('UserMeta is not initialized');
    }
    this.userMeta.setEmailConfirmationCode(code);
  }

  updateEmailConfirmationStatus() {
    if (!this.userMeta) {
      throw new Error('UserMeta is not initialized');
    }
    this.userMeta.updateEmailConfirmationStatus();
  }

  setPasswordRecoveryCode(code: string) {
    if (!this.userMeta) {
      throw new Error('UserMeta is not initialized');
    }
    this.userMeta.setPasswordRecoveryCode(code);
  }
}
